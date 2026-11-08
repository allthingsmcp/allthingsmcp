---
name: cover-scenes
description: Design and build a responsive blog cover scene for an All Things MCP article — the HTML/CSS graphic on blog cards that lays itself out to any card shape instead of cropping an image. Use when a writer wants a custom cover for a post, asks for cover art or a card graphic, or sets `coverScene` in frontmatter.
---

# All Things MCP cover scenes

A cover scene is a small, reviewed React component that draws one article's
core idea on its blog card. The same cover renders in five shapes, from a 4:1
strip to a near-square thumbnail, so **never use a static image**: it will crop
badly somewhere. A scene reflows instead.

Also load the [brand system](../brand-system/SKILL.md) and the
[diagram language](../../../docs/diagrams.md). The cover is a diagram, so its
nodes, edges and labels follow the same rules. Read
[the tasks scene walkthrough](references/tasks-scene.md) before you write a new
scene. It is the reference implementation.

## How a writer uses one

1. In the article's frontmatter, set `coverScene: <id>`, for example
   `coverScene: tasks`. Only ids registered in
   `apps/web/lib/cover-scene-ids.ts` validate.
2. If no existing scene fits, build one with the workflow below in the same
   pull request. MDX cannot define components, so a scene always arrives as
   reviewed code, never as markup inside the article.
3. Posts without `coverScene` keep the generated topic tile. That is a fine
   default, not a gap.

## Workflow

1. **State the one idea.** Write one sentence the cover must show, such as "a
   tool call returns a task, and the client polls it to a result". If it needs
   two sentences, pick one.
2. **Choose an anchor.** This is the single element that carries the idea alone
   and is always visible, at every size. Examples are the task record with its
   progress bar, a consent dialog, or a capability list. Everything else is
   supporting flow.
3. **Lay the flow on the rail.** Supporting nodes, such as the MCP client or a
   result, sit on the dashed rail on either side of the anchor. Label every edge
   with the protocol message (`tools/call`, `result`) and a direction arrow.
4. **Design four tiers.** Each tier removes detail. Nothing gets cropped.

   | Tier    | Where it appears                                       | Show                                                |
   | ------- | ------------------------------------------------------ | --------------------------------------------------- |
   | Row     | Container 640px or wider (home and wide cards)         | Full flow in a row on a horizontal rail             |
   | Stack   | Narrower than 640px, not compact (featured, mobile)    | Same flow stacked on a vertical rail, `↓` arrows    |
   | Strip   | `.blog-cover--compact` (Latest posts)                  | Anchor only, reduced to one or two lines            |
   | Thumb   | Compact and 160px or narrower (editor's picks)         | The anchor's most recognizable shape, no text       |

5. **Add one moment of motion (optional).** On `a:hover` or `a:focus-visible`,
   the scene may play the idea to its end, such as the batch completing. Keep it
   under 600ms, use only the tokens, and disable transitions under
   `prefers-reduced-motion`. The scene must read fully without motion.
6. **Register and build it.** See the files below.
7. **Verify every placement.** Use the checklist at the end.

## Files

- `apps/web/lib/cover-scene-ids.ts`: add the id to `coverSceneIds`. Use a
  lowercase, hyphenated topic name.
- `apps/web/components/cover-scenes.tsx`: add a component and map it in
  `coverScenes`. It must have no props, no data fetching and no client state.
- `apps/web/app/globals.css`: add styles next to the existing `.tasks-scene`
  rules, namespaced `.<id>-scene` and `.<id>-scene__*`.

## Rules that are easy to get wrong

- **Root the scene in a `<figure>`, not a `<div>` or `<span>`.** The
  topic-tile rules target `.blog-cover > div` and `.blog-cover > span`, and
  their descendants would restyle your scene.
- **Use width container queries only.** `.blog-cover--scene` is an
  `inline-size` container. The CSS pipeline rewrites `aspect-ratio` container
  queries into a form the browser ignores, and `height` queries didn't fire
  reliably. Branch on `min-width`/`max-width` and on `.blog-cover--compact`.
- **Draw with real text and the tokens.** Use JetBrains Mono for protocol text.
  Use `--blue`, `--blue-on-dark` and `--green` for meaning, with the same
  semantic color assignments as diagrams. Keep the navy `--footer` surface.
  Don't use baked images, gradients beyond the existing glow, or faux 3D.
- **Show real protocol facts.** Method names, fields and statuses must match the
  specification version the article records. Example values, such as the 6 of
  18 thumbnails, must come from the article itself.
- **Keep the scene decorative.** `BlogCover` sets `aria-hidden`, and the card
  title and description carry the meaning. Never put information in the scene
  that the card text omits.
- **Never let the scene grow the card unreasonably.** The stack tier may push a
  190px cover to about 260px. Anything taller means the stack has too many
  nodes, so drop the least important one.

## Verification checklist

Run `pnpm --filter @all-things-mcp/web content:validate`, then `tsc`, ESLint and
Prettier. Then open the dev server and check each placement at 1280px and
375px:

- [ ] `/blog` featured card (stack tier on desktop and mobile)
- [ ] `/blog` editor's picks thumbnail (thumb tier)
- [ ] `/blog` Latest posts card (strip tier)
- [ ] `/` "From the blog" card (row tier when 640px or wider, stack otherwise)
- [ ] Hover and keyboard focus each card, and again with reduced motion

After changing the schema or frontmatter, touch `apps/web/source.config.ts` if
the running dev server still shows the old cover.
