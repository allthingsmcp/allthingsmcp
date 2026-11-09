# All Things MCP

An independent, developer-first knowledge platform for learning, building, securing, and operating
[Model Context Protocol](https://modelcontextprotocol.io) systems. Guides, articles, and runnable examples are authored
in Git and reviewed in public. Live site: <https://www.allthingsmcp.com>.

## Quick start

```bash
nvm install && nvm use   # Node 24 LTS
corepack enable
pnpm install
pnpm dev                 # http://localhost:3000
```

Authentication and the database-backed runtime are optional for local work. See the
[development guide](docs/development.md) for environment files, the full command list, and the Guide Runtime.

## What is in this repository

| Path                     | Purpose                                                                         |
| ------------------------ | ------------------------------------------------------------------------------- |
| `apps/web`               | Next.js and Fumadocs website. Content lives in `apps/web/content/`              |
| `apps/guide-runtime`     | Independently deployable service for multi-tenant MCP workspaces and Guide runs |
| `packages/contracts`     | Versioned schemas shared by the website and runtime                             |
| `packages/mcp-templates` | Declarative capability manifests for runtime workspaces                         |
| `examples/`              | Runnable projects that accompany Guides                                         |
| `brand/`                 | Approved logo masters and identity data                                         |
| `docs/`                  | Contributor documentation ([index](docs/README.md))                             |
| `skills/`                | Instructions for AI coding assistants (optional)                                |
| `supabase/`              | Database migrations and the welcome-email Edge Function                         |

The website and runtime share a repository but deploy separately. Supabase Auth owns browser sessions; the website
calls the runtime with short-lived internal bearer tokens, so runtime credentials are never exposed to browsers. See
[architecture](docs/architecture.md).

## Contributing

Contributions are welcome: corrections, new Guides and articles, and platform improvements. You can open a pull request
directly.

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [editorial style](EDITORIAL_STYLE.md).
2. For content, follow the [content contracts](docs/content-contracts.md) and add yourself via
   [authors](docs/authors.md).
3. Run `pnpm check` (and `pnpm content:validate` for content) before opening the pull request.

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md). Report security issues privately as described in
[SECURITY.md](SECURITY.md).

## License

Source code is licensed under [Apache-2.0](LICENSE). Authored content under `apps/web/content/` is licensed under
[CC BY 4.0](LICENSE-CONTENT). Third-party names, trademarks, and linked materials remain subject to their owners' rights.
The All Things MCP name, logo, and brand assets are not covered by these licenses; please ask before using them commercially.
