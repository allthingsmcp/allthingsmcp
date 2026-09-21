import { expect, test, type Page } from '@playwright/test';
import { runClientCommand, seedRuntimeWorkspace } from './runtime-helpers';

async function captureBlock(
  page: Page,
  step: string,
  name: string,
  tab?: string,
) {
  await page.goto(`/guides/building-your-first-mcp-server/${step}`);
  await expect(page.locator('.interactive-save-status')).toContainText(
    'Workspace persisted',
  );
  if (tab) await page.getByRole('tab', { name: tab }).click();
  if (tab === 'Protocol') {
    await page
      .getByRole('button', { name: /server\/discover/ })
      .first()
      .click();
  }
  if (step === 'test-your-server') {
    await runClientCommand(page, 'Call get_weather', 'tools/call');
  }
  if (step === 'review-and-export') {
    await page
      .getByRole('button', { name: 'Finish guide', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Guide complete' }),
    ).toBeVisible();
  }
  await expect(
    page.getByRole('button', { name: 'Sign in to save progress' }).first(),
  ).toBeVisible();
  await page.mouse.move(0, 0);
  // Exclude only runtime-dependent timing text and overlays outside the
  // component. Message labels, statuses, and MCP payloads remain unmodified.
  await page.addStyleTag({
    content:
      '.site-header, nextjs-portal { display: none !important; } .interactive-protocol-layout nav small { visibility: hidden !important; }',
  });
  await expect(page.locator('.interactive-guide-block')).toHaveScreenshot(
    name,
    {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    },
  );
}

test.beforeEach(async ({ page }) => {
  await seedRuntimeWorkspace(page);
});

test('interactive Guide overview visual baseline', async ({ page }) => {
  await page.goto('/guides/building-your-first-mcp-server');
  await expect(
    page.getByRole('button', { name: 'Sign in to save progress' }),
  ).toBeVisible();
  await expect(page.locator('.guide-overview-hero')).toHaveScreenshot(
    'interactive-guide-overview.png',
    { animations: 'disabled', maxDiffPixelRatio: 0.01 },
  );
});

test('interactive capability builder visual baselines', async ({ page }) => {
  await captureBlock(page, 'add-tools', 'interactive-tool-builder.png');
  await captureBlock(page, 'add-resources', 'interactive-resource-builder.png');
  await captureBlock(page, 'add-prompts', 'interactive-prompt-builder.png');
});

test('interactive workspace mode visual baselines', async ({ page }) => {
  await captureBlock(page, 'add-tools', 'interactive-code-view.png', 'Code');
  await captureBlock(
    page,
    'connect-the-atm-client',
    'interactive-protocol-view.png',
    'Protocol',
  );
  await captureBlock(page, 'test-your-server', 'interactive-client-view.png');
});

test('interactive completion visual baseline', async ({ page }) => {
  await captureBlock(page, 'review-and-export', 'interactive-completion.png');
});
