# All Things MCP

An independent, developer-first knowledge platform for learning, building, securing, and operating Model Context Protocol systems.

## Local development

```bash
pnpm install
pnpm dev
```

Copy `apps/web/.env.example` to `apps/web/.env.local` to configure the public
site, repository, and Substack URLs. Content lives in `apps/web/content/` and is
validated with `pnpm content:validate`.

## Repository structure

- `apps/web` contains the existing Next.js and Fumadocs website.
- `apps/guide-runtime` reserves an independently deployable boundary for saved
  Guide runs and MCP requests.
- `packages/contracts` reserves the versioned schemas shared by both apps.
- `skills` contains the project-local instructions and visual references.

The website and runtime share this repository but remain separate deployment
units. Configure the website project in Vercel with `apps/web` as its root
directory.

## Licensing

Source code is licensed under Apache-2.0. Authored content under
`apps/web/content/` is licensed under CC BY 4.0. See `LICENSE` and
`LICENSE-CONTENT`.
