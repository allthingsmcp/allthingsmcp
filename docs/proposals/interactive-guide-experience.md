# Interactive guide experience: review and proposal

Status: proposal, 2026-11-09. Scope: the Building Your First MCP Server interactive guide, the Guide Runtime behind it, and how the same system could teach extensions such as Tasks and authorization with Client ID Metadata Documents (CIMD).

## Summary

The interactive guide runs on a sound engine. Each workspace is a real MCP server built with the official TypeScript SDK and executing real `2026-07-28` requests. It is secure by construction: no learner code runs, credentials are hashed, and rate limits apply. The learning experience on top of that engine is thin.

Today the learner **configures** a server rather than **building** one. They toggle curated items from a catalog, and each click shows up in four views that don't talk to each other: Visual, Code, Protocol and Client. The code they read is not the code that runs. The client is a form, not a host. Progress tracking loses their work between pages. Nothing in the system is shaped to teach anything except the weather server.

The good news: almost every problem traces back to six root causes, and fixing them yields a workspace that can teach Tasks, elicitation and authorization the same way, with nothing to install.

The north star in one sentence: **every action the learner takes produces a visible consequence in the code, on the wire and in the behaviour, at the same moment, and the learner can trace any one of those back to the other two.**

## How this review was done

- **A live walkthrough as a first-time learner.** Steps 1–8 at 1440px and 390px, against a local Guide Runtime in memory mode: create the server, add a tool, connect, call a tool, review and export.
- **Two code audits.** One of the learner-facing UI and state (`apps/web/components/interactive-guide*`, `apps/web/lib/interactive-guides*.ts`, `guide-step-experience.tsx`, `use-guide-progress.ts`). One of the runtime, contracts, templates and codegen (`apps/guide-runtime`, `packages/contracts`, `packages/mcp-templates`).
- **The MCP `2026-07-28` specification.** Tools, discovery, elicitation, transports, client registration (CIMD) and the changelog, plus the Tasks extension.

File references below are `path:line` from the repository root.

## What a first-time learner experiences today

1. **Step 1, What is MCP?** Prose and diagrams with no interaction. The footer still says "Complete the activity above, or mark the step complete yourself".
2. **Step 2, Create your server.** They type a name and press **Create server**. A "Runtime workspace ready" chip appears. The topology diagram beside the form doesn't change. The **Code** tab opens on about 40 lines of imports and Open-Meteo fetch code, generated even though the server has no tools yet. `new McpServer` is below the fold.
3. **Step 3, Add tools.** The sidebar now reads "0 of 8 complete": step 2's checkmark has gone. They pick **Get current weather** from a three-item catalog and press **Add to server**.
   - The new `registerTool` call lands at line 96 of 164. Nothing highlights it or scrolls to it.
   - The prose's next instruction, "Add Get forecast", sits below the workspace, so they scroll back up to act on it.
4. **Steps 4–5, Add resources and prompts.** The same pick-and-add pattern. The prompt "catalog" has one item.
5. **Step 6, Connect.** One click jumps straight to "Discovery complete: 1 tools · 0 resources · 0 prompts". The two exchanges that just happened aren't shown as a sequence, and the inspector shows only the last response, as raw JSON cut off on the right.
6. **Step 7, Test.** A hand-built form (Location, Unit) with **Call get_weather**.
   - The prose says "pressing the button is your approval", but there is no approval step.
   - The result is the same JSON wall, shown twice.
   - If the learner skipped `get_forecast` earlier, the instructions no longer match the screen.
   - The deliberate failure shows a global "Request failed" alert with "Retry connection". The lesson panel says it returned a JSON-RPC error, which is the opposite of what the prose teaches.
7. **Step 8, Review.** The workspace's own checklist shows the work as done, while the sidebar says "0 of 8 complete". A new tab or a reopened browser loses the "seven-day" workspace entirely.

## Diagnosis: six root causes

### 1. The learner configures; they never author

A learner can only name the server and switch six curated capabilities on or off. The contract is `{ serverName, enabledCapabilityIds }` (`packages/contracts/src/index.ts:88-91`), and the web app replaces anything added with the catalog copy (`apps/web/components/interactive-guide-context.tsx:441-452`).

