# Contributing to All Things MCP

Thank you for helping make MCP knowledge clearer and more reliable. You may open a pull request directly; a proposal is not required.

## Content changes

1. Find the appropriate collection under `apps/web/content/`.
2. Copy a nearby document and update every frontmatter field.
3. Use ordinary Markdown where possible. Reviewed MDX components are documented in `skills/all-things-mcp/website/references/content-contracts.md`.
4. Cite primary sources for protocol behavior and record the specification version and verification date.
5. Run `pnpm content:validate` and `pnpm check`.

Write for a developer who wants to understand and apply the material. Separate protocol requirements from recommendations and implementation examples. Prefer precise verbs, short paragraphs, descriptive headings, and runnable code with its environment stated.

## Code changes

Read `AGENTS.md`, follow the local project skills, add or update tests, and preserve the custom design system. Do not introduce a second component system or a Fumadocs default theme.

Website commands can be run from the repository root. The root scripts target
`apps/web`; backend work belongs in `apps/guide-runtime`, and contracts shared
across deployment boundaries belong in `packages/contracts`.

## Review

Automated validation must pass. A maintainer reviews editorial quality; technical content also receives technical review. By checking the pull-request license acknowledgment, you agree that code contributions are Apache-2.0 and content contributions are CC BY 4.0.
