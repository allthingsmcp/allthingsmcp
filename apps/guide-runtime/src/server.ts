import { serve } from "@hono/node-server";
import { Pool } from "pg";
import { createGuideRuntimeApp } from "./app.js";
import {
  MemoryGuideRunRepository,
  PostgresGuideRunRepository,
} from "./repository.js";
import {
  MemoryWorkspaceRepository,
  PostgresWorkspaceRepository,
} from "./workspace-repository.js";

const port = Number(process.env.PORT ?? 8787);
const sharedSecret = process.env.GUIDE_RUNTIME_SHARED_SECRET;

if (!sharedSecret) {
  throw new Error("GUIDE_RUNTIME_SHARED_SECRET is required.");
}

if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required in production.");
}

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10_000,
      query_timeout: 15_000,
    })
  : undefined;

if (pool) {
  try {
    const url = new URL(process.env.DATABASE_URL!);
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname) {
      throw new Error(
        "DATABASE_URL must be a complete PostgreSQL connection URI.",
      );
    }
    const result = await pool.query<{
      workspaces: string | null;
      runs: string | null;
    }>(
      "select to_regclass('public.mcp_workspaces')::text as workspaces, to_regclass('public.guide_runs')::text as runs",
    );
    if (!result.rows[0]?.workspaces || !result.rows[0]?.runs) {
      throw new Error(
        "Required Supabase tables are missing. Run `pnpm exec supabase db push` from the repository root.",
      );
    }
  } catch (error) {
    await pool.end();
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Guide Runtime could not connect to Supabase using DATABASE_URL: ${detail}`,
    );
  }
}
const repository = pool
  ? new PostgresGuideRunRepository(pool)
  : new MemoryGuideRunRepository();
const workspaceRepository = pool
  ? new PostgresWorkspaceRepository(pool)
  : new MemoryWorkspaceRepository();

const server = serve(
  {
    fetch: createGuideRuntimeApp({
      repository,
      workspaceRepository,
      sharedSecret,
      publicBaseUrl:
        process.env.GUIDE_RUNTIME_PUBLIC_URL ?? `http://localhost:${port}`,
    }).fetch,
    port,
  },
  () => console.log(`Guide Runtime listening on http://localhost:${port}`),
);

// A transient error on an idle database client must not crash every workspace.
pool?.on("error", (error: Error & { code?: string }) => {
  console.error(
    "Guide Runtime database connection interrupted.",
    error.code ?? error.name,
  );
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    server.close(() => void pool?.end().finally(() => process.exit(0)));
  });
}
