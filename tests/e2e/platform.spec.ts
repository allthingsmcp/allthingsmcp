import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/guides',
  '/guides/mcp-fundamentals',
  '/blog',
  '/blog/mcp-architecture',
  '/spec-watch',
  '/spec-watch/current-protocol',
  '/glossary',
  '/search',
  '/editorial-policy',
  '/contribute',
];

for (const route of routes) {
  test(`${route} has the focused shell`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('.site-header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
  });
}

test('primary navigation exposes only the three content products', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile);
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(nav.getByRole('link')).toHaveText([
    'Guides',
    'Blog',
    'Spec Watch',
  ]);
  await expect(
    nav.getByRole('link', {
      name: /ecosystem|tools|learn|build|operate|security/i,
    }),
  ).toHaveCount(0);
});

test('legacy learning hubs redirect to Guide fragments', async ({ page }) => {
  await page.goto('/security');
  await expect(page).toHaveURL(/\/guides#security$/);
  await expect(page.getByRole('button', { name: 'Security' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('Guide fragments filter and browser history restores state', async ({
  page,
}) => {
  await page.goto('/guides#learn');
  await expect(page.getByRole('button', { name: 'Learn' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Build' }).click();
  await expect(page).toHaveURL(/#build$/);
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Learn' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('Guide progress persists and can be cleared', async ({
  page,
  isMobile,
}) => {
  await page.goto('/guides/mcp-fundamentals');
  if (isMobile) await page.getByText(/Guide progress · 0%/).click();
  const first = page.getByRole('button', {
    name: /Mark complete: Define the protocol boundary/,
  });
  await first.click();
  await page.reload();
  if (isMobile) await page.getByText(/Guide progress · 20%/).click();
  await expect(
    page.getByRole('button', {
      name: /Mark incomplete: Define the protocol boundary/,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Reset progress' }).click();
  await expect(
    page.getByRole('button', {
      name: /Mark complete: Define the protocol boundary/,
    }),
  ).toBeVisible();
});

test('mobile navigation is keyboard operable', async ({ page, isMobile }) => {
  test.skip(!isMobile);
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Open navigation' });
  await menu.focus();
  await menu.press('Enter');
  const mobile = page.getByRole('navigation', { name: 'Mobile navigation' });
  await expect(mobile).toBeVisible();
  await expect(mobile.getByRole('link')).toHaveText([
    'Guides',
    'Blog',
    'Spec Watch',
    'Subscribe',
    'About',
  ]);
});

test('representative pages have no serious accessibility violations', async ({
  page,
}) => {
  for (const route of ['/', '/guides', '/blog', '/spec-watch']) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((violation) =>
        ['critical', 'serious'].includes(violation.impact ?? ''),
      ),
    ).toEqual([]);
  }
});

test('deferred tools remain honest and noindexed', async ({ page }) => {
  await page.goto('/tools');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex/,
  );
  await expect(page.getByText('Planned').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /open tool/i })).toHaveCount(0);
});
