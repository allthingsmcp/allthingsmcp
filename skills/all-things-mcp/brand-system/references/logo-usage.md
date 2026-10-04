# Open Junction logo usage

Approved on 3 October 2026. The rounded, open diamond hub, three circular
terminals, equal branches, and custom P counter distinguish the identity.
Use the outlined masters; do not redraw, retype, recolour, or distort them.

## Select the background variant

All names below are under `assets/logo/open-junction/svg/`, relative to this skill.

| Placement | Light background | Dark background |
| --- | --- | --- |
| Navigation or footer, no tagline | `horizontal-light.svg` | `horizontal-dark.svg` |
| Full name and signature line | `primary-light.svg` | `primary-dark.svg` |
| Stacked lockup | `stacked-light.svg` | `stacked-dark.svg` |
| Symbol | `mark-blue.svg` | `mark-on-dark.svg` |
| Wordmark | `wordmark-navy.svg` | `wordmark-white.svg` |
| Monochrome lockup | `horizontal-mono-navy.svg` | `horizontal-mono-white.svg` |
| Monochrome symbol | `mark-mono-navy.svg` | `mark-mono-white.svg` |

The `light` and `dark` suffixes describe the background. Keep the hub transparent
and one terminal diameter of clear space around visible artwork. Prefer the
tagline-free horizontal lockup in navigation; judge its legibility at actual
mobile size. Start around 200px for horizontal lockups and 360px for taglined
primary lockups, then inspect the placement. Use the optically adjusted favicon
exports for small icons and the blue-square avatar exports for profiles/app tiles.
Matching transparent PNGs are supplied under `png/` for email or raster-only tools.

## Repository integration

`pnpm brand:generate` copies these masters to
`apps/web/public/brand/open-junction/` and builds a 1200×630 social card from the
outlined primary logo.
It does not change the approved source artwork or depend on the private video repo.

Website code selects assets through `apps/web/lib/brand.ts`; the shared `Logo`
component handles header and footer variants. Icons, metadata, author avatars,
and welcome-email images use versioned Open Junction URLs to avoid stale caches.
Older public `/brand/` URLs are compatibility aliases containing the same new
artwork, not another logo family. New code should use the versioned paths.

Keep the source typeface license with distributed assets. Previously exported
videos and Git history are not logo sources.
