import { expect, test, type Page } from '@playwright/test';
import {
  buildingFirstServerDefinition,
  cloneCapability,
  createInitialInteractiveGuideState,
  interactiveGuideReducer,
} from '../../lib/interactive-guides';

const simulatorStorageKey =
  'all-things-mcp:interactive-guide:v1:building-your-first-mcp-server';

function configuredState() {
  let state = interactiveGuideReducer(createInitialInteractiveGuideState(), {
    type: 'create-server',
    name: 'weather-server',
  });
  for (const capability of buildingFirstServerDefinition.capabilities.filter(
    (item) =>
      ['get-weather', 'supported-cities', 'plan-for-weather'].includes(item.id),
  )) {
    state = interactiveGuideReducer(state, {
      type: 'upsert-capability',
      capability: cloneCapability(capability),
    });
  }
  state = interactiveGuideReducer(state, { type: 'connect-client' });
  state = interactiveGuideReducer(state, {
    type: 'run-tool',
    toolName: 'get_weather',
    location: 'London',
    unit: 'celsius',
  });
  return interactiveGuideReducer(state, { type: 'finish' });
}

async function seedSimulator(page: Page) {
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: simulatorStorageKey, value: JSON.stringify(configuredState()) },
  );
}

async function captureBlock(
  page: Page,
  step: string,
  name: string,
  tab?: string,
) {
  await page.goto(`/guides/building-your-first-mcp-server/${step}`);
  if (tab) await page.getByRole('tab', { name: tab }).click();
  await expect(page.locator('.interactive-guide-block')).toHaveScreenshot(
    name,
    {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    },
  );
}

test.beforeEach(async ({ page }) => {
  await seedSimulator(page);
});

test('interactive Guide overview visual baseline', async ({ page }) => {
  await page.goto('/guides/building-your-first-mcp-server');
  await expect(page.locator('.interactive-overview')).toHaveScreenshot(
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
