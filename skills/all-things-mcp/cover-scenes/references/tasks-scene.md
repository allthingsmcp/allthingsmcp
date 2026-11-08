# Reference scene: `tasks`

Used by `apps/web/content/blog/how-mcp-tasks-work.mdx`. The source of truth is
`TasksScene` in `apps/web/components/cover-scenes.tsx` and the `.tasks-scene`
rules in `apps/web/app/globals.css`. Read those files. This page explains the
decisions so you can repeat them, not copy them.

## The idea and the anchor

- **One idea:** a `tools/call` returns a task, which reports progress until the
  result arrives.
- **Anchor:** the task record. It shows `resultType: "task"`, `status: working`,
  an 18-cell progress bar with 6 filled, and "Created 6 of 18 thumbnails". The
  numbers come from the article's running example.
- **Flow:** MCP client (blue node), then `tools/call`, then the record, then
  `result`, then completed (a muted node that turns green).

## How each tier was derived

| Tier  | Decision                                                                                                               |
| ----- | ---------------------------------------------------------------------------------------------------------------------- |
| Row   | Nodes and edge labels sit on a horizontal dashed rail. Labels have a navy background so the rail appears to pass behind them. Arrows are `→`. |
| Stack | This is the default (mobile-first). Same elements in a column, a vertical rail, smaller node padding, and `↓` arrows.   |
| Strip | Nodes, edges, the `resultType` line and the message are hidden. Only status and the bar remain.                       |
| Thumb | Status is hidden too. The bar becomes a 6×3 grid, so "one row filled" still reads as 6 of 18.                         |

The progress bar is a CSS grid of 18 equal columns. It fits any width without
per-size math, which is why it works as the anchor.

## Motion

Each empty cell carries `--i` (its index after the done cells). On card hover or
focus, cells fill with `transition-delay: calc(var(--i) * 25ms)`, so the 12
empty cells take about 450ms. The status and count swap to `completed` and 18,
and the completed node turns green after a 300ms delay. Under
`prefers-reduced-motion`, the same end state appears without transitions.

## Starting skeleton for a new scene

```tsx
// apps/web/components/cover-scenes.tsx
function ExampleScene() {
  return (
    <figure className="example-scene">
      <span className="example-scene__rail" />
      <span className="example-scene__node">MCP client</span>
      <span className="example-scene__edge">method/name</span>
      <div className="example-scene__anchor">{/* the one idea */}</div>
      <span className="example-scene__edge">result</span>
      <span className="example-scene__node">Outcome</span>
    </figure>
  );
}
// then: coverScenes = { tasks: TasksScene, example: ExampleScene }
// and add 'example' to coverSceneIds in lib/cover-scene-ids.ts
```

```css
/* Stack tier is the default */
.example-scene {
  /* flex column, centered, gap 4px */
}
.example-scene__rail {
  /* vertical dashed line */
}

@container (min-width: 640px) {
  /* Row tier: flex row, horizontal rail, → arrows */
}

.blog-cover--compact .example-scene__node,
.blog-cover--compact .example-scene__edge {
  display: none; /* Strip tier */
}

@container (max-width: 160px) {
  /* Thumb tier: the anchor's shape only */
}

@media (prefers-reduced-motion: reduce) {
  /* remove transitions */
}
```

Copy the concrete values (rail color, node radius, card surface `#1e293b`,
border `#475569`) from the `.tasks-scene` rules so every scene matches.
