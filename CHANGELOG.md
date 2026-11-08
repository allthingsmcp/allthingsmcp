# Changelog

All notable changes to this repository are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The site deploys continuously from `main`, so entries are
grouped by date rather than by version until tagged releases begin.

## [Unreleased]

### Added

- Guide: build MCP Tasks with Sharp, with a runnable example in `examples/mcp-tasks-thumbnails`.
- Contributor model: author profiles with `slug`, `kind`, and `affiliation`; profile pages at `/authors/[slug]`.
- `SECURITY.md`, `SUPPORT.md`, `.editorconfig`, `.gitattributes`, Dependabot, CodeQL, and dependency review.
- Content validation enforces one folder per `contentType`.

### Changed

- Blog articles moved from `apps/web/content/guides/` to `apps/web/content/blog/`.
- Brand masters moved to `brand/`; human-facing docs moved from `skills/` to `docs/`.
- Guide Runtime rate limiting no longer trusts `X-Forwarded-For` unless `TRUSTED_PROXY_COUNT` is set.
- Guide Runtime image uses Node 24, runs as a non-root user, and includes a health check.
- The `/all` and `/library/tutorials/minimal-server` redirects are declared in `apps/web/next.config.mjs`.

### Removed

- The tracked `supabase/.temp` files, and `yarn-error.log`.
