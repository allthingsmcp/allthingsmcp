# Browser regression checks

Run `pnpm test:e2e` from the repository root. Playwright starts an isolated
website on port 3100 and the real Guide Runtime on port 8887. The runtime uses
memory persistence and an HTTP fixture for Open-Meteo on port 8890. The browser
still goes through the actual Next API routes and MCP SDK handler. No Supabase
credentials or internet weather service are needed for this deterministic run.

The Weather walkthrough creates a workspace through the UI, adds all three
capability types, discovers/lists them, calls a tool, reads a resource, retrieves
a prompt, completes the guide, and verifies configuration and protocol traces
after a reload. It also fails on API errors or uncaught browser exceptions.

To check running local servers, including their actual database and live
Open-Meteo integration, run from `apps/web`:

```sh
PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm exec playwright test tests/e2e/platform.spec.ts --grep 'real Weather Guide'
```

Supplying `PLAYWRIGHT_BASE_URL` disables the isolated server harness. The
walkthrough creates temporary anonymous workspaces on that runtime, which expire
according to its normal retention policy. Use a development or preview runtime.

The visual suite seeds real runtime workspaces and includes reviewed desktop and
mobile baselines for capability builders, generated code, protocol discovery,
live weather results, and completion. Captures exclude only global/development
overlays and variable duration labels; actual protocol payloads and errors remain
visible. Review UI changes before updating these baselines. The functional
walkthrough also saves completion and reloaded protocol screenshots under its
Playwright test output directory for review.
