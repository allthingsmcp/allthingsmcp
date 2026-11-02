import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { runClientCommand, seedRuntimeWorkspace } from './runtime-helpers';

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
  await expect(
    page.getByRole('button', { name: 'Mark as incomplete' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Mark as incomplete' }).click();
  await expect(
    page.getByRole('button', { name: 'Mark step complete' }),
  ).toBeVisible();

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
