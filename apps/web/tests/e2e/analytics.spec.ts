import { expect, test, type Page } from '@playwright/test';

// Beacon bodies are not exposed on Playwright requests, so record them in the page.
async function collectorRequests(page: Page) {
  const requests: Array<{ n: string; path: string }> = [];
  await page.exposeFunction('__recordBeacon', (body: string) => {
    const payload = JSON.parse(body) as { n: string; u: string };
    requests.push({ n: payload.n, path: new URL(payload.u).pathname });
  });
  await page.addInitScript(() => {
    const original = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (url, data) => {
      if (String(url).endsWith('/api/e') && data instanceof Blob) {
        void data
          .text()
          .then((text) =>
            (
              window as unknown as { __recordBeacon: (body: string) => void }
            ).__recordBeacon(text),
          );
      }
      return original(url, data);
    };
  });
  return requests;
}

test('the analytics dashboard is hidden from visitors who are not the admin', async ({
  page,
}) => {
  const response = await page.goto('/admin/analytics');
  expect(response?.status()).toBe(404);
});

test('records one page view per navigation and none on admin pages', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Client-side navigation uses the desktop header links.');
  const requests = await collectorRequests(page);

  await page.goto('/');
  await expect.poll(() => requests.length).toBe(1);

  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'Guides' })
    .click();
  await expect(page).toHaveURL(/\/guides$/);
  await expect.poll(() => requests.length).toBe(2);

  await page.goto('/admin/analytics');
  await page.waitForLoadState('networkidle');
  expect(requests).toEqual([
    { n: 'pageview', path: '/' },
    { n: 'pageview', path: '/guides' },
  ]);
});
