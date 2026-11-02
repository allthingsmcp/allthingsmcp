# MCP Tasks thumbnail workshop

Add Tasks support to a local MCP server and MCP client that turn six sample
images into 18 WebP thumbnails with Sharp. This six-step ATM Guide is for
developers who have already built an MCP server and are new to Tasks.

The walkthrough covers deferred results, task state, reconnection, cancellation
and errors. It assumes familiarity with tool registration, MCP tool calls and
asynchronous JavaScript. No image API, LLM, account or remote service is needed
after dependencies are installed.

## Run the completed project

Use Node **24.21.0** and pnpm **10.20.0**. In this directory:

```sh
pnpm install --frozen-lockfile
pnpm run fixtures
pnpm run verify
pnpm run server
```

Keep the MCP server running. Open a second terminal in this same directory:

```sh
pnpm run client inspect
pnpm run tasks-client
pnpm run verify --output
```

The default run creates 18 images, with widths 320, 640 and 1280, plus a
`manifest.json` under a unique `output/` directory. Generated sample images are
original geometric artwork. `fixtures/broken.png` is intentionally invalid.

For the ordinary tool-call comparison, start `pnpm run server --ordinary` and
run `pnpm run basic-client`. Stop that server before starting Tasks mode.

## Observe, resume, cancel

Restart the server with `pnpm run server --demo-delay-ms 1000` to add a clearly
artificial one-second pause between outputs. Image processing itself is often
too quick to observe every intermediate state. Pacing is disabled by default.

```sh
pnpm run client run --detach
pnpm run client watch last
pnpm run client run --detach
pnpm run client cancel last
pnpm run client run --images broken.png
pnpm run client run --widths 320,640,960,1280
```

`last` reads `output/last-task.json`; you can use a printed Task ID instead.
Watching does not submit a second batch. For another port, run the server with
`--port 3002` and each client command with `--url http://127.0.0.1:3002/mcp`.
`basic-client`, `tasks-client` and `probe` accept an optional MCP server URL as their first argument.

## Try your own image

After placing `my-photo.jpg` in `fixtures/`:

```sh
pnpm run client run --images my-photo.jpg --widths 320,640
pnpm run verify --output
```

Expect two WebP outputs. Inputs smaller than the target width are not enlarged.

## What is supplied

- `src/resize-image.ts`: supplied Sharp image pipeline.
- `src/thumbnails.ts`: sequential batch processing, manifests and cancellation checks.
- `src/app.ts`: MCP server construction and tool registration.
- `src/task-handlers.ts`: explicit current-extension request handlers.
- `src/task-store.ts`, `src/task-worker.ts`: local file store and worker helpers.
- `src/connection.ts`: SDK discovery plus a sample HTTP adapter using Tasks V2 schemas.
- `src/watch-task.ts`: the polling loop learners write.
- `src/client.ts`, `src/server.ts`: supplied command-line wiring.
- `scripts/tasks-client.ts`: the MCP Tasks caller learners write.
- `src/task-protocol.ts`: supplied validation schemas and capability checks.
- `scripts/basic-client.ts`: optional ordinary tool-call comparison.

The learner edits four files: `src/app.ts`, `src/task-handlers.ts`,
`scripts/tasks-client.ts` and `src/watch-task.ts`.

Files with `TODO` in a checkpoint are intentional exercises. Run only the commands
introduced by your current Guide step. Full workflow tests pass after step 4.

## Protocol and boundaries

Pinned to MCP **2026-07-28** and `io.modelcontextprotocol/tasks`. The client
advertises support per request; the server decides whether to return a task.
`tasks/get` includes the final result. This example does not use legacy
`tasks/result`, `tasks/list`, or the base SDK's experimental task API.

The extension's `core/v2` schemas validate task traffic. The local
`createDispatcher`, `TaskStore`, and `TaskWorker` are example code, not SDK APIs.
The dispatcher handles this sample's JSON responses over Streamable HTTP; it
is not a general client for SSE, authentication, subscriptions, or requests for
additional user input. See the extension's high-level client API for those needs.

The server binds to loopback, rejects browser origins, and restricts image names
to the fixture directory. The CLI and server share a local filesystem; returned
paths are not downloadable remote resources. Run one server per project folder.
This is a teaching worker with no distributed queue, authentication, retries,
automatic task cleanup, or automatic job restart. Records expire one hour after
creation; expired files remain on disk. Delete `.tasks/` and `output/` manually
only after stopping the server when you no longer need them.

Disconnecting the client leaves server work running. Restarting the server marks
unfinished tasks `failed`; completed results remain readable until expiry.
Cancellation takes effect between Sharp operations and retains partial files.
A late request may still observe `completed`. A bad image produces a
`completed` task with `result.isError: true`, distinct from a JSON-RPC `failed` task.

## Verification

```sh
pnpm run fixtures
pnpm run typecheck
pnpm run test
```

Tests exercise real HTTP traffic, persisted handles, reconnecting, all 18 image
dimensions, cancellation, corrupt inputs, protocol errors, expiry, restart,
path boundaries, orientation and no enlargement. Integration tests open an
ephemeral loopback port. Tested on macOS arm64; Linux CI is configured separately.
Windows and human learner timing have not been verified.

In the ATM repository, maintainers also run `pnpm run checkpoints`,
`pnpm run snippets`, and `pnpm run package --check`. Regenerate site downloads
with `pnpm run package --site` after changing source. These maintenance commands
are deliberately excluded from downloadable projects.

## References

- [Official Tasks introduction](https://modelcontextprotocol.io/extensions/tasks/overview)
- [Tasks specification](https://tasks.extensions.modelcontextprotocol.io/specification/2026-07-28/tasks)
- [Tasks TypeScript API](https://tasks.extensions.modelcontextprotocol.io/typescript/)
- [MCP TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/)
- [Sharp resizing](https://sharp.pixelplumbing.com/api-resize/)

Last verified: 2026-10-31. See `package.json` and `pnpm-lock.yaml` for exact versions.
