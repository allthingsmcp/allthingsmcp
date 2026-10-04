# Memory investigation — 2026-10-04

## Findings and scope

The reported `pnpm dev:web` process exhausted roughly 4 GiB of JavaScript
heap. On this 8 GiB Mac, Next's development launcher assigns half of physical
RAM to the server's old-space heap. Previous development traces recorded
multi-gigabyte retained heaps and memory-threshold restart events.

The crash stack identifies exhaustion, not the retaining objects. No heap
snapshot was captured from the crashed process, so the precise allocation
responsible for that individual crash is not proven.

| Finding | Where it applies | Action |
| --- | --- | --- |
| Generated source maps are strongly retained across evaluated scripts; React development rendering generates these during hot reloads | Development, both Turbopack and Webpack | Disable Node server source maps in normal dev and E2E launches; retain `dev:debug` for short debugging sessions |
| Installed Next 16.2.12 omitted URL-key size from its production router-cache budget and lacked compressed-response cleanup fixes | Production framework paths | Upgrade Next and its ESLint config to 16.3.8, with a committed lockfile |
| The weather provider retained expired query results indefinitely in a process-global map | Separately deployed Guide Runtime, not the crashing web process | Sweep expired entries and cap retention at 256 LRU entries; bypass caching for oversized URL keys |

The runtime baseline is Node 24 LTS, pinned through `.nvmrc`, package engines,
and CI. Node migration alone is not the source-map fix: the upstream report
also reproduces on Node 24. Normal production `build` and `start` commands
are unchanged; never deploy the development server.

Primary references:

- [Next development source-map retention report](https://github.com/vercel/next.js/issues/98221)
- [Node generated-source-map cache report](https://github.com/nodejs/node/issues/65760)
- [Production router-cache accounting](https://github.com/vercel/next.js/issues/94890)
- [Aborted response/render-tree retention](https://github.com/vercel/next.js/issues/94919)
- [Next 16.3 memory improvements](https://nextjs.org/blog/next-16-3)
- [Next 16.3.8 release](https://github.com/vercel/next.js/releases/tag/v16.3.8)

## Evidence and verification

- A bounded offline Node 25.1.0 reproduction evaluated 300 tiny scripts with
  a 32 KiB source map. After forced GC, source maps enabled grew from 3.03 to
  12.95 MiB; disabled grew from 3.03 to 3.25 MiB. This reproduces the underlying
  retention mechanism, not the complete application's HMR workload.
- Request-scoped Supabase clients did not accumulate in offline stress tests:
  4,000 anonymous clients stayed at 8.72–9.00 MiB post-GC; 2,000 clients with
  mocked authenticated responses stayed at 9.02–9.40 MiB. Authentication
  lifecycle code was not changed and clients remain isolated per request.
- Before the weather fix, 100 expired entries remained after advancing the
  clock 25 hours and looking up another location. Seven new tests verify
  expiry release, capacity, LRU behavior, concurrent misses, freshness,
  clone isolation, and oversized-key handling.
- On Node 24.19.0, the patched production build passed 1,031 completed
  requests plus 153 cancellation attempts; 149 were cancelled before the
  client had received the full response. Post-GC heap was 49.4 MiB warm and
  49.2 MiB final; external memory stayed at 10.6 MiB. RSS was 125.1–139.1 MiB,
  with an observed 176.6 MiB peak. Results vary with platform and allocator.
- Formatting, lint, workspace types, 31-document content validation, 62 unit
  tests, nine memory-harness tests, and the production build passed.
- Thirty production desktop/mobile browser checks passed (two platform-only
  checks skipped). Two isolated development integration checks passed,
  including the complete Weather Guide through the real BFF/MCP runtime
  with a mocked upstream weather provider.

The first browser selection included preview-only draft/directory pages;
their expected production 404s are not regressions. Publication gates were
preserved and production-specific assertions were rerun successfully.

## Repeatable regression check

```sh
pnpm build
pnpm test:memory
```

CI runs the same check after building. It starts only its own production
server on a temporary loopback port, caps that test process at a 1 GiB heap,
uses bounded requests/deadlines, and cleans up the child. Memory sampling uses
private IPC and an in-process inspector session; no HTTP diagnostics or TCP
debugging port are added to the deployed application.

The check fails on excessive post-warm heap/external growth (32 MiB each),
unexpected HTTP/RSC results, server failure, timeouts, or missing incomplete
response cancellation coverage. It reports sampled heap/RSS peaks and warns
on RSS growth above 128 MiB because allocator high-water memory is not by
itself proof of a leak.

## Remaining limits

This is a short anonymous-traffic regression test, not a long-running soak,
authenticated end-to-end load test, or a production-capacity guarantee.
Disabling source maps mitigates one confirmed development retention path;
React's separate development caches may still grow across long edit sessions.
The weather cache is entry-count bounded, not a response-byte limit. Existing
API/upstream JSON buffering remains a separate hardening opportunity.

Before a high-traffic rollout, run staging load tests with realistic signed-in
flows and payloads, and monitor heap, RSS, request latency, and instance
restarts. No production deployment or external monitoring was changed by
this investigation.
