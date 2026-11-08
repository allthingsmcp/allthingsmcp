# Development guide

## Requirements

- Node 24 LTS. The version is pinned in `.nvmrc`, `package.json` `engines`, the Dockerfile, and CI; pnpm selects it for project commands via `pnpm-workspace.yaml`.
- pnpm 10 (`corepack enable` installs the pinned version).

```bash
nvm install && nvm use
corepack enable
pnpm install
pnpm dev
```

Run `pnpm install --frozen-lockfile` after pulling dependency updates, then restart the dev servers.

## Commands

| Command                                    | What it does                                                                                                               |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                                 | Website dev server (source maps disabled; see _Memory_ below)                                                              |
| `pnpm dev:debug`                           | Website dev server with mapped server stack traces                                                                         |
| `pnpm dev:runtime`                         | Guide Runtime                                                                                                              |
| `pnpm dev:demo`                            | Website and runtime together (stop anything on ports 3000 and 8787 first)                                                  |
| `pnpm demo:verify`                         | Checks persistence, Weather capabilities against Open-Meteo, workspace claiming, and token behavior against a running demo |
| `pnpm check`                               | Website format, lint, typecheck, content validation, unit tests, and build                                                 |
| `pnpm format` / `pnpm format:write`        | Check / fix formatting across the repository                                                                               |
| `pnpm lint`, `pnpm typecheck`, `pnpm test` | Individual checks                                                                                                          |
| `pnpm content:validate`                    | Validate front matter, folders, links, and MDX                                                                             |
| `pnpm test:e2e`                            | Playwright suite on an isolated server (see `apps/web/tests/e2e/README.md`)                                                |
| `pnpm test:memory`                         | Production-build memory smoke test (run after `pnpm build`)                                                                |
| `pnpm brand:generate`                      | Regenerate served brand assets from `brand/`                                                                               |

For production use `pnpm build` then `pnpm start`; never deploy `pnpm dev`. `pnpm start` is also a lighter local preview.

## Environment files

Copy the examples and keep the two apps' files separate:

- `apps/web/.env.example` → `apps/web/.env.local`: site, repository, and Substack URLs; optional Supabase Auth URL and publishable key; `GUIDE_RUNTIME_URL=http://localhost:8787`; the shared secret.
- `apps/guide-runtime/.env.example` → `apps/guide-runtime/.env`: the same shared secret, runtime settings, and `DATABASE_URL` (the full Supabase PostgreSQL connection URI, not the project URL or an API key).

Never use a `NEXT_PUBLIC_` prefix for the database credential or the shared secret. Restart the relevant server after editing its env file.

Authentication is optional locally. With it disabled, anonymous reading, seven-day real MCP workspaces, and downloads still work. To enable it, follow `supabase/README.md`.

Without `DATABASE_URL`, the runtime uses memory storage and loses workspaces on restart. Apply the Supabase migrations before using the database-backed runtime; startup checks report connection failures or missing tables.

Behind a reverse proxy, set `TRUSTED_PROXY_COUNT` in the runtime so per-IP rate limits use the real client address.

## Memory

The development launcher caps the JavaScript old-space heap at 2 GiB instead of Next's default of half the machine's RAM. Native compiler memory is additional, so the cap is a safeguard, not a leak fix.

- **Source maps.** Generated Node source maps can be strongly retained across hot reloads in development ([Next.js #98221](https://github.com/vercel/next.js/issues/98221), [Node #65760](https://github.com/nodejs/node/issues/65760)). Normal `pnpm dev` disables them; use `pnpm dev:debug` only for short sessions that need mapped server stacks, and restart it periodically. This affects debugging only, not the production build.
- **Router cache.** Next versions before 16.3.8 omitted URL-key size from the production router-cache budget ([#94890](https://github.com/vercel/next.js/issues/94890), [#94919](https://github.com/vercel/next.js/issues/94919)). Keep `next` and `eslint-config-next` current.
- **Weather provider cache.** The runtime sweeps expired entries and caps retention at 256 LRU entries.
- **Regression guard.** `pnpm test:memory` measures post-GC heap growth against an isolated production server and also runs in CI. It is a bounded smoke test, not a guarantee for arbitrary traffic, authenticated sessions, or the separately deployed Guide Runtime.

## Deployment

The website and Guide Runtime are separate deployment units. Configure the website project (for example in Vercel) with `apps/web` as its root directory. Build the runtime image from the repository root:

```bash
docker build -f apps/guide-runtime/Dockerfile -t guide-runtime .
```

See [`architecture.md`](architecture.md) for how the pieces fit together.