The things that actually determine whether a model can use a tool are never in the learner's hands: the description, the field names, the required flags, the enum values. There is nothing to decide, so there is no cause and effect to learn from. Validation code exists (`validateCapability`, `apps/web/lib/interactive-guides.ts:515-535`), but nothing calls it.

### 2. Four views, no connections between them

Visual, Code, Protocol and Client share state but don't reference each other:

- Adding a tool doesn't change the topology (`apps/web/components/interactive-guide/visual-mode.tsx:74-97`).
- Code shows no diff. The only highlight is static and marks every `server.register` line (`apps/web/components/interactive-guide/code-views.tsx:62`).
- No protocol message links back to the code or the choice that produced it.
- Mode state resets on every page (`apps/web/components/interactive-guide-block.tsx:22`).

Worse, **the code is not what runs.** The runtime builds its server dynamically (`apps/guide-runtime/src/mcp-runtime.ts:62-172`), while the Code tab comes from a separate string generator (`apps/web/lib/interactive-guides-codegen.ts`). They diverge in ways a learner sees directly:

- The code shows `.describe()` on every field, but `tools/list` returns fields with no descriptions.
- The runtime registers a tool `title`; the generated code omits it.
- Result shapes differ.
- Resource contents differ.
- Errors carry different text and `_meta`.

The downloaded project returns different JSON from what the guide showed.

### 3. Prose and workspace are two separate sources of truth

- **Instructions come after the workspace they refer to.** The workspace sits in the middle of the prose, so the learner reads, scrolls past the block, then scrolls back up to act.
- **Requirements don't match.** Prose checkpoints and objectives disagree: step 3 completes after one tool while the prose asks for two (`apps/web/lib/interactive-guides.ts:887-889`).
- **The workspace never states its goal.** It doesn't show the current step's objective; objectives appear only in step 8.
- **Instructions can drift from state.** If a learner skips an action, later instructions describe a server they don't have.

### 4. The wire is hidden, and the client isn't a host

The learning client runs in-process with `handler.fetch` (`apps/guide-runtime/src/mcp-runtime.ts:237-243`), and only JSON bodies are recorded (`:258-267`). Learners never see:

- the HTTP method;
- the endpoint;
- headers, including the `Mcp-Method` and `Mcp-Name` the runtime actually sends;
- status codes;
- server-sent events.

That is fine for tools, and it rules out teaching authorization, where the lesson is a 401 and a `WWW-Authenticate` header. It also blocks streaming: the handler is closed immediately after `fetch` returns (`apps/guide-runtime/src/app.ts:504-509`), which would cut off any SSE response.

The Client tab is a form, not a host. There is no user, no model choosing a tool, no approval step and no rendering of a result the way a host or model would read it. The three roles the guide teaches in step 1 never appear in the interaction.

### 5. The system is weather-shaped, not a platform

The state shape, scene list, objectives, step IDs, argument mapping, default names, codegen, runtime executors and command contract are all specific to this one guide:

- `apps/web/lib/interactive-guides.ts:13-21, 74-83, 877-925`
- `apps/web/components/interactive-guide-context.tsx:409-414, 434, 577`
- `apps/guide-runtime/src/mcp-runtime.ts:84-132`
- `packages/contracts/src/index.ts:120-133`

There's no way to add a Tasks scene or an authorization scene without forking most of it.

### 6. Progress and persistence break trust

- **Progress forgets.** Anonymous progress lives in React state (`apps/web/components/use-guide-progress.ts:35-55`), and the guide provider remounts on every step (`apps/web/components/guide-step-experience.tsx:58-71`).
- **Finished work never counts.** Steps only auto-complete when an objective changes from false to true while that page is open (`apps/web/components/interactive-guide-context.tsx:461-488`), so work already done never counts.
- **The workspace dies with the tab.** The anonymous credential is in tab-scoped `sessionStorage` (`apps/web/components/interactive-guide-context.tsx:65-79`). The guide promises a seven-day workspace.
- **Edits erase history.** Every configuration change silently disconnects the client and erases the protocol history (`apps/web/lib/interactive-guides.ts:777-785`; `apps/guide-runtime/src/workspace-repository.ts:142`).

## Design principles for the next version

