import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('global search opens in context and returns canonical results', async ({
  page,
}) => {
  await page.goto('/blog');
  await page.getByRole('button', { name: 'Search All Things MCP' }).click();

  const dialog = page.getByRole('dialog', { name: 'Search All Things MCP' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('searchbox').fill('minimal MCP server');

  const result = dialog.getByRole('link', {
    name: /Build a Minimal MCP Server/,
  });
  await expect(result).toHaveAttribute(
    'href',
    '/guides/build-a-minimal-mcp-server',
  );
  await result.click();
  await expect(page).toHaveURL(/\/guides\/build-a-minimal-mcp-server$/);
  await expect(dialog).not.toBeVisible();
});

test('command shortcut and legacy search URL open the search overlay', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Desktop keyboard shortcut is not exposed on mobile.');
  await page.goto('/');
  await page.keyboard.press('ControlOrMeta+KeyK');
  await expect(
    page.getByRole('dialog', { name: 'Search All Things MCP' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');

  await page.goto('/search');
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('dialog', { name: 'Search All Things MCP' }),
  ).toBeVisible();
});

test('search overlay has no serious accessibility violations', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Search All Things MCP' }).click();

  const results = await new AxeBuilder({ page })
    .include('.search-dialog')
    .disableRules(['color-contrast'])
    .analyze();
  expect(
    results.violations.filter((violation) =>
      ['critical', 'serious'].includes(violation.impact ?? ''),
    ),
  ).toEqual([]);
});

test('blog is an editorial surface with topic filtering', async ({ page }) => {
  await page.goto('/blog');
  await expect(
    page.getByRole('heading', { name: 'Blog', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: "Editor's picks" }),
  ).toBeVisible();

  const filters = page.getByLabel('Filter blog posts');
  await filters.getByRole('button', { name: 'Security' }).click();
  await expect(page.locator('.blog-feature')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Security posts', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /MCP Authorization Explained/ }).first(),
  ).toHaveAttribute('href', '/blog/mcp-authorization-explained');
});

test('blog posts use canonical editorial routes', async ({ page }) => {
  await page.goto('/blog/what-is-mcp');
  await expect(
    page.getByRole('heading', {
      name: 'What Is MCP? A Practical Introduction',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Back to the blog' }),
  ).toHaveAttribute('href', '/blog');
});

test('blog posts show authors and track the active section', async ({
  page,
  isMobile,
}) => {
  await page.goto('/blog/what-is-mcp');

  const authors = page.locator('.article-authors');
  await expect(authors).toContainText('All Things MCP Editors');
  await expect(authors.locator('img')).toBeVisible();

  const toc = page.locator('.article-toc');
  if (isMobile) {
    await toc.getByRole('button', { name: 'Toggle article sections' }).click();
  }

  const finalSection = page.getByRole('heading', { name: 'Where to go next' });
  await finalSection.evaluate((element) =>
    element.scrollIntoView({ block: 'start' }),
  );
  await expect(
    toc.getByRole('link', { name: 'Where to go next' }),
  ).toHaveAttribute('aria-current', 'location');
  await expect
    .poll(async () => toc.locator('small').textContent())
    .not.toBe('0% read');
});

test('homepage features guides and blog without unpublished sections', async ({
  page,
}) => {
  await page.goto('/');
  const main = page.getByRole('main');
  await expect(
    main.getByRole('heading', { name: 'Guides', exact: true }),
  ).toBeVisible();
  await expect(
    main.getByRole('heading', { name: 'From the blog' }),
  ).toBeVisible();
  await expect(main.getByText('Spec Watch', { exact: true })).toHaveCount(0);
  await expect(
    main.getByRole('heading', { name: 'Featured tools' }),
  ).toHaveCount(0);
  await expect(main.getByText('Ecosystem snapshot')).toHaveCount(0);
});

test('spec watch is unavailable until the section is ready', async ({
  page,
}) => {
  const route = await page.goto('/spec-watch');
  expect(route?.status()).toBe(404);

  const entry = await page.goto('/library/spec-watch/current-protocol');
  expect(entry?.status()).toBe(404);
});

test('privacy page is not published', async ({ request }) => {
  const response = await request.get('/privacy');
  expect(response.status()).toBe(404);
});

test('production hides unreleased directory and library routes', async ({
  request,
}) => {
  test.skip(
    !process.env.PLAYWRIGHT_BASE_URL,
    'These routes remain visible in local authoring environments.',
  );
  for (const route of ['/tools', '/ecosystem', '/library']) {
    expect((await request.get(route)).status()).toBe(404);
  }
});

test('robots and sitemap expose only launch-ready discovery routes', async ({
  request,
}) => {
  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBe(true);
  const robotsText = await robots.text();
  expect(robotsText).toContain('User-Agent: *');
  expect(robotsText).toContain('Disallow: /api/');
  expect(robotsText).toContain('Allow: /api/social-card/v2');
  expect(robotsText).toContain('Sitemap:');

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBe(true);
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain('/guides/build-a-minimal-mcp-server');
  expect(sitemapText).not.toContain('/privacy');
  expect(sitemapText).not.toContain('/spec-watch');
  expect(sitemapText).not.toContain('/tools');
  expect(sitemapText).not.toContain('/ecosystem');
});

test('guide steps expose specific search metadata and structured data', async ({
  page,
}) => {
  await page.goto('/guides/build-a-minimal-mcp-server/add-a-tool');
  await expect(page).toHaveTitle(
    'Add a Typed Tool | Build a Minimal MCP Server · All Things MCP',
  );
  const structuredData = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  const nodes = structuredData.flatMap((value) => JSON.parse(value)['@graph']);
  expect(nodes).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ '@type': 'Organization' }),
      expect.objectContaining({ '@type': 'WebSite' }),
      expect.objectContaining({
        '@type': 'BreadcrumbList',
        itemListElement: expect.arrayContaining([
          expect.objectContaining({ name: 'Build a Minimal MCP Server' }),
        ]),
      }),
      expect.objectContaining({
        '@type': 'Article',
        headline: 'Add a Typed Tool',
        datePublished: '2026-08-31',
      }),
    ]),
  );
});

