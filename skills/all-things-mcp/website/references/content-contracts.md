# Content contracts

Every document requires `title`, `description`, `authors`, `status`, `tags`, and `updatedAt`. Published content also requires `publishedAt`.

Technical content requires `difficulty`, `estimatedMinutes`, `specVersion`, and `lastVerified`.

Supported `contentType` values:

- `guide`, `article`, `tutorial`, `learning-path`, `lesson`
- `glossary`, `spec-release`, `spec-proposal`
- `ecosystem`, `tool`

Use ISO `YYYY-MM-DD` dates. Use stable, lowercase, hyphenated slugs. Add `prerequisites` only when genuinely required. Tutorial fields may include language, SDK, SDK version, transport, authentication model, repository, and last-tested date.

Contributed MDX may use: `Callout`, `Steps`, `Tabs`, `Checklist`, `CardGrid`, `MetadataPanel`, and `ProtocolDiagram`. Do not import components or execute JavaScript inside content.
