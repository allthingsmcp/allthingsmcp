# All Things MCP

An independent, developer-first knowledge platform for learning, building, securing, and operating Model Context Protocol systems.

## Local development

```bash
pnpm install
pnpm dev
```

Copy `apps/web/.env.example` to `apps/web/.env.local` to configure the public
site, repository, and Substack URLs. Content lives in `apps/web/content/` and is
validated with `pnpm content:validate`.

Authentication is optional in local development. Anonymous reading, seven-day
real MCP workspaces, and downloads remain available when it is disabled.
Supabase owns authentication, sessions, profile preferences, and the welcome-email workflow. Follow
`supabase/README.md`, then configure the Supabase URL and publishable key in
`apps/web/.env.local`.

The Guide Runtime uses a separate deployment and database boundary. Set the same
`GUIDE_RUNTIME_SHARED_SECRET` in both apps, then run it with:

```bash
pnpm dev:runtime
```

Keep the two environment files separate:

- `apps/web/.env.local`: Supabase Auth URL and publishable key,
  `GUIDE_RUNTIME_URL=http://localhost:8787`, and the shared secret.
- `apps/guide-runtime/.env`: the same shared secret, runtime settings, and
  `DATABASE_URL` containing the full Supabase PostgreSQL connection URI—not the
  Supabase project URL or an API key. Never use a `NEXT_PUBLIC_` prefix for this
  database credential or the shared secret.

Apply the Supabase migrations before starting the database-backed runtime.
Startup checks report connection failures or missing required tables immediately.
Without `DATABASE_URL`, development uses memory storage and loses workspaces
when the runtime restarts. Restart the relevant server after changing its env file.

For a complete local guide demo, `pnpm dev:demo` starts both applications in
one terminal (stop any existing servers on ports 3000 and 8787 first).
Once both are running, `pnpm demo:verify` checks actual database persistence,
all Weather capabilities against Open-Meteo, workspace claiming, and external
token/pause/revocation behavior. It creates and then removes its own diagnostic
workspace; it does not modify an existing account's workspace.

## Repository structure

- `apps/web` contains the existing Next.js and Fumadocs website.
- `apps/guide-runtime` is the independently deployable, multi-tenant MCP and Guide-run boundary.
- `packages/mcp-templates` contains versioned declarative capability manifests.
- `packages/contracts` contains versioned schemas shared by both apps.
- `skills` contains the project-local instructions and visual references.

The website and runtime share this repository but remain separate deployment
units. Configure the website project in Vercel with `apps/web` as its root
directory.

Supabase Auth owns browser sessions. The web app validates those sessions and
calls Guide Runtime with short-lived internal bearer tokens, so runtime
credentials and cross-domain cookies are never exposed to browsers. Guide
Runtime stores Supabase user IDs as opaque subjects.

## Licensing

Source code is licensed under Apache-2.0. Authored content under
`apps/web/content/` is licensed under CC BY 4.0. See `LICENSE` and
`LICENSE-CONTENT`.
