# All Things MCP Substack brand pack

Upload-ready Open Junction assets for the All Things MCP publication.

## Files

- `publication-logo.png` — 512×512 transparent publication logo.
- `publication-wordmark.png` — 1344×256 transparent header wordmark, fitted to
  Substack's maximum 21:4 aspect ratio without distorting the logo.
- `email-banner.png` — 1100×220 email header banner.
- `welcome-cover.png` — 1200×1200 welcome-page cover.
- `post-preview-background.png` — 1200×630 background for issue previews.
- Matching SVG files are included for editable/vector workflows.

## Substack theme

- Publication name: **All Things MCP**
- Newsletter imprint: **ATM Field Notes**
- Short description: **Practical MCP guides, specification changes, and implementation notes—without the noise.**
- Accent: `#2563EB`
- Background: `#FFFFFF` or `#F8FAFC`
- Titles: Geist or the closest available neutral grotesk/sans-serif
- Body: Inter or the closest available neutral sans-serif
- Header layout: Inline

## Post-preview title placement

Use `post-preview-background.png` as the locked background. Add the issue title
in white Geist Bold at approximately 64 px, starting at x=72 and y=244. Keep it
within a 900 px-wide, three-line-safe area ending above y=500. Preserve the
fixed **ATM FIELD NOTE** label and topology artwork.

The approved logo artwork must not be retyped, redrawn, recoloured, or distorted.
Regenerate the pack with `pnpm brand:generate` from the repository root.
