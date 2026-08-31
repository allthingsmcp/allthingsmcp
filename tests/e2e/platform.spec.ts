import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/guides',
  '/blog',
  '/learn',
  '/build',
  '/operate',
  '/security',
  '/ecosystem',
  '/spec-watch',
  '/tools',
  '/glossary',
  '/search',
  '/contribute',
];

for (const route of routes) {
  test(`${route} has a working shell`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('.site-header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
  });
}

test('mobile navigation exposes the focused destinations', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const menu = page.getByRole('button', { name: 'Open navigation' });
  await menu.click();
  await expect(
    page.getByRole('button', { name: 'Close navigation' }),
  ).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.getByRole('navigation', { name: 'Mobile navigation' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'Mobile navigation' })
      .getByRole('link'),
  ).toHaveText(['Guides', 'Blog', 'Spec Watch', 'Newsletter', 'Search']);
});

test('desktop navigation reflects the focused content model', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile);
  await page.goto('/');
  await expect(
    page
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('link'),
  ).toHaveText(['Guides', 'Blog', 'Spec Watch']);
});

test('guides filter follows the URL fragment and browser history', async ({
  page,
}) => {
  await page.goto('/guides#build');
  const filters = page.getByRole('navigation', { name: 'Filter guides' });
  await expect(
    filters.getByRole('link', { name: 'Build', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(page.getByText('Build guides', { exact: true })).toBeVisible();

  await filters.getByRole('link', { name: 'Security', exact: true }).click();
  await expect(page).toHaveURL(/#security$/);
  await expect(
    page.getByText('Security guides', { exact: true }),
  ).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/#build$/);
  await expect(
    filters.getByRole('link', { name: 'Build', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
});

test('guides page presents one complete catalog', async ({ page }) => {
  await page.goto('/guides');
  await expect(page.getByRole('heading', { name: 'All guides' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Choose your path' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Learning paths' }),
  ).toHaveCount(0);
  await expect(page.getByText('MCP Fundamentals', { exact: true })).toHaveCount(
    0,
  );
});

test('guides use a structured overview and persistent step progress', async ({
  page,
}) => {
  await page.goto('/guides/build-a-minimal-mcp-server');
  await expect(
    page.getByRole('heading', { name: 'Build a Minimal MCP Server' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Work through the guide' }),
  ).toBeVisible();
  await expect(
    page.getByRole('progressbar', { name: 'Guide progress' }),
  ).toHaveAttribute('aria-valuenow', '0');
  await expect(page.getByText('In this article')).toHaveCount(0);

  await page
    .getByRole('link', { name: /Prepare your environment/ })
    .first()
    .click();
  await expect(page).toHaveURL(
    /\/guides\/build-a-minimal-mcp-server\/prepare-your-environment$/,
  );
  await expect(page.getByText('Step 1 of 4')).toBeVisible();
  await page.getByRole('button', { name: 'Mark step complete' }).click();
  await expect(
    page.getByRole('button', { name: 'Mark as incomplete' }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Guide overview' }).click();
  await expect(page.getByText('1 of 4 completed')).toBeVisible();
  await expect(
    page.getByRole('progressbar', { name: 'Guide progress' }),
  ).toHaveAttribute('aria-valuenow', '25');
});

test('MDX component examples retain syntax highlighting', async ({ page }) => {
  await page.goto(
    '/guides/create-an-all-things-mcp-guide/use-writing-components',
  );

  const mdxBlocks = page
    .locator('.code-block')
    .filter({ has: page.locator('code.language-mdx') });
  await expect(mdxBlocks).toHaveCount(4);

  const colors = await mdxBlocks
    .first()
    .locator('pre span')
    .evaluateAll((tokens) =>
      Array.from(new Set(tokens.map((token) => getComputedStyle(token).color))),
    );
  expect(colors.length).toBeGreaterThan(1);
});

test('footer prioritizes content, newsletter, and search', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  if (isMobile) {
    await footer
      .locator('details')
      .filter({ hasText: 'Explore' })
      .locator('summary')
      .click();
    await footer
      .locator('details')
      .filter({ hasText: 'Stay current' })
      .locator('summary')
      .click();
  }
  for (const label of [
    'Guides',
    'Blog',
    'Spec Watch',
    'Newsletter',
    'Search',
  ]) {
    await expect(
      footer.getByRole('link', { name: label, exact: true }),
    ).toBeVisible();
  }
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

test('homepage features guides, blog, and spec watch content', async ({
  page,
}) => {
  await page.goto('/');
  const main = page.getByRole('main');
  await expect(
    main.getByRole('heading', { name: 'Popular guides' }),
  ).toBeVisible();
  await expect(
    main.getByRole('heading', { name: 'Latest from the blog' }),
  ).toBeVisible();
  await expect(
    main.getByRole('heading', { name: 'Latest from Spec Watch' }),
  ).toBeVisible();
  await expect(
    main.getByRole('heading', { name: 'Featured tools' }),
  ).toHaveCount(0);
  await expect(main.getByText('Ecosystem snapshot')).toHaveCount(0);
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