1. **One action, three consequences.** Every learner action updates the code, the wire and the behaviour together. Each is highlighted and each links to the other two.
2. **Author, don't pick.** Learners write the parts that matter to a model: names, descriptions, schemas and URIs. Curated behaviours stay curated, because that's what keeps the runtime safe.
3. **The code you see is the code that runs.** One source produces both the server the runtime executes and the file the learner reads and downloads.
4. **Show the wire.** Every exchange can be viewed as an HTTP request and response, including headers, status and stream frames, with each field explained on hover.
5. **Play every role.** The learner acts as the user, the model and the host, switching between them deliberately.
6. **Fail on purpose.** Every important failure can be triggered, labelled correctly and recovered from.
7. **Tight loops.** Connect the client early. From then on, every addition is discovered, called and inspected in the same step.
8. **Nothing to install until export.** Advanced topics (Tasks, elicitation, authorization) run in the workspace too.

## The target experience

### Layout: a lesson rail beside a persistent workspace

Replace "workspace embedded mid-prose" with a two-pane layout on desktop:

- **Lesson rail on the left, about 38%.** It holds the step's short explanation and its **missions**: two to five concrete tasks with live checkmarks driven by workspace state. Instructions sit next to the thing they refer to, so nobody scrolls back up. Longer explanations collapse into "Why this works" sections.
- **Workspace on the right, sticky, about 62%.** It persists across steps, with no remount and no flash of "Not created yet". The step changes the workspace's focus, not its identity.
- **On mobile:** the lesson reads full-width, and a persistent "Open workspace" bar opens the workspace as a full-screen sheet. Missions appear in both, so the learner always knows what to do next.

Progress has one source of truth: a step is complete when its missions are complete, recomputed from workspace state on load. The separate completion checklist and the sidebar counter go away.

### The living diagram (replaces Visual)

A diagram of the whole system that **is** the server, not a picture of one:

```text
You (user) ─ Host ─ Model ─ MCP client ══ Streamable HTTP ══ MCP server ─ tools / resources / prompts ─ Open-Meteo
```

- Capabilities appear on the server as the learner creates them.
- Every protocol exchange animates as a numbered packet travelling along the path, such as `tools/call` going out and a result coming back. Clicking a packet opens it in the inspector.
- Upstream calls from the server to Open-Meteo are drawn as a separate, non-MCP lane. This reinforces "MCP is the boundary, not the API".
- Selecting any node (host, client, server, a tool) shows what it is responsible for, and jumps to its code.

This one component carries the mental model from the What Is MCP? article into the interaction, and it's the same visual language as the site's diagrams.

### Focused code with a source map (replaces Code)

- **Sections, not a wall.** The server file is shown as labelled sections: Identity, Tools, Resources, Prompts, Transport. Plumbing such as the Open-Meteo helpers starts folded under "Behind the scenes".
- **Every change is visible.** After any action, the code scrolls to what changed and shows it as a diff, with a gutter note such as "Added in step 3: your `get_forecast` tool".
- **Two-way links.** Hovering a line highlights its effect: the tool on the diagram and its entry in the latest `tools/list`. Hovering a field in the inspector highlights the line that produced it. This needs codegen to emit source-mapped segments, which is a small change once there's a single source (see "One source of truth" below).
- **Still read-only.** Learners edit through structured editors, never free-form code. The guide's promise not to copy and paste code stays intact, and the runtime never executes learner code.

### Authoring editors (replace the catalog)

- **Tools**
  - **What the learner writes:** name, title, description and fields. Each field has a name, type, description, required flag and optional enum.
  - **What they pick:** a behaviour from a curated list, such as "Current weather" or "7-day forecast", then bind its parameters to their fields, for example `location` to "place".
  - **Live previews:** the JSON Schema and the `tools/list` entry.
  - **A "What the model sees" panel:** the exact definition a model receives, with gentle lint. "This description doesn't say what the tool returns." "Two fields have no description."
- **Resources**
  - **What the learner writes:** URI, name, title, description and MIME type.
  - **What they pick:** a curated data source.
  - **Live previews:** the `resources/list` entry and a sample read.
