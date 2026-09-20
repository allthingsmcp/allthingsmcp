# Platform architecture

- Workspace: pnpm monorepo with the website in `apps/web`, the backend boundary
  in `apps/guide-runtime`, and shared schemas in `packages/contracts`.
- Website runtime: Node 22+, Next.js App Router, React, TypeScript.
- Styling: Tailwind CSS plus CSS custom properties in
  `apps/web/app/globals.css`.
- Content: Fumadocs MDX compiled from `apps/web/content/`; schemas live in
  `apps/web/lib/content-schema.ts` and `apps/web/source.config.ts`.
- Search: Fumadocs Core server-side search at `/api/search`, presented through
  the global command overlay. `/search` is compatibility-only and opens the
  overlay on the current shell rather than rendering a standalone search page.
- Deployment: the website and Guide Runtime are independent deployment units.
  The website uses `apps/web` as its Vercel project root; `main` is production
  and pull requests receive previews.
- Newsletter: branded wrapper around a configurable official Substack embed with a direct link fallback.
- Analytics: Vercel Web Analytics may be enabled by environment; event payloads must contain no user text or PII.
- Authentication: Supabase Auth provides GitHub OAuth with SSR cookie sessions.
  First-time GitHub sign-in creates an ATM account automatically. The website
  validates the Supabase user before exchanging the session for a short-lived
  internal bearer token when calling Guide Runtime; browsers never receive the
  runtime shared secret.
- Account email: a minimal `auth.users` trigger creates an RLS-protected profile.
  A Supabase Database Webhook invokes the `welcome-email` Edge Function after
  profile creation so email delivery cannot block sign-in. Transactional
  delivery uses Resend and an idempotent per-user welcome key.
- Durable Guide state: Guide Runtime owns validated Guide-run records and uses
  optimistic revisions to prevent silent overwrites. It stores the Supabase
  user ID only as an opaque subject and does not query Auth tables.

Primary hubs are implemented from shared data in `apps/web/lib/site-data.ts`.
Blog posts use `/blog/[slug]`; Guide overviews use `/guides/[slug]`; hands-on
Guide steps use `/guides/[slug]/[step]`. The catch-all library route remains a
compatibility surface and redirects principal content to its canonical product
URL. Keep data-only fixtures separate from authored technical content.

Interactive Guides remain normal Guide overview and step routes. Their reviewed
MDX blocks resolve to browser-local TypeScript registries and reducer state;
authored MDX must never contain executable simulator logic. Consult
`interactive-guide-inventory.md` for the supplied feature-semantics references.

Anonymous reading, Guide simulation, and project downloads are first-class
behavior. Anonymous completion state may live in memory for the active browser
session, but persistent Guide progress is stored only by Guide Runtime for
signed-in readers. Prompt readers to sign in to save progress on every Guide;
hosted endpoints and external client connections also require authentication.
