import { Hono, type Context } from "hono";
import * as z from "zod/v4";
import {
  createMcpWorkspaceRequestSchema,
  guideRunSchema,
  mcpWorkspaceCommandSchema,
  mcpWorkspaceConfigurationSchema,
  runtimeSessionResponseSchema,
  updateMcpWorkspaceRequestSchema,
  upsertGuideRunRequestSchema,
  type RuntimePrincipal,
  type McpWorkspace,
} from "@all-things-mcp/contracts";
import {
  getMcpTemplate,
  getMcpTemplateForGuide,
} from "@all-things-mcp/mcp-templates";
import { RuntimeAuthenticationError, verifyRuntimeToken } from "./auth.js";
import {
  GuideRunRevisionConflictError,
  type GuideRunRepository,
} from "./repository.js";
import {
  createWorkspaceMcpHandler,
  executeWorkspaceCommand,
} from "./mcp-runtime.js";
import { RequestLimiter } from "./limits.js";
import { OpenMeteoProvider } from "./weather.js";
import {
  type WorkspaceRepository,
  WorkspaceClaimConflictError,
  WorkspaceRevisionConflictError,
} from "./workspace-repository.js";

type RuntimeVariables = { principal: RuntimePrincipal };

export function createGuideRuntimeApp({
  repository,
  workspaceRepository,
  sharedSecret,
  publicBaseUrl = "http://localhost:8787",
  limiter = new RequestLimiter(sharedSecret),
  weather = new OpenMeteoProvider(),
}: {
  repository: GuideRunRepository;
  workspaceRepository: WorkspaceRepository;
  sharedSecret: string;
  publicBaseUrl?: string;
  limiter?: RequestLimiter;
  weather?: OpenMeteoProvider;
}) {
  const app = new Hono<{ Variables: RuntimeVariables }>();
  const enabledGuides = new Set(
    (process.env.REAL_MCP_GUIDES ?? "building-your-first-mcp-server")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );

  app.get("/health", (context) =>
    context.json({ status: "ok", service: "guide-runtime" }),
  );

  app.use("/v1/*", async (context, next) => {
    try {
      const principal = await verifyRuntimeToken(
        context.req.header("authorization"),
        sharedSecret,
      );
      context.set("principal", principal);
      await next();
    } catch (error) {
      if (error instanceof RuntimeAuthenticationError) {
        return context.json({ error: "Unauthorized" }, 401);
      }
      throw error;
    }
  });

  app.get("/v1/me", (context) => {
    const response = runtimeSessionResponseSchema.parse({
      authenticated: true,
      principal: context.get("principal"),
    });
    return context.json(response);
  });

  function validateConfiguration(
    templateId: string,
    configuration: unknown,
    templateVersion?: number,
  ) {
    const parsed = mcpWorkspaceConfigurationSchema.safeParse(configuration);
    const template = getMcpTemplate(templateId, templateVersion);
    if (!parsed.success || !template) return null;
    const available = new Set(template.capabilities.map((item) => item.id));
    return parsed.data.enabledCapabilityIds.every((id) => available.has(id)) &&
      new Set(parsed.data.enabledCapabilityIds).size ===
        parsed.data.enabledCapabilityIds.length
      ? parsed.data
      : null;
  }

  function withinLimits(context: Context, workspaceId: string) {
    const ip =
      context.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    return limiter.check(workspaceId, ip);
  }

  async function executeCommand(context: Context, workspace: McpWorkspace) {
    if (workspace.status === "paused")
      return context.json(
        { error: "Workspace is paused.", code: "WORKSPACE_PAUSED" },
        423,
      );
    if (!withinLimits(context, workspace.id))
      return context.json(
        {
          error: "Rate limit exceeded. Please try again shortly.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        429,
      );
    if (!getMcpTemplate(workspace.templateId, workspace.templateVersion))
      return context.json(
        {
          error: "This MCP template version is unavailable.",
          code: "TEMPLATE_UNAVAILABLE",
        },
        400,
      );
    const parsed = mcpWorkspaceCommandSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!parsed.success)
      return context.json(
        { error: "Invalid MCP command.", code: "INVALID_COMMAND" },
        400,
      );
    const { failure, ...response } = await executeWorkspaceCommand(
      workspace,
      parsed.data,
      weather,
    );
    await workspaceRepository.appendEvents(workspace.id, response.events);
    return failure
      ? context.json(
          { ...response, error: failure.error, code: failure.code },
          failure.status,
        )
      : context.json(response);
  }

  app.post("/anonymous/workspaces", async (context) => {
    const parsed = createMcpWorkspaceRequestSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!parsed.success)
      return context.json({ error: "Invalid workspace." }, 400);
    const template = getMcpTemplate(parsed.data.templateId);
    const configuration = validateConfiguration(
      parsed.data.templateId,
      parsed.data.configuration,
    );
    if (
      !template ||
      !enabledGuides.has(parsed.data.guideSlug) ||
      template.guideSlug !== parsed.data.guideSlug ||
      !configuration
    ) {
      return context.json({ error: "Invalid template configuration." }, 400);
    }
    return context.json(
      await workspaceRepository.createAnonymous({
        guideSlug: parsed.data.guideSlug,
        templateId: template.id,
        templateVersion: template.version,
        configuration,
      }),
      201,
    );
  });

  async function anonymousWorkspace(context: Context) {
    const credential =
      context.req.header("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const id = context.req.param("workspaceId" as never);
    if (!z.uuid().safeParse(id).success || !credential) return null;
    return workspaceRepository.findAnonymous(id, credential);
  }

  app.get("/anonymous/workspaces/:workspaceId", async (context) => {
    const workspace = await anonymousWorkspace(context);
    return workspace
      ? context.json({
          workspace,
          events: await workspaceRepository.listEvents(workspace.id),
        })
      : context.json(
          {
            error: "Temporary workspace is unavailable.",
            code: "TEMPORARY_WORKSPACE_UNAVAILABLE",
          },
          401,
        );
  });

  app.put("/anonymous/workspaces/:workspaceId", async (context) => {
    const workspace = await anonymousWorkspace(context);
    if (!workspace)
      return context.json(
        { error: "Temporary workspace is unavailable." },
        401,
      );
    const parsed = updateMcpWorkspaceRequestSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (
      !parsed.success ||
      !validateConfiguration(
        workspace.templateId,
        parsed.data.configuration,
        workspace.templateVersion,
      )
    ) {
      return context.json({ error: "Invalid workspace update." }, 400);
    }
    try {
      return context.json({
        workspace: await workspaceRepository.update(
          workspace.id,
          parsed.data.configuration,
          parsed.data.expectedRevision,
        ),
      });
    } catch (error) {
      if (error instanceof WorkspaceRevisionConflictError)
        return context.json({ error: error.message }, 409);
      throw error;
    }
  });

  app.post("/anonymous/workspaces/:workspaceId/commands", async (context) => {
    const workspace = await anonymousWorkspace(context);
    if (!workspace)
      return context.json(
        { error: "Temporary workspace is unavailable." },
        401,
      );
    return executeCommand(context, workspace);
  });

  app.get("/v1/mcp-workspaces/:guideSlug", async (context) => {
    if (!enabledGuides.has(context.req.param("guideSlug")))
      return context.json(
        { error: "Real MCP runtime is not enabled for this guide." },
        404,
      );
    const workspace = await workspaceRepository.findOwned(
      context.get("principal").sub,
      context.req.param("guideSlug"),
    );
    return workspace
      ? context.json({
          workspace,
          events: await workspaceRepository.listEvents(workspace.id),
        })
      : context.json({ error: "Workspace not found." }, 404);
  });

  app.post("/v1/mcp-workspaces/:guideSlug", async (context) => {
    const guideSlug = context.req.param("guideSlug");
    if (!enabledGuides.has(guideSlug))
      return context.json(
        { error: "Real MCP runtime is not enabled for this guide." },
        404,
      );
    const existing = await workspaceRepository.findOwned(
      context.get("principal").sub,
      guideSlug,
    );
    if (existing) return context.json({ workspace: existing });
    const template = getMcpTemplateForGuide(guideSlug);
    const parsed = createMcpWorkspaceRequestSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (
      !template ||
      !parsed.success ||
      parsed.data.templateId !== template.id ||
      parsed.data.guideSlug !== guideSlug
    )
      return context.json({ error: "Invalid workspace." }, 400);
    const configuration = validateConfiguration(
      template.id,
      parsed.data.configuration,
    );
    if (!configuration)
      return context.json({ error: "Invalid template configuration." }, 400);
    const temporary = await workspaceRepository.createAnonymous({
      guideSlug,
      templateId: template.id,
      templateVersion: template.version,
      configuration,
    });
    try {
      const claimed = await workspaceRepository.claim(
        temporary.workspace.id,
        temporary.temporaryCredential,
        context.get("principal").sub,
        false,
      );
      return context.json({ workspace: claimed }, 201);
    } catch (error) {
      if (error instanceof WorkspaceClaimConflictError)
        return context.json({ workspace: error.existing });
      throw error;
    }
  });

  app.put("/v1/mcp-workspaces/:guideSlug", async (context) => {
    const workspace = await workspaceRepository.findOwned(
      context.get("principal").sub,
      context.req.param("guideSlug"),
    );
    if (!workspace) return context.json({ error: "Workspace not found." }, 404);
    const parsed = updateMcpWorkspaceRequestSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (
      !parsed.success ||
      !validateConfiguration(
        workspace.templateId,
        parsed.data.configuration,
        workspace.templateVersion,
      )
    )
      return context.json({ error: "Invalid workspace update." }, 400);
    try {
      return context.json({
        workspace: await workspaceRepository.update(
          workspace.id,
          parsed.data.configuration,
          parsed.data.expectedRevision,
        ),
      });
    } catch (error) {
      if (error instanceof WorkspaceRevisionConflictError)
        return context.json({ error: error.message }, 409);
      throw error;
    }
  });

  app.post("/v1/mcp-workspaces/:guideSlug/claim", async (context) => {
    const parsed = z
      .object({
        workspaceId: z.uuid(),
        temporaryCredential: z.string().min(1),
        replace: z.boolean().optional(),
        replaceExisting: z.boolean().optional(),
      })
      .safeParse(await context.req.json().catch(() => null));
    if (!parsed.success)
      return context.json(
        {
          error: "Temporary workspace credential is required.",
          code: "INVALID_CLAIM",
        },
        400,
      );
    const body = parsed.data;
    const candidate = await workspaceRepository.findAnonymous(
      body.workspaceId,
      body.temporaryCredential,
    );
    if (!candidate || candidate.guideSlug !== context.req.param("guideSlug"))
      return context.json(
        {
          error: "Temporary workspace is unavailable.",
          code: "TEMPORARY_WORKSPACE_UNAVAILABLE",
        },
        401,
      );
    try {
      const workspace = await workspaceRepository.claim(
        body.workspaceId,
        body.temporaryCredential,
        context.get("principal").sub,
        body.replace === true || body.replaceExisting === true,
      );
      return context.json({
        workspace,
        events: await workspaceRepository.listEvents(workspace.id),
      });
    } catch (error) {
      if (error instanceof WorkspaceClaimConflictError)
        return context.json(
          { error: error.message, existing: error.existing },
          409,
        );
      throw error;
    }
  });

  app.post("/v1/mcp-workspaces/:guideSlug/commands", async (context) => {
    const workspace = await workspaceRepository.findOwned(
      context.get("principal").sub,
      context.req.param("guideSlug"),
    );
    if (!workspace) return context.json({ error: "Workspace not found." }, 404);
    return executeCommand(context, workspace);
  });

  app.post("/v1/mcp-workspaces/:guideSlug/status", async (context) => {
    const workspace = await workspaceRepository.findOwned(
      context.get("principal").sub,
      context.req.param("guideSlug"),
    );
    const parsed = z
      .object({ status: z.enum(["active", "paused"]) })
      .safeParse(await context.req.json().catch(() => null));
    if (!workspace || !parsed.success)
      return context.json({ error: "Invalid status change." }, 400);
    return context.json({
      workspace: await workspaceRepository.setStatus(
        workspace.id,
        parsed.data.status,
      ),
    });
  });

  app.post("/v1/mcp-workspaces/:guideSlug/token", async (context) => {
    const workspace = await workspaceRepository.findOwned(
      context.get("principal").sub,
      context.req.param("guideSlug"),
    );
    if (!workspace) return context.json({ error: "Workspace not found." }, 404);
    const issued = await workspaceRepository.issueAccessToken(workspace.id);
    return context.json({
      ...issued,
      endpoint: `${publicBaseUrl.replace(/\/$/, "")}/mcp/${workspace.publicId}`,
    });
  });

  app.delete("/v1/mcp-workspaces/:guideSlug/token", async (context) => {
    const workspace = await workspaceRepository.findOwned(
      context.get("principal").sub,
      context.req.param("guideSlug"),
    );
    if (!workspace) return context.json({ error: "Workspace not found." }, 404);
    await workspaceRepository.revokeAccessTokens(workspace.id);
    return context.body(null, 204);
  });

  app.all("/mcp/:publicId", async (context) => {
    if (!z.uuid().safeParse(context.req.param("publicId")).success)
      return context.json({ error: "MCP workspace is unavailable." }, 404);
    const workspace = await workspaceRepository.findByPublicId(
      context.req.param("publicId"),
    );
    if (
      !workspace ||
      !enabledGuides.has(workspace.guideSlug) ||
      workspace.status !== "active" ||
      (workspace.expiresAt && new Date(workspace.expiresAt) <= new Date())
    ) {
      return context.json({ error: "MCP workspace is unavailable." }, 404);
    }
    const token =
      context.req.header("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const temporary =
      workspace.anonymousCredentialHash &&
      token &&
      (await workspaceRepository.findAnonymous(workspace.id, token));
    const external =
      token &&
      (await workspaceRepository.validateAccessToken(workspace.id, token));
    let internal = false;
    if (token) {
      try {
        const principal = await verifyRuntimeToken(
          `Bearer ${token}`,
          sharedSecret,
        );
        internal =
          (
            await workspaceRepository.findOwned(
              principal.sub,
              workspace.guideSlug,
            )
          )?.id === workspace.id;
      } catch (error) {
        if (!(error instanceof RuntimeAuthenticationError)) throw error;
      }
    }
    if (!temporary && !external && !internal)
      return context.json({ error: "Unauthorized" }, 401);
    if (!withinLimits(context, workspace.id))
      return context.json({ error: "Rate limit exceeded." }, 429);
    const handler = createWorkspaceMcpHandler(workspace, weather);
    try {
      return await handler.fetch(context.req.raw);
    } finally {
      await handler.close();
    }
  });

  app.get("/v1/guide-runs/:guideSlug", async (context) => {
    const run = await repository.find(
      context.get("principal").sub,
      context.req.param("guideSlug"),
    );
    if (!run) return context.json({ error: "Guide run not found" }, 404);
    return context.json(guideRunSchema.parse(run));
  });

  app.put("/v1/guide-runs/:guideSlug", async (context) => {
    const parsed = upsertGuideRunRequestSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!parsed.success) {
      return context.json(
        { error: "Invalid guide run", issues: parsed.error.issues },
        400,
      );
    }

    try {
      const run = await repository.upsert(
        context.get("principal").sub,
        context.req.param("guideSlug"),
        parsed.data,
      );
      return context.json(guideRunSchema.parse(run));
    } catch (error) {
      if (error instanceof GuideRunRevisionConflictError) {
        return context.json({ error: error.message }, 409);
      }
      throw error;
    }
  });

  return app;
}
