# Developer relations writing skills

These skills are installed for ATM authoring and also in the user's personal
Codex skills directory. The root `AGENTS.md` requires their use for Guides and
blog posts. They are authoring tools, not website runtime dependencies.

## Source

- Repository: https://github.com/samber/developer-relations-skills
- Revision: `a12240a5a8a15a460ab17aa870df37f14814bf7d`
- Installed: 2026-10-27
- License: MIT, copyright 2026 Samuel Berthe; included in each skill directory.
- `engineering-blog-post`: upstream `skills/engineering-blog-post`, version 1.0.3.
- `developer-tutorial`: upstream `skills/developer-tutorial`, version 1.0.1.

The upstream skill files and supporting references are kept unchanged. Only
the upstream license file is added to each directory. Update both repository
and personal installations together after reviewing an explicit upstream
revision; do not silently follow the upstream main branch.

## Use

For a blog post, follow `engineering-blog-post`. For a teaching Guide, follow
`developer-tutorial` and use `engineering-blog-post` for evidence and editorial
review, as requested by the project owner. ATM's website skill controls MDX,
metadata, routing, and validation. Keep these authoring skills separate from
the image-processing and MCP dependencies in tutorial sample projects.

References to other upstream skills do not mean those skills are installed.
Load or install additional skills only when the task actually needs them.
