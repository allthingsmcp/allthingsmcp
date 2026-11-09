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
  '/tools',
  '/glossary',
  '/contribute',
];

for (const route of routes) {
  test(`${route} has a working shell`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('.site-header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
  });
}

test('mobile navigation exposes the focused destinations', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile);
  await page.goto('/');
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
  ).toHaveText(['Guides', 'Blog', 'Newsletter']);
  await expect(
    page
      .getByRole('navigation', { name: 'Mobile navigation' })
      .getByRole('button', { name: 'Search' }),
  ).toBeVisible();
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
  ).toHaveText(['Guides', 'Blog']);
  await expect(
    page
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('link', { name: 'Guides', exact: true }),
  ).toHaveAttribute('href', '/#guides');
  await expect(
    page
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('link', { name: 'Blog', exact: true }),
  ).toHaveAttribute('href', '/#blog');
});

test('account controls hydrate without changing their initial text', async ({
  page,
}) => {
  const hydrationErrors: string[] = [];
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      message.text().includes('Hydration failed')
    ) {
      hydrationErrors.push(message.text());
    }
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sign in' })).toHaveCount(0);

  await page.goto('/guides/build-mcp-tasks-with-sharp');
  await expect(
    page.getByRole('button', { name: 'Sign in to save progress' }),
  ).toBeVisible();
  expect(hydrationErrors).toEqual([]);
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

test('guides use a structured overview and temporary anonymous progress', async ({
  page,
}) => {
  await page.goto('/guides/build-mcp-tasks-with-sharp');
  await expect(
    page.getByRole('heading', { name: 'Build Your First MCP Task' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Work through the guide' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'What you will build' }),
  ).toBeVisible();
  await expect(
    page.getByRole('progressbar', { name: 'Guide progress' }),
  ).toHaveAttribute('aria-valuenow', '0');
  await expect(page.getByText('In this article')).toHaveCount(0);

  await page
    .getByRole('link', { name: /Understand how MCP Tasks work/ })
    .first()
    .click();
  await expect(page).toHaveURL(
    /\/guides\/build-mcp-tasks-with-sharp\/understand-mcp-tasks$/,
  );
  await expect(page.getByText('Step 1 of 6')).toBeVisible();
  const reportHref = await page
    .getByRole('link', { name: 'Report outdated content' })
    .getAttribute('href');
  const reportUrl = new URL(reportHref!);
  expect(reportUrl.searchParams.get('page')).toMatch(
    /\/guides\/build-mcp-tasks-with-sharp\/understand-mcp-tasks$/,
  );
  expect(reportUrl.searchParams.get('issue')).toBe(
    'This content is outdated because...',
  );
  const progressAccountControl = page
    .locator('.guide-step-completion')
    .getByRole('button', { name: 'Sign in to save progress' });
  await expect(progressAccountControl).toHaveCSS(
    'background-color',
    'rgba(0, 0, 0, 0)',
  );
  await progressAccountControl.hover();
  await expect(progressAccountControl).toHaveCSS('color', 'rgb(37, 99, 235)');
  await page.getByRole('button', { name: 'Mark step complete' }).click();
  await expect(
    page.getByRole('button', { name: 'Mark as incomplete' }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Guide overview' }).click();
  await expect(page.getByText('1 of 6 completed')).toBeVisible();
  await expect(
    page.getByRole('progressbar', { name: 'Guide progress' }),
  ).toHaveAttribute('aria-valuenow', '17');
  await expect(
    page.getByRole('button', { name: 'Sign in to save progress' }),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByText('0 of 6 completed')).toBeVisible();
  await expect(
    page.getByRole('progressbar', { name: 'Guide progress' }),
  ).toHaveAttribute('aria-valuenow', '0');

  await page.getByRole('button', { name: 'Sign in to save progress' }).click();
  const authDialog = page.getByRole('dialog', {
    name: 'Save your progress',
  });
  await expect(authDialog).toContainText(
    'Sign in or create an account to keep completed steps across reloads and devices.',
  );
  await expect(authDialog.getByRole('checkbox')).toHaveCount(0);
  await expect(authDialog).not.toContainText('GitHub provides identity');
  await expect(authDialog).not.toContainText('Reading and simulation work');
});

test('interactive Guide steps retain a manual completion action', async ({
  page,
}) => {
  await page.goto('/guides/building-your-first-mcp-server/add-tools');
  await expect(
    page.getByRole('button', { name: 'Mark step complete' }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Complete the activity above, or mark the step complete yourself.',
    ),
  ).toBeVisible();
});

test('newsletter uses the official Substack signup embed', async ({ page }) => {
  await page.goto('/');
  const newsletter = page.locator('#newsletter');
  const embed = newsletter.getByTitle('Subscribe to All Things MCP');

  await expect(embed).toHaveAttribute(
    'src',
    'https://allthingsmcp.substack.com/embed',
  );
  await expect(embed).toHaveAttribute('height', '320');
  await expect(embed).toBeVisible();
  await expect
    .poll(() =>
      embed.evaluate(
        (element) =>
          element.getBoundingClientRect().right <=
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
});

test('production uses privacy-focused analytics without a consent prompt', async ({
  page,
}) => {
  test.skip(
    !process.env.PLAYWRIGHT_BASE_URL,
    'Deployment analytics are production-only.',
  );
  await page.goto('/');

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.locator('script[src*="googletagmanager.com/gtag"]'),
  ).toHaveCount(0);
  await expect(
    page.locator('script[data-sdkn^="@vercel/analytics"]'),
  ).toHaveCount(1);
  await expect(page.getByTitle('Subscribe to All Things MCP')).toBeVisible();
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
    await footer
      .locator('details')
      .filter({ hasText: 'Project' })
      .locator('summary')
      .click();
  }
  for (const label of ['Guides', 'Blog', 'Newsletter']) {
    await expect(
      footer.getByRole('link', { name: label, exact: true }),
    ).toBeVisible();
  }
  await expect(
    footer.getByRole('link', { name: 'Guides', exact: true }),
  ).toHaveAttribute('href', '/guides');
  await expect(
    footer.getByRole('link', { name: 'Blog', exact: true }),
  ).toHaveAttribute('href', '/blog');
  await expect(
    footer.getByRole('button', { name: 'Search', exact: true }),
  ).toBeVisible();
});
