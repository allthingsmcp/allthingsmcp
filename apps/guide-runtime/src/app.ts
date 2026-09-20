import { Hono } from "hono";
import {
  guideRunSchema,
  runtimeSessionResponseSchema,
  upsertGuideRunRequestSchema,
  type RuntimePrincipal,
} from "@all-things-mcp/contracts";
import { RuntimeAuthenticationError, verifyRuntimeToken } from "./auth.js";
import {
  GuideRunRevisionConflictError,
  type GuideRunRepository,
} from "./repository.js";

type RuntimeVariables = { principal: RuntimePrincipal };

export function createGuideRuntimeApp({
  repository,
  sharedSecret,
}: {
  repository: GuideRunRepository;
  sharedSecret: string;
}) {
  const app = new Hono<{ Variables: RuntimeVariables }>();

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
