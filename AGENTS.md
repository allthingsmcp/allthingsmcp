# All Things MCP agent instructions

Before modifying this project, load the relevant local skill completely:

- Visual identity, components, typography, spacing, or UI: `skills/all-things-mcp/brand-system/SKILL.md`
- Website architecture, routes, content, metadata, validation, or community workflows: `skills/all-things-mcp/website/SKILL.md`
- Protocol illustrations, system diagrams, or technical flows: `skills/all-things-mcp/diagrams/SKILL.md`

If multiple areas are affected, load each relevant skill. The approved Open Junction masters and current brand constitution are the visual authority; existing site components supply layout patterns. Historical Figma/logo references do not override the current identity. Keep Git-authored Markdown/MDX canonical, preserve accessibility, and never present planned tools or ecosystem fixtures as working or verified.

The repository is a pnpm workspace. The Next.js/Fumadocs site lives in
`apps/web`, the future backend boundary lives in `apps/guide-runtime`, and
shared versioned schemas belong in `packages/contracts`.
