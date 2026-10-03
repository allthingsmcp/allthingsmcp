import { randomUUID } from "node:crypto";
import {
  CLIENT_CAPABILITIES_META_KEY,
  CLIENT_INFO_META_KEY,
  createMcpHandler,
  McpServer,
  PROTOCOL_VERSION_META_KEY,
} from "@modelcontextprotocol/server";
import { getMcpTemplate } from "@all-things-mcp/mcp-templates";
import type {
  McpProtocolEvent,
  McpWorkspace,
  McpWorkspaceCommand,
} from "@all-things-mcp/contracts";
import * as z from "zod/v4";
import {
  OpenMeteoProvider,
  openMeteoAttribution,
  WeatherProviderError,
} from "./weather.js";

const sensitiveKey = /authorization|token|credential|secret|cookie/i;
export function redactProtocolValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactProtocolValue);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        sensitiveKey.test(key) ? "[REDACTED]" : redactProtocolValue(item),
      ]),
    );
  return value;
}

function fieldSchema(field: {
  type: string;
  enumValues?: string[];
  required: boolean;
}) {
  let schema: z.ZodType = field.enumValues?.length
    ? z.enum(field.enumValues as [string, ...string[]])
    : field.type === "number"
      ? z.number()
      : field.type === "boolean"
        ? z.boolean()
        : z.string();
  if (!field.required) schema = schema.optional();
  return schema;
}

export function createWorkspaceMcpHandler(
  workspace: McpWorkspace,
  weather = new OpenMeteoProvider(),
) {
  const template = getMcpTemplate(
    workspace.templateId,
    workspace.templateVersion,
  );
  if (!template) throw new Error("Unknown MCP template version.");
  const enabled = new Set(workspace.configuration.enabledCapabilityIds);

  return createMcpHandler(
    () => {
      const server = new McpServer({
        name: workspace.configuration.serverName,
        version: template.serverVersion,
      });
      for (const capability of template.capabilities.filter((item) =>
        enabled.has(item.id),
      )) {
        if (capability.kind === "tool") {
          const shape = Object.fromEntries(
            capability.fields.map((field) => [field.name, fieldSchema(field)]),
          );
          server.registerTool(
            capability.name,
            {
              title: capability.title,
              description: capability.description,
              inputSchema: z.object(shape),
            },
            async (input: Record<string, unknown>) => {
              try {
                const result =
                  capability.executorId === "weather.current"
                    ? await weather.current(
                        String(input.location ?? ""),
                        String(input.unit ?? "celsius"),
                      )
                    : capability.executorId === "weather.forecast"
                      ? await weather.forecast(String(input.location ?? ""))
                      : capability.executorId === "weather.search"
                        ? await weather.search(String(input.query ?? ""))
                        : undefined;
                if (!result) throw new Error("Unknown curated tool executor.");
                return {
                  content: [
                    { type: "text" as const, text: JSON.stringify(result) },
                  ],
                  structuredContent: result,
                };
              } catch (error) {
                if (!(error instanceof WeatherProviderError)) throw error;
                return {
                  isError: true,
                  content: [{ type: "text" as const, text: error.message }],
                  _meta: { "atm/error-code": error.code },
                };
              }
            },
          );
        } else if (capability.kind === "resource") {
          server.registerResource(
            capability.name,
            capability.uri!,
            {
              title: capability.title,
              description: capability.description,
              mimeType: capability.mimeType,
            },
            async (uri) => ({
              contents: [
                {
                  uri: uri.href,
                  mimeType: capability.mimeType,
                  text:
                    capability.executorId === "weather.cities"
                      ? JSON.stringify({
                          cities: ["Lagos", "London", "San Francisco"],
                          attribution: openMeteoAttribution,
                        })
                      : `# Weather API usage\n\nLive data is supplied by [Open-Meteo](${openMeteoAttribution.url}) under CC BY 4.0.`,
                },
              ],
            }),
          );
        } else {
          const shape = Object.fromEntries(
            capability.fields.map((field) => [field.name, fieldSchema(field)]),
          );
          server.registerPrompt(
            capability.name,
            {
              title: capability.title,
              description: capability.description,
              argsSchema: z.object(shape),
            },
            (input: Record<string, unknown>) => ({
              messages: [
                {
                  role: "user" as const,
                  content: {
                    type: "text" as const,
                    text: capability.fields.reduce(
                      (text, field) =>
                        text.replaceAll(
                          `{${field.name}}`,
                          String(input[field.name] ?? ""),
                        ),
                      capability.template ?? "",
                    ),
                  },
                },
              ],
            }),
          );
        }
      }
      return server;
    },
    { responseMode: "auto" },
  );
}

