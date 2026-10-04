import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const brandRoot = '/brand/open-junction';

test('approved branding loads throughout the shared shell and metadata', async ({
  page,
  request,
}) => {
  await page.goto('/');
  const header = page.locator('.site-header');
  const footer = page.getByRole('contentinfo');
  await expect(header.locator('.logo-image')).toHaveAttribute(
    'src',
    `${brandRoot}/svg/horizontal-light.svg`,
  );
  await expect(footer.locator('.logo-image')).toHaveAttribute(
    'src',
    `${brandRoot}/svg/horizontal-dark.svg`,
  );
  await expect(page.locator('h1')).toHaveText('Learn. Build.Ship with MCP.');
  await expect(footer).toContainText('Learn. Build. Ship with MCP.');
  await expect(
    page.locator('link[rel="icon"][type="image/svg+xml"]'),
  ).toHaveAttribute('href', `${brandRoot}/icons/favicon.svg`);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    `${brandRoot}/icons/avatar-180.png`,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    new RegExp(`${brandRoot}/social-card-v2\\.png$`),
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    'content',
    new RegExp(`${brandRoot}/social-card-v2\\.png$`),
  );
  for (const asset of [
    'icons/favicon.svg',
    'icons/favicon-32.png',
    'icons/avatar-180.png',
    'social-card-v2.png',
    'png/horizontal-dark.png',
  ]) {
    expect((await request.get(`${brandRoot}/${asset}`)).ok()).toBe(true);
  }
  await expect
    .poll(() =>
      page
        .locator('.logo-image')
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await expect(header).toHaveScreenshot('brand-header.png', {
    animations: 'disabled',
  });
  await footer.scrollIntoViewIfNeeded();
  await expect(footer.locator('.footer-bottom')).toHaveScreenshot(
    'brand-footer-lockup.png',
    { animations: 'disabled', maxDiffPixels: 5 },
  );
  const accessibility = await new AxeBuilder({ page })
    .include('.site-header')
    .include('.site-footer')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(accessibility.violations).toEqual([]);
});

test('articles and guides publish title-aware social cards', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  const cases = [
    {
      path: '/blog/what-is-mcp',
      kind: 'article',
      slug: 'what-is-mcp',
    },
    {
      path: '/guides/building-your-first-mcp-server',
      kind: 'guide',
      slug: 'building-your-first-mcp-server',
    },
    {
      path: '/guides/building-your-first-mcp-server/what-is-mcp',
      kind: 'guide-step',
      slug: 'building-your-first-mcp-server/what-is-mcp',
    },
  ] as const;

  for (const entry of cases) {
    await page.goto(entry.path);
    const image = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content');
    expect(image).not.toBeNull();
    const imageUrl = new URL(image!);
    expect(imageUrl.pathname).toBe('/api/social-card/v2');
    expect(imageUrl.searchParams.get('kind')).toBe(entry.kind);
    expect(imageUrl.searchParams.get('slug')).toBe(entry.slug);
    const response = await request.get(
      `${imageUrl.pathname}${imageUrl.search}`,
    );
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/png');
    expect(response.headers()['cache-control']).toContain('immutable');
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
      'content',
      image!,
    );
  }
});

test('new logo stays clear of navigation from 320px through desktop', async ({
  page,
  isMobile,
}) => {
  test.skip(
    isMobile,
    'The desktop browser covers each exact responsive width.',
  );
  await page.goto('/');
  for (const width of [320, 390, 760, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const logo = await page.locator('.site-header .logo-link').boundingBox();
    const actions = await page.locator('.header-actions').boundingBox();
    expect(logo).not.toBeNull();
    expect(actions).not.toBeNull();
    expect(logo!.x + logo!.width).toBeLessThanOrEqual(actions!.x);
    expect(actions!.x + actions!.width).toBeLessThanOrEqual(width);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
});

test('editorial author avatar uses the new mark', async ({ page }) => {
  await page.goto('/blog/what-is-mcp');
  const avatar = page.locator('.article-authors img');
  await expect(avatar).toBeVisible();
  expect(
    decodeURIComponent((await avatar.getAttribute('src')) ?? ''),
  ).toContain(`${brandRoot}/icons/avatar-512.png`);
  await expect
    .poll(() =>
      avatar.evaluate(
        (image) =>
          (image as HTMLImageElement).complete &&
          (image as HTMLImageElement).naturalWidth > 0,
      ),
    )
    .toBe(true);
});