- **Prompts**
  - **What the learner writes:** name, arguments and template text, with `{argument}` placeholders.
  - **Live previews:** the `prompts/list` entry and the filled message.

The catalog becomes a set of **starting points** ("Start from the forecast example"), not the only option. Learner-written text is bounded, validated and shown back verbatim. See the open question on moderation before it is served at the public endpoint.

### Host simulator (replaces Client)

Three explicit roles, each with its own panel:

1. **You as the user.** A small chat input: "Do I need an umbrella in Lagos tomorrow?" Prompts appear as slash commands here, such as `/plan_for_weather`, so prompts are user-controlled in the interaction, not just in the prose.
2. **You as the model.** You see the user message and the tool list exactly as a model would, then choose a tool. The argument form is **generated from the tool's `inputSchema`**, not hand-built, so schemas the learner wrote produce the form they fill in.
3. **You as the host.** An approval dialog shows the tool and arguments before anything is sent. You can deny it, and the guide explains what the host would do next.

The result is shown three ways, as tabs:

- **What the model reads:** `content`.
- **What code receives:** `structuredContent`.
- **What the user sees:** a rendered card, for example "Lagos, tomorrow: 80% chance of rain".

That makes the difference between `content` and `structuredContent` obvious instead of explained.

An optional "auto model" mode could let a small, deterministic planner pick the tool, to show the loop running by itself. A real LLM is possible later (see open questions).

### Inspector with a wire view (replaces Protocol)

- **Timeline.** A sequence diagram generated from the real events, numbered in order, with direction: requests out, results in, notifications in. It replaces a flat list that renumbers events and labels everything client-to-server (`apps/web/lib/interactive-guides.ts:461-473`).
- **Annotated JSON.** Hovering any field (`_meta`, `resultType`, `ttlMs`, `cacheScope`, `isError`) explains it in place, and points to the line of code or the choice that produced it.
- **Wire toggle.** The same exchange shown as HTTP: method and URL, headers (`Mcp-Method`, `Mcp-Name`, `Content-Type`), status and body, plus SSE frames when a response streams.
- **Compare.** Pick two exchanges and see the differences. For example, a `tools/list` before and after you edited a description.

### The failure lab

A panel of deliberate failures, each labelled correctly:

| Trigger                                      | What the learner sees                                             |
| -------------------------------------------- | ----------------------------------------------------------------- |
| Call a place that doesn't exist              | A normal result with `isError: true`. The model can recover.      |
| Upstream unavailable                         | The same, with a provider error code                              |
| Skip client validation and send a wrong type | A JSON-RPC `error` with `-32602`. The request itself was invalid. |
| Call a tool that doesn't exist               | A JSON-RPC `error`                                                |
| Send an unsupported protocol version         | `UnsupportedProtocolVersionError` and how a client recovers       |

This fixes today's lesson text, which calls every failure a JSON-RPC error (`apps/web/components/interactive-guide/protocol-mode.tsx:12-33`). Expected failures also stop triggering the global "Request failed / Retry connection" alert.

### Changing a live server is a lesson, not a reset

Today, editing the server disconnects the client and wipes history. Instead, when a capability changes while the client is connected:

- the server sends `notifications/tools/list_changed` on a `subscriptions/listen` stream;
- the timeline shows it arriving;
- the client re-lists.

That teaches `listChanged` and the stateless model in one moment. It requires the runtime to support streaming responses (see "Platform changes").

## A revised curriculum for Building Your First MCP Server

The biggest structural change is to **connect the client in the first building step**, so every addition is discovered and used right away. The current order builds everything first and tests at the end.