test('guide authors link to a visible profile', async ({ page }) => {
  await page.goto('/guides/build-a-minimal-mcp-server');
  await page.getByRole('link', { name: 'Gbadebo Bello', exact: true }).click();
  await expect(page).toHaveURL(/\/authors\/gbadebo-bello$/);
  await expect(
    page.getByRole('heading', { name: 'Gbadebo Bello' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Build a Minimal MCP Server' }),
  ).toBeVisible();
});

test('content pages can be copied and viewed as Markdown', async ({
  page,
  request,
}) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const path = '/guides/build-a-minimal-mcp-server/add-a-tool';
  await page.goto(path);

  const copyPage = page.getByRole('button', { name: 'Copy page' });
  const toggle = page.getByRole('button', { name: 'More page options' });
  const shareMenu = page.locator('.content-share-menu');
  await expect(
    page.locator('.guide-step-article__byline').getByRole('button', {
      name: 'Copy page',
    }),
  ).toBeVisible();
  await expect(
    page.locator('.guide-step-actions').getByRole('link', {
      name: /Edit this page on GitHub/,
    }),
  ).toBeVisible();
  await expect(
    page.locator('.guide-step-actions').getByRole('link', {
      name: /Report outdated content/,
    }),
  ).toBeVisible();
  await expect(copyPage).toHaveCSS('border-top-width', '0px');
  await copyPage.click();
  await expect(shareMenu.getByRole('status')).toContainText(
    'Page text copied.',
  );
  const plainText = await page.evaluate(() => navigator.clipboard.readText());
  expect(plainText).toContain('Add a Typed Tool');
  expect(plainText).not.toContain('# Add a Typed Tool');

  await toggle.click();
  const options = page.getByRole('group', { name: 'More page options' });
  await expect(
    options.getByRole('button', { name: /Copy link/ }),
  ).toBeVisible();
  await expect(
    options.getByRole('button', { name: /Copy as Markdown/ }),
  ).toBeVisible();
  await expect(
    options.getByRole('link', { name: /View as Markdown/ }),
  ).toHaveAttribute('href', `/markdown${path}`);
  await expect(
    options.getByRole('link', { name: /Open in ChatGPT/ }),
  ).toHaveAttribute('href', 'https://chatgpt.com/');
  await expect(
    options.getByRole('link', { name: /Open in Claude/ }),
  ).toHaveAttribute('href', 'https://claude.ai/new');

  await options.getByRole('button', { name: /Copy link/ }).click();
  await expect(shareMenu.getByRole('status')).toContainText(
    'Page link copied.',
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    new URL(path, page.url()).toString(),
  );

  await toggle.click();
  await options.getByRole('button', { name: /Copy as Markdown/ }).click();
  await expect(shareMenu.getByRole('status')).toContainText(
    'Page Markdown copied.',
  );
  const clipboardMarkdown = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  expect(clipboardMarkdown).toContain('# Add a Typed Tool');
  expect(clipboardMarkdown).toContain('MCP specification: 2025-11-25');
  expect(clipboardMarkdown).toContain('```python');

  const markdownResponse = await request.get(`/markdown${path}`);
  expect(markdownResponse.ok()).toBe(true);
  expect(markdownResponse.headers()['content-type']).toContain('text/markdown');
  expect(markdownResponse.headers()['x-robots-tag']).toBe('noindex, follow');
  expect(await markdownResponse.text()).toBe(clipboardMarkdown);

  const overviewResponse = await request.get(
    '/markdown/guides/build-a-minimal-mcp-server',
  );
  const overviewMarkdown = await overviewResponse.text();
  expect(overviewMarkdown).toContain('## Steps');
  expect(overviewMarkdown).toContain('## Prerequisites');

  await page.goto('/guides/build-a-minimal-mcp-server');
  await expect(page.getByRole('button', { name: 'Copy page' })).toHaveCount(0);

  const interactiveResponse = await request.get(
    '/markdown/guides/building-your-first-mcp-server/create-your-server',
  );
  const interactiveMarkdown = await interactiveResponse.text();
  expect(interactiveMarkdown).toContain(
    'Interactive activity: complete this exercise',
  );
  expect(interactiveMarkdown).not.toContain('InteractiveGuideBlock');
  expect(interactiveMarkdown).not.toContain('<Callout');
  const componentResponse = await request.get(
    '/markdown/guides/building-your-first-mcp-server/what-is-mcp',
  );
  const componentMarkdown = await componentResponse.text();
  expect(componentMarkdown).toContain('**Tools** — Callable operations');
  expect(componentMarkdown).toContain('Protocol diagram: A host contains');
  expect(componentMarkdown).not.toContain('<CardGrid');
  const blogMarkdown = await request.get('/markdown/blog/what-is-mcp');
  expect(blogMarkdown.ok()).toBe(true);
  expect(blogMarkdown.headers()['x-robots-tag']).toBe('noindex, follow');
  expect(await blogMarkdown.text()).toContain(
    '# What Is MCP? A Practical Introduction',
  );
  await page.goto('/blog/what-is-mcp');
  const articleShare = page
    .locator('.page-actions')
    .getByRole('button', { name: 'Copy page' });
  await expect(articleShare).toBeVisible();
  await expect(articleShare).toHaveCSS('border-top-width', '0px');
  await page.getByRole('button', { name: 'More page options' }).click();
  await expect(
    page.getByRole('link', { name: /View as Markdown/ }),
  ).toHaveAttribute('href', '/markdown/blog/what-is-mcp');

  await page.goto('/guides/building-your-first-mcp-server/add-tools');
  await page.getByRole('button', { name: 'More page options' }).click();
  const bounds = await page
    .getByRole('group', { name: 'More page options' })
    .evaluate((panel) => {
      const box = panel.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        viewport: window.innerWidth,
        pageWidth: document.documentElement.scrollWidth,
      };
    });
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewport);
  expect(bounds.pageWidth).toBeLessThanOrEqual(bounds.viewport);
});

test('homepage has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .disableRules(['color-contrast'])
    .analyze();
  expect(
    results.violations.filter((violation) =>
      ['critical', 'serious'].includes(violation.impact ?? ''),
    ),
  ).toEqual([]);
});

test('planned tools expose no open-tool action', async ({ page }) => {
  await page.goto('/tools');
  await expect(page.getByText('Planned').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /open tool/i })).toHaveCount(0);
});
