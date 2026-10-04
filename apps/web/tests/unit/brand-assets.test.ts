import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { brandAssets, brandIdentity } from '@/lib/brand';

const repositoryRoot = path.resolve(process.cwd(), '../..');
const sourceDir = path.join(
  repositoryRoot,
  'skills/all-things-mcp/brand-system/assets/logo/open-junction',
);
const publicDir = path.join(process.cwd(), 'public/brand');
const manifest = JSON.parse(
  readFileSync(path.join(sourceDir, 'manifest.json'), 'utf8'),
) as {
  assets: Array<{ name: string; svg: string; png: string }>;
};

describe('Open Junction brand distribution', () => {
  function pngDimensions(file: string) {
    const png = readFileSync(file);
    return [png.readUInt32BE(16), png.readUInt32BE(20)];
  }

  it('publishes the exact approved masters without fonts, bitmaps, or filters', () => {
    expect(manifest.assets).toHaveLength(14);
    for (const asset of manifest.assets) {
      for (const relative of [asset.svg, asset.png]) {
        expect(
          readFileSync(path.join(publicDir, 'open-junction', relative)),
        ).toEqual(readFileSync(path.join(sourceDir, relative)));
      }
      const svg = readFileSync(path.join(sourceDir, asset.svg), 'utf8');
      expect(svg).not.toMatch(/<(?:text|image|filter)\b/);
    }
  });

  it('uses versioned current-family paths for every site identity surface', () => {
    for (const asset of Object.values(brandAssets)) {
      expect(asset).toMatch(/^\/brand\/open-junction\//);
      expect(existsSync(path.join(process.cwd(), 'public', asset))).toBe(true);
    }
    expect(brandIdentity.positioning).toBe('Learn. Build. Ship with MCP.');
    const author = readFileSync(
      path.join(process.cwd(), 'content/authors/all-things-mcp.yaml'),
      'utf8',
    );
    expect(author).toContain(brandAssets.avatar);
  });

  it('keeps old public URLs compatible using only current artwork', () => {
    const aliases = {
      'all-things-mcp-logo.svg': 'svg/horizontal-light.svg',
      'all-things-mcp-logo-dark.svg': 'svg/horizontal-dark.svg',
      'logo-mark.svg': 'svg/mark-blue.svg',
      'primary-logo-light.svg': 'svg/primary-light.svg',
      'primary-logo-dark.svg': 'svg/primary-dark.svg',
      'wordmark.svg': 'svg/wordmark-navy.svg',
      'favicon.svg': 'icons/favicon.svg',
      'icon-square.svg': 'icons/avatar.svg',
      'apple-touch-icon.png': 'icons/avatar-180.png',
    };
    for (const [alias, current] of Object.entries(aliases)) {
      expect(readFileSync(path.join(publicDir, alias))).toEqual(
        readFileSync(path.join(sourceDir, current)),
      );
    }
    expect(readFileSync(path.join(publicDir, 'social-card.png'))).toEqual(
      readFileSync(path.join(publicDir, 'open-junction/social-card-v2.png')),
    );
    expect(
      readFileSync(path.join(publicDir, 'open-junction/social-card.png')),
    ).toEqual(
      readFileSync(path.join(publicDir, 'open-junction/social-card-v2.png')),
    );
  });

  it('keeps brand colours and contrast aligned across the site and email', () => {
    const css = readFileSync(
      path.join(process.cwd(), 'app/globals.css'),
      'utf8',
    );
    for (const [token, colour] of Object.entries({
      blue: brandIdentity.color.blue,
      'blue-on-dark': brandIdentity.color.blueOnDark,
      ink: brandIdentity.color.navy,
      footer: brandIdentity.color.navy,
      surface: brandIdentity.color.mist,
      green: brandIdentity.color.success,
      violet: brandIdentity.color.violet,
      orange: brandIdentity.color.orange,
    })) {
      expect(css.toLowerCase()).toContain(
        `--${token}: ${colour.toLowerCase()}`,
      );
    }
    const email = readFileSync(
      path.join(repositoryRoot, 'supabase/functions/welcome-email/index.ts'),
      'utf8',
    );
    expect(email).toContain('/brand/open-junction/png/horizontal-dark.png');
    expect(email).toContain(brandIdentity.positioning);
    expect(css + email).not.toMatch(/#0a55ff|#071426|#091225/i);
    const luminance = (hex: string) =>
      hex
        .slice(1)
        .match(/../g)!
        .map((n) => parseInt(n, 16) / 255)
        .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4))
        .reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);
    const contrast = (a: string, b: string) =>
      (Math.max(luminance(a), luminance(b)) + 0.05) /
      (Math.min(luminance(a), luminance(b)) + 0.05);
    expect(
      contrast(brandIdentity.color.blue, '#FFFFFF'),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(brandIdentity.color.blueOnDark, brandIdentity.color.navy),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(brandIdentity.color.muted, brandIdentity.color.mist),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('contains only current-family SVGs and a font-independent social card', () => {
    const card = readFileSync(
      path.join(publicDir, 'open-junction/social-card-v2.svg'),
      'utf8',
    );
    expect(card).toContain('width="1200" height="630"');
    expect(card).toContain(brandIdentity.color.navy);
    expect(card).toContain(brandIdentity.color.blueOnDark);
    expect(card).not.toMatch(/<(?:text|image|filter)\b/);
    const githubCard = readFileSync(
      path.join(publicDir, 'open-junction/github-social-preview.svg'),
      'utf8',
    );
    expect(githubCard).toContain('width="1280" height="640"');
    expect(githubCard).not.toMatch(/<(?:text|image|filter)\b/);
    expect(
      statSync(path.join(publicDir, 'open-junction/github-social-preview.png'))
        .size,
    ).toBeLessThan(1_000_000);
    for (const file of readdirSync(path.join(sourceDir, 'icons')).filter(
      (name) => name.endsWith('.svg'),
    )) {
      expect(
        readFileSync(path.join(sourceDir, 'icons', file), 'utf8'),
      ).toContain('Open Junction');
    }
  });

  it('publishes the complete Substack brand pack at upload-ready sizes', () => {
    const substackDir = path.join(publicDir, 'open-junction/substack');
    for (const [file, dimensions] of Object.entries({
      'publication-logo.png': [512, 512],
      'publication-wordmark.png': [1344, 256],
      'email-banner.png': [1100, 220],
      'welcome-cover.png': [1200, 1200],
      'post-preview-background.png': [1200, 630],
    })) {
      expect(pngDimensions(path.join(substackDir, file))).toEqual(dimensions);
      expect(statSync(path.join(substackDir, file)).size).toBeLessThan(
        1_000_000,
      );
    }
    expect(existsSync(path.join(substackDir, 'README.md'))).toBe(true);
    const [wordmarkWidth, wordmarkHeight] = pngDimensions(
      path.join(substackDir, 'publication-wordmark.png'),
    );
    expect(wordmarkWidth / wordmarkHeight).toBeLessThanOrEqual(21 / 4);
    expect(
      readFileSync(path.join(substackDir, 'post-preview-template.svg'), 'utf8'),
    ).toContain('ATM FIELD NOTE');
  });
});
