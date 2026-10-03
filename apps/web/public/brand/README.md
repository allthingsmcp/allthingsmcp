# All Things MCP brand assets

The SVG files are the production masters. PNG exports are supplied for tools that cannot use SVG.

| Asset                          | Intended use                                                           |
| ------------------------------ | ---------------------------------------------------------------------- |
| `all-things-mcp-logo.svg`      | Compact navigation and footer lockup                                   |
| `all-things-mcp-logo-dark.svg` | Compact lockup for the dark editorial footer                           |
| `logo-mark.svg`                | Standalone mark on transparent light surfaces                          |
| `icon-square.svg`              | Social avatars, app tiles, and directory listings                      |
| `favicon.svg`                  | Browser favicon; simplified and optically strengthened for small sizes |
| `wordmark.svg`                 | Name-only treatments where the mark is already present                 |
| `primary-logo-light.svg`       | Full lockup for white or pale backgrounds                              |
| `primary-logo-dark.svg`        | Full lockup for navy or dark backgrounds                               |
| `social-card.svg`              | Open Graph and social-sharing artwork                                  |

## Usage guidance

- Prefer SVG wherever the destination supports it.
- Keep a clear-space margin at least equal to one node diameter around the artwork.
- Do not add glow, blur, bevels, outlines, or drop shadows.
- Do not recolor individual nodes. Use the supplied light and dark variants.
- Do not set the primary lockup narrower than 240 px. Below that size, use the mark or square icon.
- The dark primary logo has a transparent background; preview it on `#071426`.

Regenerate all files with `pnpm brand:generate`.
