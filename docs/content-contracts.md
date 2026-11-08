# Content contracts

Every document requires `title`, `description`, `authors`, `status`, `tags`, and `updatedAt`. Published content also requires `publishedAt`.

Technical content requires `difficulty`, `estimatedMinutes`, `specVersion`, and `lastVerified`.

Guides are outcome-driven, ordered workflows rather than long-form articles. A `guide` requires `outcome` and a unique ordered `guideSteps` array. Each step has a stable lowercase-hyphenated ID, title, description, and optional estimated minutes. `prerequisites` and `guideResources` provide overview context. Step bodies use `guide-step` documents with `guideSlug`, `guideStepId`, and `guideStepOrder`, and resolve to `/guides/[slug]/[step]`. An interactive Guide overview may add a reviewed `interactiveGuideId`; existing Guides omit it and retain their standard experience.

Supported `contentType` values:

- `guide`, `guide-step`, `article`, `tutorial`, `learning-path`, `lesson`
- `glossary`, `spec-release`, `spec-proposal`
- `ecosystem`, `tool`

An `article` may set `coverScene` to a registered id from `apps/web/lib/cover-scene-ids.ts` to replace its generated topic tile with a reviewed, responsive cover scene. Scenes are code in `apps/web/components/cover-scenes.tsx`, never MDX; see the cover-scenes skill.

Use ISO `YYYY-MM-DD` dates. Use stable, lowercase, hyphenated slugs. Add `prerequisites` only when genuinely required. Tutorial fields may include language, SDK, SDK version, transport, authentication model, repository, and last-tested date.

Contributed MDX may use: `Callout`, `Steps`, `Tabs`, `Checklist`, `CardGrid`, `MetadataPanel`, and `ProtocolDiagram`. Reviewed interactive Guide steps may also use `InteractiveGuideBlock` with a literal registered `scene` value. Scenario definitions and behavior live in the TypeScript registry, never in MDX. Do not import components or execute JavaScript inside content.

## Where files live

`pnpm content:validate` enforces that each `contentType` sits in its own folder under `apps/web/content/`.

| Folder                        | `contentType`                   | Public URL              |
| ----------------------------- | ------------------------------- | ----------------------- |
| `guides/`                     | `guide`                         | `/guides/[slug]`        |
| `guide-steps/[guide-slug]/`   | `guide-step`                    | `/guides/[slug]/[step]` |
| `blog/`                       | `article`                       | `/blog/[slug]`          |
| `learning-paths/`, `lessons/` | `learning-path`, `lesson`       | `/library/...`          |
| `glossary/`                   | `glossary`                      | `/library/...`          |
| `ecosystem/`                  | `ecosystem`                     | `/library/...`          |
| `tools/`                      | `tool`                          | `/library/...`          |
| `spec-watch/`                 | `spec-release`, `spec-proposal` | `/library/...`          |
| `authors/`                    | author profiles (YAML)          | `/authors/[slug]`       |
