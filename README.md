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

Authentication is optional in local development. Anonymous reading, simulation,
and downloads remain available when it is disabled, but persistent Guide
progress is server-side and requires an account. Supabase owns authentication,
sessions, profile preferences, and the welcome-email workflow. Follow
`supabase/README.md`, then configure the Supabase URL and publishable key in
`apps/web/.env.local`.

The Guide Runtime uses a separate deployment and database boundary. Set the same
`GUIDE_RUNTIME_SHARED_SECRET` in both apps, then run it with:

```bash
pnpm dev:runtime
```

## Repository structure

- `apps/web` contains the existing Next.js and Fumadocs website.
- `apps/guide-runtime` is the independently deployable boundary for authenticated
  Guide runs and future MCP requests.
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
