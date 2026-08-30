# Content contracts

Every document requires `title`, `description`, `authors`, `status`, `tags`, and `updatedAt`. Published content also requires `publishedAt`.

## Principal models

- Guide: `guideCategory`, `outcome`, `difficulty`, `estimatedMinutes`, ordered unique `steps`, `specVersion`, `lastVerified`, and optional prerequisites.
- Blog post: `blogTopic`, `difficulty`, `estimatedMinutes`, `specVersion`, `lastVerified`, and optional `substackUrl`.
- Spec Watch: `releaseDate`, `releaseStatus`, `officialSource`, structured changes, client/server/production impacts, recommended actions, and primary references.

Guide categories are `learn`, `build`, `operate`, and `security`. Blog topics are `concepts`, `architecture`, `security`, `production`, `ecosystem`, and `opinion`.

Use ISO `YYYY-MM-DD` dates and globally unique lowercase filenames. Each Guide step needs a stable lowercase ID and a matching level-two MDX heading. Update `lastVerified` only after checking the stated specification revision.

Supported MDX components are `Callout`, `Steps`, `Tabs`, `Checklist`, `CardGrid`, `MetadataPanel`, and `ProtocolDiagram`. Imports, exports, and executable JavaScript are forbidden.
