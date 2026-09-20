# Guide Runtime

An independently deployable service for authenticated, durable Guide runs. The
web app owns user-facing OAuth sessions and calls this service with short-lived
internal bearer tokens. Browsers never receive the runtime shared secret.

Local development falls back to an in-memory repository when `DATABASE_URL` is
absent. Production refuses to start without PostgreSQL.

```bash
cp .env.example .env
pnpm dev
```

Apply the repository's Supabase migrations with `pnpm exec supabase db push`
before enabling durable storage. The `guide_runs` table has RLS enabled without
browser-facing policies; Guide Runtime accesses it through its server-only
database connection. Use Supabase's pooled connection string for deployed
serverless environments.
