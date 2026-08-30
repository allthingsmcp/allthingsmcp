import { expect, test } from '@playwright/test';

async function settlePage(page: import('@playwright/test').Page) {
  await page.evaluate(() => document.fonts.ready);
}

test('desktop editorial surfaces match their visual baselines', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile);

  for (const [name, route] of [
    ['homepage', '/'],
    ['guides-landing', '/guides'],
    ['blog-landing', '/blog'],
  ] as const) {
    await page.goto(route);
    await settlePage(page);
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  }
});

test('architecture and Guide progress match their visual baselines', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile);

  await page.goto('/');
  await settlePage(page);
  await expect(page.locator('.production-architecture')).toHaveScreenshot(
    'production-architecture.png',
  );

  await page.goto('/guides/mcp-fundamentals');
  await settlePage(page);
  await expect(page.locator('.guide-progress--desktop')).toHaveScreenshot(
    'guide-progress.png',
  );
});

test('mobile menu matches its visual baseline', async ({ page, isMobile }) => {
  test.skip(!isMobile);

  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await settlePage(page);
  await expect(
    page.getByRole('navigation', { name: 'Mobile navigation' }),
  ).toHaveScreenshot('mobile-menu.png');
});