function requestFor(
  method: string,
  params: Record<string, unknown> | undefined,
  id: number,
) {
  return {
    jsonrpc: "2.0",
    id,
    method,
    params: {
      _meta: {
        [PROTOCOL_VERSION_META_KEY]: "2026-07-28",
        [CLIENT_INFO_META_KEY]: {
          name: "atm-learning-client",
          version: "0.1.0",
        },
        [CLIENT_CAPABILITIES_META_KEY]: {},
      },
      ...params,
    },
  };
}

export async function executeWorkspaceCommand(
  workspace: McpWorkspace,
  command: McpWorkspaceCommand,
  weather?: OpenMeteoProvider,
) {
  const handler = createWorkspaceMcpHandler(workspace, weather);
  const exchanges: Array<{ method: string; params?: Record<string, unknown> }> =
    command.type === "discover"
      ? [{ method: "server/discover" }]
      : command.type === "call-tool"
        ? [
            {
              method: "tools/call",
              params: { name: command.name, arguments: command.arguments },
            },
          ]
        : command.type === "read-resource"
          ? [{ method: "resources/read", params: { uri: command.uri } }]
          : [
              {
                method: "prompts/get",
                params: { name: command.name, arguments: command.arguments },
              },
            ];
  const events: McpProtocolEvent[] = [];
  let result: unknown;
  let failure:
    { error: string; code: string; status: 400 | 422 | 429 | 502 } | undefined;
  try {
    for (const [index, exchange] of exchanges.entries()) {
      const body = requestFor(exchange.method, exchange.params, index + 1);
      const started = performance.now();
      const headers: Record<string, string> = {
        "content-type": "application/json",
        "mcp-protocol-version": "2026-07-28",
        "mcp-method": exchange.method,
      };
      const named = exchange.params?.name ?? exchange.params?.uri;
      if (typeof named === "string") headers["mcp-name"] = named;
      const response = await handler.fetch(
        new Request("http://runtime.local/mcp", {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        }),
      );
      const responseBody = (await response.json()) as {
        error?: { message?: string; code?: number };
        result?: {
          isError?: boolean;
          content?: Array<{ text?: string }>;
          capabilities?: Record<string, unknown>;
          _meta?: Record<string, unknown>;
        };
      };
      result = responseBody;
      const failed =
        !response.ok ||
        !!responseBody.error ||
        responseBody.result?.isError === true;
      events.push({
        id: randomUUID(),
        sequence: index + 1,
        method: exchange.method,
        status: failed ? "error" : "response",
        request: redactProtocolValue(body) as Record<string, unknown>,
        response: redactProtocolValue(responseBody) as Record<string, unknown>,
        durationMs: performance.now() - started,
        createdAt: new Date().toISOString(),
      });
      if (failed) {
        const providerCode = responseBody.result?._meta?.["atm/error-code"];
        const code =
          typeof providerCode === "string"
            ? providerCode
            : "MCP_COMMAND_FAILED";
        failure = {
          error:
            responseBody.error?.message ??
            responseBody.result?.content?.find((item) => item.text)?.text ??
            "The MCP command failed.",
          code,
          status:
            code === "UPSTREAM_UNAVAILABLE"
              ? 502
              : code === "UPSTREAM_QUOTA_EXCEEDED"
                ? 429
                : code === "LOCATION_NOT_FOUND"
                  ? 422
                  : 400,
        };
        break;
      }
      if (exchange.method === "server/discover") {
        // Only list capabilities actually negotiated by the SDK server. Empty
        // workspaces are valid while readers build their first server.
        for (const capability of ["tools", "resources", "prompts"]) {
          if (responseBody.result?.capabilities?.[capability])
            exchanges.push({ method: `${capability}/list` });
        }
      }
    }
  } finally {
    await handler.close();
  }
  return { result, events, ...(failure ? { failure } : {}) };
}
