import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { runClientCommand, seedRuntimeWorkspace } from './runtime-helpers';

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
  ).toHaveText(['Guides', 'Blog', 'Spec Watch', 'Newsletter']);
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
  ).toHaveText(['Guides', 'Blog', 'Spec Watch']);
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

  await page.goto('/guides/build-a-minimal-mcp-server');
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
  await expect(
    page.getByRole('button', { name: 'Sign in to save progress' }),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByText('0 of 4 completed')).toBeVisible();
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
  await expect(
    authDialog.getByRole('checkbox', { name: /Keep me ahead of MCP/ }),
  ).toBeChecked();
  await expect(authDialog).not.toContainText('GitHub provides identity');
  await expect(authDialog).not.toContainText('Reading and simulation work');
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
  for (const label of ['Guides', 'Blog', 'Spec Watch', 'Newsletter']) {
    await expect(
      footer.getByRole('link', { name: label, exact: true }),
    ).toBeVisible();
  }
  await expect(
    footer.getByRole('button', { name: 'Search', exact: true }),
  ).toBeVisible();
});

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

test('interactive Guide overview is distinct and leaves the original Guide intact', async ({
  page,
}) => {
  await page.goto('/guides/building-your-first-mcp-server');
  await expect(
    page.getByRole('heading', { name: 'Building Your First MCP Server' }),
  ).toBeVisible();
  await expect(page.getByText('Interactive', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'A configurable weather MCP server' }),
  ).toBeVisible();
  await expect(
    page.getByRole('progressbar', { name: 'Guide progress' }),
  ).toHaveAttribute('aria-valuenow', '0');

  await page.goto('/guides/build-a-minimal-mcp-server');
  await expect(
    page.getByRole('heading', { name: 'Build a Minimal MCP Server' }),
  ).toBeVisible();
  await expect(page.getByText('Interactive', { exact: true })).toHaveCount(0);
});