| #   | Step                           | Missions                                                                                                                      | What it teaches                                       |
| --- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | Meet the cast                  | Select each participant in the living diagram. Watch one scripted request travel end to end.                                  | Host, client, server and model, and who decides what  |
| 2   | Bring a server online          | Name it. Connect the client. Discover an empty server and find your name in `serverInfo`.                                     | Identity, `server/discover`, `_meta`, statelessness   |
| 3   | Your first tool                | Write a description and a `location` field. Watch the model's view change. Approve and call it as the model and the host.     | Tool definitions, schemas, `tools/call`, approval     |
| 4   | Make the tool better           | Add an optional enum field. Rewrite a vague description and compare the two `tools/list` responses. Send an invalid argument. | Schema features, description quality, validation      |
| 5   | Give the app something to read | Write a URI and attach the resource to the chat as context.                                                                   | Resources and app control                             |
| 6   | Let the user start the task    | Write a prompt and use it as a slash command. Watch the model call your tool to answer it.                                    | Prompts, user control, how the three primitives chain |
| 7   | Look at the wire               | Switch to the wire view. Find the headers and the caching fields. Change the server and watch `list_changed` arrive.          | Streamable HTTP, headers, caching, notifications      |
| 8   | Break it on purpose            | Work through the failure lab.                                                                                                 | Tool errors versus protocol errors                    |
| 9   | Take it home                   | Download, run and connect a real host. A guarantee: same code, same JSON.                                                     | Transports, stdio versus HTTP, what's next            |

Each step's missions are the step's completion criteria. Prose explains, missions instruct, and the two can't drift.

## Teaching extensions in the same workspace

The extension scenes reuse the same parts (living diagram, focused code, host simulator, wire view), so each new topic is a new **scene module**, not a new app.

### Tasks (`io.modelcontextprotocol/tasks`)

**What the learner does:**

1. Switch on a curated long-running tool, such as "Generate 18 thumbnails". It's simulated server-side, so it doesn't call any upstream service.
2. See the code gain the Tasks handlers, highlighted:
   - declaring the extension;
   - returning a task handle from `tools/call`;
   - the `tasks/get` and `tasks/cancel` handlers.
3. Call the tool as the model. The timeline shows the immediate task handle, then a polling cadence driven by `pollIntervalMs`. A task lane on the living diagram shows `working: 6 of 18` filling up.
4. Press **Close the client** mid-batch. The diagram keeps the task running on the server.
5. Press **Reconnect with saved task ID**. Polling resumes with no second `tools/call`.
6. Press **Cancel**. Watch the acknowledgement, then the real outcome: `cancelled`, or `completed` if the batch won the race.
7. Fail on purpose: a batch with an unreadable image ends `completed` with `isError: true`, not `failed`.

**What it needs:**

- A durable task table.
- A worker that outlives the per-request handler. Today `handler.close()` runs straight after each request (`apps/guide-runtime/src/app.ts:504-509`).
- `get-task` and `cancel-task` commands in the contract.
- Polling budgeted separately from the 120-requests-per-hour workspace limit.

The SDK has no Tasks runtime, but the repository's Tasks guide already registers the handlers with `setRequestHandler`, so the pattern is proven.

### Elicitation and `input_required`

This is the most additive extension, and a good first scene to build after the core redesign.

1. A curated "ambiguous place" behaviour answers "Lagos" with `input_required` and a form-mode elicitation: Nigeria or Portugal.
2. The host simulator renders the form from `requestedSchema`.
3. The timeline shows the retry as a new request with a new `id`, carrying `inputResponses`.

**What it needs:**

- The learning client declares `elicitation` in `clientCapabilities`. Today it sends `{}` (`apps/guide-runtime/src/mcp-runtime.ts:184-192`).
- The contract carries `inputResponses` and an HMAC-signed `requestState`.
- The runtime's failure check stops treating `input_required` as a normal result (`apps/guide-runtime/src/mcp-runtime.ts:254-257`).

### Authorization with Client ID Metadata Documents

This is where the wire view earns its place, because the lesson is a sequence of HTTP exchanges between four parties. It can run entirely in the workspace.

**Parties on the living diagram:** You, the MCP client, the MCP server as protected resource, a teaching authorization server, and the client's metadata document, served by the runtime at an HTTPS URL.

**What the learner does:**

1. Switch on **Require authorization** for the server, and watch the code gain bearer-token checks and a protected resource metadata route.
2. Write the client's metadata document in a structured editor: `client_id`, its own URL, `client_name` and `redirect_uris`. The runtime hosts it at that URL.
3. Press **Connect** and step through each hop. Each one is a real HTTP exchange shown in the wire view with its status and headers:
   1. The first `tools/list` returns `401` with `WWW-Authenticate` pointing to the resource metadata.
   2. The client fetches the protected resource metadata (RFC 9728) and finds `authorization_servers`.
   3. The client fetches the authorization server metadata (RFC 8414) and checks `client_id_metadata_document_supported`.
   4. The client sends the authorization request with `client_id` set to the document's URL, PKCE and `resource`.
   5. The authorization server fetches the metadata document. This is shown as its own lane. It validates that `client_id` matches the URL and that `redirect_uri` is listed.
   6. A consent screen shows the learner's `client_name`. The learner approves.
   7. The client exchanges the code for a token, checks `iss`, and retries `tools/list` with `Authorization: Bearer …`, which now succeeds.
