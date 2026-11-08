# Brand source of truth

This folder holds the approved **Open Junction** identity: `identity.json` and
the outlined SVG/PNG masters under `logo/open-junction/`.

- Do not edit the masters by hand or redraw them in code.
- `pnpm brand:generate` copies them into `apps/web/public/brand/` (the files the
  website serves) and rebuilds the social cards. Treat that output as generated.
- Usage rules live in [`docs/brand/`](../docs/brand/); the agent-facing summary
  is `skills/all-things-mcp/brand-system/SKILL.md`.
- The bundled Geist typeface is licensed separately; see
  `logo/open-junction/Geist-LICENSE.txt`.