test('real Weather Guide completes through the BFF and MCP runtime and survives reload', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const apiFailures: string[] = [];
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => {
    if (
      response.url().includes('/api/') &&
      (response.status() >= 500 ||
        (response.request().method() !== 'GET' && response.status() >= 400))
    ) {
      apiFailures.push(
        `${response.request().method()} ${response.url()}: ${response.status()}`,
      );
    }
  });
  await page.goto('/guides/building-your-first-mcp-server/what-is-mcp');
  await page.getByRole('button', { name: 'Mark step complete' }).click();
  await page
    .getByRole('link', { name: /Create your server/ })
    .last()
    .click();
  const serverName = page.getByLabel('Server name');
  await serverName.fill('lagos-weather-server');
  await page.getByRole('button', { name: 'Create server' }).click();
  await expect(page.getByText('Runtime workspace ready')).toBeVisible();

  await page.getByRole('tab', { name: 'Code' }).click();
  await expect(page.locator('.interactive-code-panel')).toContainText(
    'lagos-weather-server',
  );
  await expect(page.getByRole('button', { name: 'Copy code' })).toBeVisible();
  await expect(
    page.getByRole('complementary', {
      name: 'Generated code explanation',
    }),
  ).toContainText('Code stays in sync');

  await page
    .getByRole('link', { name: /Add tools/ })
    .first()
    .click();
  await page.getByRole('button', { name: /Get current weather/ }).click();
  await expect(page.getByText('Input schema', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add to server' }).click();
  await expect(
    page
      .locator('.interactive-server-summary')
      .getByText('get_weather', { exact: true }),
  ).toBeVisible();

  await page
    .getByRole('link', { name: /Add resources/ })
    .first()
    .click();
  await page.getByRole('button', { name: /Supported cities/ }).click();
  await expect(page.getByText('Resource URI', { exact: true })).toBeVisible();
  await expect(
    page.locator('.interactive-schema-preview .token-json-key').first(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Add to server' }).click();
  await expect(
    page
      .locator('.interactive-server-summary')
      .getByText('supported_cities', { exact: true }),
  ).toBeVisible();

  await page
    .getByRole('link', { name: /Add prompts/ })
    .first()
    .click();
  await page.getByRole('button', { name: /Plan for weather/ }).click();
  await expect(
    page.getByText('Prompt template', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Add to server' }).click();
  await expect(
    page
      .locator('.interactive-server-summary')
      .getByText('plan_for_weather', { exact: true }),
  ).toBeVisible();

  await page
    .getByRole('link', { name: /Connect the ATM client/ })
    .first()
    .click();
  const discovery = await runClientCommand(
    page,
    'Connect ATM client',
    'server/discover',
  );
  expect(discovery.map((event) => event.method)).toEqual([
    'server/discover',
    'tools/list',
    'resources/list',
    'prompts/list',
  ]);
  await expect(page.getByText('Discovery complete')).toBeVisible();
  await page.getByRole('tab', { name: 'Protocol' }).click();
  await expect(
    page.getByRole('button', { name: /server\/discover/ }).first(),
  ).toBeVisible();
  await expect(page.locator('.interactive-protocol-layout')).toContainText(
    '2026-07-28',
  );
  const protocolExplanation = page.getByRole('complementary', {
    name: 'Protocol exchange explanation',
  });
  await page
    .getByRole('button', { name: /server\/discover/ })
    .first()
    .click();
  await expect(protocolExplanation).toContainText('About this exchange');
  await expect(protocolExplanation).toContainText('server/discover');
  await page
    .getByRole('button', { name: /tools\/list/ })
    .first()
    .click();
  await expect(protocolExplanation).toContainText(
    'The client asks which callable tools',
  );

  await page
    .getByRole('link', { name: /Test your server/ })
    .first()
    .click();
  await runClientCommand(page, 'Call get_weather', 'tools/call');
  await expect(page.getByText('lagos-weather-server response')).toBeVisible();
  await expect(page.locator('.interactive-client-result')).toContainText(
    'temperature_2m',
  );
  await expect(page.locator('.interactive-client-result')).toContainText(
    'Open-Meteo',
  );
  await runClientCommand(page, 'Read weather://cities', 'resources/read');
  await expect(page.locator('.interactive-client-result')).toContainText(
    'Lagos',
  );
  await runClientCommand(page, 'Get plan_for_weather', 'prompts/get');
  await expect(page.locator('.interactive-client-result')).toContainText(
    'London',
  );

  await page.getByRole('tab', { name: 'Protocol' }).click();
  for (const method of ['tools/call', 'resources/read', 'prompts/get']) {
    await expect(
      page.getByRole('button', { name: new RegExp(method) }).first(),
    ).toBeVisible();
  }

  await page
    .getByRole('link', { name: /Review and export/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Finish guide' }).click();
  await expect(
    page.getByRole('button', { name: 'Guide complete' }),
  ).toBeVisible();
  await page.locator('.interactive-guide-block').screenshot({
    path: testInfo.outputPath('real-guide-complete.png'),
    animations: 'disabled',
  });

  await page.reload();
  await expect(page.locator('.interactive-server-summary')).toContainText(
    'lagos-weather-server',
  );
  await expect(
    page.getByRole('button', { name: /Finish guide|Guide complete/ }),
  ).toBeEnabled();
  await page.getByRole('tab', { name: 'Protocol' }).click();
  for (const method of [
    'server/discover',
    'tools/list',
    'resources/list',
    'prompts/list',
    'tools/call',
    'resources/read',
    'prompts/get',
  ]) {
    await expect(
      page.getByRole('button', { name: new RegExp(method) }).first(),
    ).toBeVisible();
  }
  await expect(
    page.getByRole('button', { name: 'Sign in to save progress' }).first(),
  ).toBeVisible();
  expect(apiFailures).toEqual([]);
  expect(pageErrors).toEqual([]);
  await page.locator('.interactive-guide-block').screenshot({
    path: testInfo.outputPath('real-protocol-reloaded.png'),
    animations: 'disabled',
  });
});

test('interactive Guide renders before browser persistence has restored', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function (...args) {
      const startedAt = performance.now();
      while (performance.now() - startedAt < 250) {
        // Deliberately delay persistence restoration to exercise first render.
      }
      return originalGetItem.apply(this, args);
    };
  });

  await page.goto('/guides/building-your-first-mcp-server/create-your-server');
  await expect(page.getByLabel('Server name')).toBeVisible();
  await expect(page.getByText('Loading your Guide workspace…')).toHaveCount(0);
});

test('interactive Guide reset clears only its automatic objectives', async ({
  page,
}) => {
  await seedRuntimeWorkspace(page);
  await page.goto('/guides/building-your-first-mcp-server/review-and-export');
  await expect(page.locator('.interactive-server-summary')).toContainText(
    'get_weather',
  );
  await page.getByRole('button', { name: 'Reset guide' }).click();
  await expect(page.locator('.interactive-server-summary')).toContainText(
    'No tools added yet.',
  );
  await expect(page.locator('.interactive-server-summary')).not.toContainText(
    'get_weather',
  );
  await expect(
    page.getByRole('button', { name: 'Finish guide' }),
  ).toBeDisabled();
  await page.reload();
  await expect(page.locator('.interactive-server-summary')).toContainText(
    'No tools added yet.',
  );
  await expect(
    page.getByRole('button', { name: 'Finish guide' }),
  ).toBeDisabled();
});

test('interactive Guide scenes have no serious accessibility violations', async ({
  page,
}) => {
  for (const step of [
    'create-your-server',
    'add-tools',
    'add-resources',
    'add-prompts',
    'connect-the-atm-client',
    'test-your-server',
    'review-and-export',
  ]) {
    await page.goto(`/guides/building-your-first-mcp-server/${step}`);
    const results = await new AxeBuilder({ page })
      .include('.interactive-guide-block')
      .analyze();
    expect(
      results.violations.filter((violation) =>
        ['critical', 'serious'].includes(violation.impact ?? ''),
      ),
      `Accessibility violations in ${step}`,
    ).toEqual([]);
  }
});

test('interactive capability selection reveals inline details without a modal', async ({
  page,
}) => {
  await page.goto('/guides/building-your-first-mcp-server/create-your-server');
  await page.getByRole('button', { name: 'Create server' }).click();
  await expect(page.getByText('Runtime workspace ready')).toBeVisible();
  await page.goto('/guides/building-your-first-mcp-server/add-tools');
  await page.getByRole('button', { name: /Get current weather/ }).click();
  await expect(
    page.getByRole('dialog', { name: 'Get current weather' }),
  ).toHaveCount(0);
  await expect(page.getByText('Input schema', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Add Tools' })).toBeVisible();
});
