import { randomUUID } from 'node:crypto';
import {
  Client,
  ProtocolError,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client';
import {
  CallToolResultV2Schema,
  CreateTaskResultV2Schema,
  GetTaskResultV2Schema,
  CancelTaskResultV2Schema,
} from '@modelcontextprotocol/ext-tasks/core/v2';
import { z } from 'zod';
import {
  protocolVersion,
  tasksExtension,
  type ThumbnailInput,
} from './config.ts';

export const clientInfo = { name: 'thumbnail-client', version: '1.0.0' };
export const clientCapabilities = { extensions: { [tasksExtension]: {} } };
const packetSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.string(),
  result: z.unknown().optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
      data: z.unknown().optional(),
    })
    .optional(),
});

// Sample HTTP adapter for extension traffic. The base SDK still decodes its
// old task shapes; the extension's V2 schemas validate these current results.
// Every POST owns its ID and response; nothing shares the SDK's connection map.
export function createDispatcher(
  url: string,
  capabilities: Record<string, unknown> = clientCapabilities,
) {
  return async (method: string, params: Record<string, unknown> = {}) => {
    const id = randomUUID();
    const named = params.taskId ?? params.name;
    const response = await fetch(url, {
      method: 'POST',
      signal: AbortSignal.timeout(30_000),
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        'mcp-protocol-version': protocolVersion,
        'mcp-method': method,
        ...(typeof named === 'string' ? { 'mcp-name': named } : {}),
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id,
        method,
        params: {
          ...params,
          _meta: {
            'io.modelcontextprotocol/protocolVersion': protocolVersion,
            'io.modelcontextprotocol/clientInfo': clientInfo,
            'io.modelcontextprotocol/clientCapabilities': capabilities,
          },
        },
      }),
    });
    const packet = packetSchema.parse(await response.json());
    if (packet.id !== id)
      throw new Error('MCP response ID did not match the request.');
    if (packet.error)
      throw new ProtocolError(
        packet.error.code,
        packet.error.message,
        packet.error.data,
      );
    if (!response.ok || !Object.hasOwn(packet, 'result'))
      throw new Error(`MCP HTTP request failed (${response.status}).`);
    return packet.result;
  };
}

export async function connect(
  url = 'http://127.0.0.1:3001/mcp',
  capabilities = clientCapabilities,
) {
  const client = new Client(clientInfo, {
    capabilities,
    versionNegotiation: { mode: { pin: protocolVersion } },
  });
  await client.connect(new StreamableHTTPClientTransport(new URL(url)));
  const request = createDispatcher(url, capabilities);
  return {
    client,
    callTool: async (input: ThumbnailInput) =>
      z.union([CreateTaskResultV2Schema, CallToolResultV2Schema]).parse(
        await request('tools/call', {
          name: 'create_thumbnails',
          arguments: input,
        }),
      ),
    getTask: async (taskId: string) =>
      GetTaskResultV2Schema.parse(await request('tasks/get', { taskId })),
    cancelTask: async (taskId: string) =>
      CancelTaskResultV2Schema.parse(await request('tasks/cancel', { taskId })),
    close: () => client.close(),
  };
}
export type Connection = Awaited<ReturnType<typeof connect>>;
