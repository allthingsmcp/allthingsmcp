# Platform architecture

- Runtime: Node 22+, Next.js App Router, React, and TypeScript.
- Styling: Tailwind CSS plus CSS custom properties in `app/globals.css`.
- Content: Git-authored Fumadocs MDX compiled from `content/`.
- Primary products: Guides, Blog, and Spec Watch.
- Search: server-side Orama at `/api/search`, limited to Guides, Blog, Spec Watch, and Glossary.
- Deployment: Vercel; `main` is production and pull requests receive previews.
- Newsletter: configurable Substack embed or direct-subscribe fallback.

Public routes are `/guides/[slug]`, `/blog/[slug]`, and `/spec-watch/[slug]`. Learn, Build, Operate, and Security are Guide categories addressed by `/guides#category`, not separate products. Ecosystem and Tools are deferred, unlinked, and noindexed.

Canonical URLs come from `lib/content-routing.ts`. Keep old Library URLs redirected when content moves. Guide progress is browser-local and versioned; do not add accounts or a sync backend without an explicit product decision.
