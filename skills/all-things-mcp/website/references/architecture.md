# Platform architecture

- Runtime: Node 22+, Next.js App Router, React, TypeScript.
- Styling: Tailwind CSS plus CSS custom properties in `app/globals.css`.
- Content: Fumadocs MDX compiled from `content/`; schemas live in `lib/content-schema.ts` and `source.config.ts`.
- Search: Fumadocs Core server-side search at `/api/search`, presented through
  the global command overlay. `/search` is compatibility-only and opens the
  overlay on the current shell rather than rendering a standalone search page.
- Deployment: Vercel; `main` is production and pull requests receive previews.
- Newsletter: branded wrapper around a configurable official Substack embed with a direct link fallback.
- Analytics: Vercel Web Analytics may be enabled by environment; event payloads must contain no user text or PII.

Primary hubs are implemented from shared data in `lib/site-data.ts`. Blog posts use `/blog/[slug]`; Guide overviews use `/guides/[slug]`; hands-on Guide steps use `/guides/[slug]/[step]`. The catch-all library route remains a compatibility surface and redirects principal content to its canonical product URL. Keep data-only fixtures separate from authored technical content.
