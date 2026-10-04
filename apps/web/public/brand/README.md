# All Things MCP — Open Junction

The approved family lives under `open-junction/`: fourteen outlined SVG masters,
matching transparent PNGs, optically adjusted favicons, blue-square avatars,
and a cache-busted 1200×630 social-sharing card at `social-card-v2.png`. All
logo lettering is paths; logo rendering does not depend on an installed font.
The upload-ready GitHub repository preview is `github-social-preview.png`
(1280×640, solid background, under GitHub's 1 MB limit).

Use `svg/horizontal-light.svg` on light backgrounds and `svg/horizontal-dark.svg`
on dark backgrounds. `primary-*` includes **Learn. Build. Ship with MCP.**;
`stacked-*` is vertical. Monochrome and symbol-only variants are also supplied.
Preserve proportions, the transparent hub, and one terminal diameter of clear
space. Logo blue is `#2563EB`; the on-dark variant uses `#60A5FA` on `#0F172A`.

The source of truth is `skills/all-things-mcp/brand-system/assets/logo/open-junction/`
at the repository root. `pnpm brand:generate` copies its approved artwork and
rebuilds the social card; it never redraws or writes back to the masters.
Website code uses `apps/web/lib/brand.ts` for versioned asset URLs.
Articles, guides, and guide steps use `/api/social-card/v2` for title-aware
cards resolved from canonical authored content rather than arbitrary query text.

Files directly under `/brand/` preserve existing public URLs, but contain only
Open Junction artwork. They are compatibility aliases, not retired logo assets.
Use `/brand/open-junction/` for new links. See the project brand skill for full
selection, colour, typography, and usage guidance.
