---
name: website
description: Build and maintain the All Things MCP Next.js and Fumadocs knowledge platform. Use for routes, content collections, Markdown or MDX authoring, search, metadata, contribution workflows, validation, tests, deployment, analytics, and any platform implementation or review.
---

# All Things MCP website

Read `references/architecture.md` before changing platform structure and `references/content-contracts.md` before adding or editing content.

## Workflow

1. Keep Next.js App Router, TypeScript, Tailwind CSS, and headless Fumadocs.
2. Keep Git-authored Markdown/MDX as the canonical source.
3. Validate content schemas, dates, slugs, and internal references at build time.
4. Allow only reviewed MDX components from `apps/web/components/mdx.tsx`; reject imports, exports, and executable expressions in contributions.
5. Exclude drafts in production and expose them in local/preview builds.
6. Use the shared shell and templates; do not create page-specific lookalike components.
7. Mark incomplete tools as `planned` and ecosystem fixtures as `not-reviewed`.
8. Do not send search queries, email addresses, or user-entered content to analytics.
9. Run formatting, lint, types, content validation, unit tests, build, and proportional browser checks.
10. Keep reading and browser-local Guide simulation anonymous. Persistent Guide
    progress is server-side: prompt readers to sign in to save progress, and
    never imply anonymous progress survives a reload or browser session.
