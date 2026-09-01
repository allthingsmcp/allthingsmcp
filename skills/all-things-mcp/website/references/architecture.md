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

Primary hubs are implemented from shared data in `apps/web/lib/site-data.ts`.
Blog posts use `/blog/[slug]`; Guide overviews use `/guides/[slug]`; hands-on
Guide steps use `/guides/[slug]/[step]`. The catch-all library route remains a
compatibility surface and redirects principal content to its canonical product
URL. Keep data-only fixtures separate from authored technical content.

Interactive Guides remain normal Guide overview and step routes. Their reviewed
MDX blocks resolve to browser-local TypeScript registries and reducer state;
authored MDX must never contain executable simulator logic. Consult
`interactive-guide-inventory.md` for the supplied feature-semantics references.
