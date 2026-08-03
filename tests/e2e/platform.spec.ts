import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
  '/',
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

test('mobile navigation is keyboard operable', async ({ page, isMobile }) => {
  test.skip(!isMobile);
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Open navigation' });
  await menu.focus();
  await menu.press('Enter');
  await expect(
    page.getByRole('button', { name: 'Close navigation' }),
  ).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.getByRole('navigation', { name: 'Mobile navigation' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'Mobile navigation' })
      .getByRole('link', { name: 'Security', exact: true }),
  ).toBeVisible();
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
