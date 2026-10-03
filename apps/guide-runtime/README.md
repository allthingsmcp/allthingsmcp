# Guide Runtime

An independently deployable service for real, multi-tenant MCP workspaces and durable Guide runs. The
web app owns user-facing OAuth sessions and calls this service with short-lived
internal bearer tokens. Browsers never receive the runtime shared secret.

Local development falls back to an in-memory repository when `DATABASE_URL` is
absent. Production refuses to start without PostgreSQL.

```bash
cp .env.example .env
pnpm dev
```

Apply the repository's Supabase migrations with `pnpm exec supabase db push`
before enabling durable storage. Guide Runtime builds servers on demand from
curated manifests and executor registrations; it never executes user code or
starts a process per workspace. The runtime tables have RLS enabled without
browser-facing policies; Guide Runtime accesses it through its server-only
database connection. Use Supabase's pooled connection string for deployed
serverless environments.

The Weather template calls Open-Meteo and returns its attribution. Configure
provider URLs, request limits, and the global daily upstream limit in `.env`.
The included Dockerfile produces a provider-neutral OCI image.