4. Fail on purpose:
   - A redirect URI that isn't in the document gets `invalid_request`.
   - A `client_id` that doesn't match the document URL gets `invalid_client`.
   - A missing PKCE verifier is rejected.
   - A token for the wrong resource is rejected.
5. A short comparison explains why CIMD replaced Dynamic Client Registration in this revision: a portable client ID, no registration endpoint, and nothing to re-register when the authorization server changes.

**What it needs:**

- The runtime adds the `.well-known` routes, a `WWW-Authenticate` challenge, and a teaching authorization server (metadata, authorize with PKCE, token, audience binding). The SDK already ships helpers for most of these.
- **SSRF is avoided by design.** The teaching authorization server only fetches metadata documents hosted by the runtime itself.
- **Real HTTP.** The learning client must make real HTTP requests and record headers and status codes. This is the same wire-view work as above.
- **Redaction becomes field-aware.** Today's key-name regex (`apps/guide-runtime/src/mcp-runtime.ts:22-33`) would mask `token_endpoint` and `token_endpoint_auth_methods_supported`. Teaching tokens should be short-lived, scoped to the workspace, and clearly marked as safe to display.

## Platform changes that make all of this possible

1. **A guide manifest instead of hard-coded weather.** Each interactive guide declares its scenes, missions, behaviours, starting points, default names and copy. The state shape becomes a generic server model: identity, capabilities, extensions and auth settings.
2. **One source of truth for code and execution.** Define a small capability description that feeds both (a) the runtime's server registration and (b) the TypeScript generator, which also emits a source map. Parity tests compare the runtime's `tools/list` with what the generated server returns for the same description. That closes every divergence the runtime audit listed.
3. **A richer event model.** Each event records direction, HTTP envelope (method, URL, headers, status), stream frames and causal links, for example "this `tools/call` came from the approval in the host simulator".
4. **Streaming-capable runtime requests.** Don't close the handler until the response stream ends. This is needed for `list_changed`, progress notifications and Tasks.
5. **An open command union.** `call-tool`, `read-resource` and `get-prompt`, plus `get-task`, `cancel-task`, `respond-to-input` and `authorize`, each validated in `packages/contracts`.
6. **Per-guide limits.** Budget polling, streaming and authorization hops separately from the hourly request limit. Forward the browser's IP to the runtime, because today every learning-client request shares the web server's IP bucket.

## Fixes worth making now

These are independent of the redesign and fix things learners hit today.

