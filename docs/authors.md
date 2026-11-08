# Authors and contributors

Everyone who writes or substantially improves a page is credited by name in that page's `authors` list. A profile file is optional but gives you a byline with a photo and links, and a public page at `/authors/[slug]`.

## Add a profile

Create `apps/web/content/authors/<slug>.yaml`. The `slug` must match the file name.

```yaml
slug: ada-lovelace
name: Ada Lovelace # must exactly match the name used in `authors`
kind: person # `person` (default) gets a profile page; `organization` does not
role: MCP contributor
affiliation: Example Co. # optional; shown only if you set it
bio: Writes practical explanations of protocol architecture and developer tooling.
image: /authors/ada-lovelace.jpg # add the file under apps/web/public/authors/
github: https://github.com/your-handle # optional
linkedin: https://www.linkedin.com/in/your-handle/ # optional
x: https://x.com/your-handle # optional
website: https://example.com # optional
```

Then reference the name in a document's front matter:

```yaml
authors: [Ada Lovelace]
```

## Rules

- Profile data is yours: include only links and details you want public. Maintainers will not require an employer or social account.
- A name with no profile is still credited, and `pnpm content:validate` prints a warning rather than failing.
- Use the `all-things-mcp` organization profile for work with no individual author, such as maintainer edits and site-wide guidance.
- Maintainer-only changes (typo fixes, link updates) do not need to add the editor as an author.
- Profile images should be square and at least 256 px wide.

`pnpm content:validate` checks that each profile's `slug` matches its file name.
