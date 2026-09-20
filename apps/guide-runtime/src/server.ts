import { serve } from "@hono/node-server";
import { Pool } from "pg";
import { createGuideRuntimeApp } from "./app.js";
import {
  MemoryGuideRunRepository,
  PostgresGuideRunRepository,
} from "./repository.js";

const port = Number(process.env.PORT ?? 8787);
const sharedSecret = process.env.GUIDE_RUNTIME_SHARED_SECRET;

if (!sharedSecret) {
  throw new Error("GUIDE_RUNTIME_SHARED_SECRET is required.");
}

if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required in production.");
}

const repository = process.env.DATABASE_URL
  ? new PostgresGuideRunRepository(
      new Pool({ connectionString: process.env.DATABASE_URL }),
    )
  : new MemoryGuideRunRepository();

serve({
  fetch: createGuideRuntimeApp({ repository, sharedSecret }).fetch,
  port,
});

console.log(`Guide Runtime listening on http://localhost:${port}`);