| Priority | Fix                                                                                                                                                                                                                      | Where                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| P0       | Recompute progress from objectives on load, and persist anonymous progress in `localStorage`                                                                                                                             | `apps/web/components/use-guide-progress.ts:35-55`, `interactive-guide-context.tsx:461-488`    |
| P0       | Keep the anonymous workspace credential in `localStorage`, so the seven-day promise holds across tabs                                                                                                                    | `apps/web/components/interactive-guide-context.tsx:65-79, 312-326`                            |
| P0       | Label `isError` results as tool errors, and stop showing the global failure alert for them                                                                                                                               | `protocol-mode.tsx:12-33`, `interactive-guide-context.tsx:374-385`                            |
| P0       | Make the runtime's tool definitions match the generated code: field descriptions, tool `title`, result shapes and resource contents                                                                                      | `apps/guide-runtime/src/mcp-runtime.ts:35-49, 78`, `interactive-guides-codegen.ts`            |
| P1       | Move the provider to a guide-level layout so it doesn't remount and re-fetch on every step                                                                                                                               | `apps/web/components/guide-step-experience.tsx:58-71`                                         |
| P1       | In Code, scroll to and highlight the most recent change, and fold the Open-Meteo plumbing                                                                                                                                | `code-mode.tsx`, `code-views.tsx:62`, `interactive-guides-codegen.ts:105-144`                 |
| P1       | Show the current step's objective inside the workspace, and align objectives with the prose (step 3 needs two tools, or the prose asks for one)                                                                          | `interactive-guides.ts:877-925`                                                               |
| P1       | Show the request as well as the response in the Client inspector, and count discovery from the responses rather than local config                                                                                        | `client-mode.tsx:76-78, 187-198`                                                              |
| P1       | Generate the tool form from `inputSchema`, and give prompts their own form                                                                                                                                               | `client-mode.tsx:108, 134-165`                                                                |
| P2       | Don't PUT or wipe history when "Update server" doesn't change anything; make Reset actually reset the server                                                                                                             | `visual-mode.tsx:56-62`, `interactive-guide-context.tsx:563-577`                              |
| P2       | Copy fixes: the "Browser simulation" badge becomes "Live workspace", "1 tools" gets the right plural, and step 1 stops saying "Complete the activity above"                                                              | `guide-overview-experience.tsx:105-109`, `client-mode.tsx:76-78`, `guide-step-experience.tsx` |
| P2       | Accessibility:<br>• proper tab panels with arrow-key navigation<br>• no text smaller than 12px (some is 8px today)<br>• `aria-current` on the selected message<br>• less `aria-live` noise<br>• focusable scroll regions | `workspace-chrome.tsx:31-49`, `globals.css:6104, 6528, 6571`, `protocol-mode.tsx:273-286`     |
| P2       | Fix the code highlighter treating `//` inside `https://` as a comment                                                                                                                                                    | `code-views.tsx:54-56`                                                                        |
| P2       | Remove dead code: `legacyWeatherCapabilities` and the simulated reducer paths, which use outdated `_meta` keys                                                                                                           | `interactive-guides.ts:210-356, 545-752`                                                      |
| P2       | Forward the browser IP to the runtime for rate limiting, and bound anonymous workspace creation                                                                                                                          | `apps/web/lib/runtime-server.ts:68-91`, `apps/guide-runtime/src/limits.ts`                    |

## Suggested roadmap

| Phase | Scope                                                                                                                                  | Outcome                                                               |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 0     | The fixes above                                                                                                                        | The current guide stops losing progress and stops mis-teaching errors |
| 1     | Two-pane layout, missions, the living diagram, focused code with change highlighting, and a host simulator with schema-generated forms | The current curriculum, finally visual and connected                  |
| 2     | One source of truth, the richer event model, the wire view, authoring editors, the failure lab and the revised curriculum              | The first-server guide becomes the flagship                           |
| 3     | Guide manifest and scene modules, streaming runtime, `list_changed`, and the elicitation scene                                         | The platform can host new topics                                      |
| 4     | Tasks scene with a durable task worker                                                                                                 | Tasks taught with no local setup                                      |
| 5     | Authorization and CIMD scene with a teaching authorization server                                                                      | Authorization taught end to end in the browser                        |

## How to know it's working

- **Time to first successful tool call**, from landing on step 1.
- **Step-to-step drop-off.** The current design front-loads configuration and back-loads the payoff.
- **Explain-back checks** at the end of a step. For example: "Which field told the model what `location` means?", answered by selecting it in the inspector.
- **Learner-authored descriptions that pass the model-view lint** on the first or second try.
- **Export success:** the exported project starts and returns the same JSON the guide showed.

## Decisions needed

1. **A real model in the loop.** Should the host simulator offer an optional LLM-backed model, or stay deterministic with the learner as the model? An LLM is more realistic but costs money, and it adds nondeterminism and moderation concerns.
2. **Learner-authored text at the public endpoint.** Once descriptions are authored, the hosted endpoint serves learner text to external clients. Do we moderate it, restrict the endpoint to signed-in users, or serve only curated text externally?
3. **Accounts for advanced scenes.** Should Tasks and authorization require sign-in, given their extra runtime cost and durable state?
4. **Where the server runs.** Should it stay in the Guide Runtime, or move some scenes, such as the failure lab and schema validation, into a browser-only server (an in-page MCP server over a message channel) for instant feedback with no backend cost?
