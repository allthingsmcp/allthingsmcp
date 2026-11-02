# All Things MCP agent instructions

Before modifying this project, load the relevant local skill completely:

- Visual identity, components, typography, spacing, or UI: `skills/all-things-mcp/brand-system/SKILL.md`
- Website architecture, routes, content, metadata, validation, or community workflows: `skills/all-things-mcp/website/SKILL.md`
- Writing or reviewing any Guide, tutorial, blog post, or technical article: `skills/developer-relations/engineering-blog-post/SKILL.md`
- Step-by-step Guides, tutorials, or build-along content: also load `skills/developer-relations/developer-tutorial/SKILL.md`
- Protocol illustrations, system diagrams, or technical flows: `skills/all-things-mcp/diagrams/SKILL.md`

For Guides, use the tutorial skill for teaching structure and checkpoints, and
apply the engineering-blog-post skill's evidence, runnable-code, versioning,
limitations, and editorial checks. Keep the Guide format; do not turn a
walkthrough into a narrative blog post. For blog posts, use the blog skill's
applicable workflow. The website skill still owns content contracts and routes.
These writing skills are vendored from a pinned upstream revision documented
in `skills/developer-relations/README.md`.

If multiple areas are affected, load each relevant skill. The approved Open Junction masters and current brand constitution are the visual authority; existing site components supply layout patterns. Historical Figma/logo references do not override the current identity. Keep Git-authored Markdown/MDX canonical, preserve accessibility, and never present planned tools or ecosystem fixtures as working or verified.

The repository is a pnpm workspace. The Next.js/Fumadocs site lives in
`apps/web`, the future backend boundary lives in `apps/guide-runtime`, and
shared versioned schemas belong in `packages/contracts`.
