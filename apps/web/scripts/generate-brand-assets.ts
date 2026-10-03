import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const repositoryRoot = path.resolve(root, '../..');
const sourceLogo = path.join(
  repositoryRoot,
  'skills/all-things-mcp/brand-system/assets/logo/all-things-mcp-logo.svg',
);
const outputDir = path.join(root, 'public/brand');

const BLUE = '#0A55FF';
const BLUE_DARK_SURFACE = '#5B8CFF';
const NAVY = '#091225';
const DARK_SURFACE = '#071426';
const WHITE = '#FFFFFF';

function documentSvg({
  width,
  height,
  viewBox,
  title,
  description,
  body,
}: {
  width: number;
  height: number;
  viewBox: string;
  title: string;
  description: string;
  body: string;
}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}" role="img" aria-labelledby="title description">
  <title id="title">${title}</title>
  <desc id="description">${description}</desc>
  ${body}
</svg>
`;
}

function mark({
  color = BLUE,
  transform,
  strokeWidth = 1.5,
}: {
  color?: string;
  transform?: string;
  strokeWidth?: number;
} = {}) {
  return `<g${transform ? ` transform="${transform}"` : ''} fill="${color}" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 7H27M16 7V21" fill="none" stroke-width="${strokeWidth}"/>
    <circle cx="5" cy="7" r="3" stroke="none"/>
    <circle cx="16" cy="7" r="3" stroke="none"/>
    <circle cx="27" cy="7" r="3" stroke="none"/>
    <circle cx="16" cy="21" r="3" stroke="none"/>
  </g>`;
}

function faviconMark() {
  return `<g fill="${BLUE}" stroke="${BLUE}" stroke-linecap="round">
    <path d="M6 9H26M16 9V25" fill="none" stroke-width="3"/>
    <circle cx="6" cy="9" r="4" stroke="none"/>
    <circle cx="16" cy="9" r="4" stroke="none"/>
    <circle cx="26" cy="9" r="4" stroke="none"/>
    <circle cx="16" cy="25" r="4" stroke="none"/>
  </g>`;
}

function recolorWordmark(
  wordmarkPath: string,
  color: string,
  transform?: string,
) {
  const recolored = wordmarkPath.replace(
    /fill="#[0-9A-Fa-f]{6}"/,
    `fill="${color}"`,
  );
  return transform ? `<g transform="${transform}">${recolored}</g>` : recolored;
}

function tagline(color: string) {
  return `<text x="52" y="48" fill="${color}" font-family="Inter, Arial, sans-serif" font-size="4" font-weight="600" letter-spacing="1.05">LEARN. BUILD. SHIP WITH MCP.</text>`;
}

async function loadSharp() {
  const pnpmStore = path.join(repositoryRoot, 'node_modules/.pnpm');
  const entries = await readdir(pnpmStore);
  const sharpPackage = entries.find((entry) => entry.startsWith('sharp@'));
  if (!sharpPackage) throw new Error('Sharp is not installed in node_modules');
  const modulePath = path.join(
    pnpmStore,
    sharpPackage,
    'node_modules/sharp/lib/index.js',
  );
  const sharpLibrary = await import(pathToFileURL(modulePath).href);
  return sharpLibrary.default;
}

async function renderPng(
  sharp: Awaited<ReturnType<typeof loadSharp>>,
  svgPath: string,
  pngPath: string,
  width: number,
  height: number,
) {
  const source = await readFile(svgPath);
  await sharp(source)
    .resize(width, height, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toFile(pngPath);
}

async function main() {
  const source = await readFile(sourceLogo, 'utf8');
  const wordmarkPath = source.match(/<path id="Wordmark"[\s\S]*?\/>/)?.[0];
  if (!wordmarkPath)
    throw new Error('Could not find the official Wordmark path');

  const assets = {
    'all-things-mcp-logo.svg': documentSvg({
      width: 198,
      height: 47,
      viewBox: '0 0 198 47',
      title: 'All Things MCP',
      description: 'Blue protocol mark beside the All Things MCP wordmark.',
      body: `${mark({ transform: 'translate(14 9)' })}
  ${recolorWordmark(wordmarkPath, NAVY)}`,
    }),
    'all-things-mcp-logo-dark.svg': documentSvg({
      width: 198,
      height: 47,
      viewBox: '0 0 198 47',
      title: 'All Things MCP',
      description:
        'Blue protocol mark beside the white All Things MCP wordmark.',
      body: `${mark({ color: BLUE_DARK_SURFACE, transform: 'translate(14 9)' })}
  ${recolorWordmark(wordmarkPath, WHITE)}`,
    }),
    'logo-mark.svg': documentSvg({
      width: 640,
      height: 480,
      viewBox: '0 0 32 28',
      title: 'All Things MCP logo mark',
      description:
        'Four connected nodes arranged as a precise T-shaped protocol graph.',
      body: mark(),
    }),
    'icon-square.svg': documentSvg({
      width: 512,
      height: 512,
      viewBox: '0 0 64 64',
      title: 'All Things MCP square icon',
      description:
        'The All Things MCP protocol mark on a dark navy rounded square.',
      body: `<rect width="64" height="64" rx="14" fill="${DARK_SURFACE}"/>
  ${mark({ color: BLUE_DARK_SURFACE, transform: 'translate(8 11) scale(1.5)', strokeWidth: 1.6 })}`,
    }),
    'favicon.svg': documentSvg({
      width: 32,
      height: 32,
      viewBox: '0 0 32 32',
      title: 'All Things MCP favicon',
      description:
        'A small-size optimized version of the All Things MCP protocol mark.',
      body: faviconMark(),
    }),
    'wordmark.svg': documentSvg({
      width: 1032,
      height: 176,
      viewBox: '50 14 133 22',
      title: 'All Things MCP wordmark',
      description:
        'The All Things MCP name set in the official outlined wordmark.',
      body: recolorWordmark(wordmarkPath, NAVY),
    }),
    'primary-logo-light.svg': documentSvg({
      width: 1584,
      height: 480,
      viewBox: '0 0 198 60',
      title: 'All Things MCP primary logo for light backgrounds',
      description:
        'Blue protocol mark with navy wordmark and the tagline Learn. Build. Ship with MCP.',
      body: `${mark({ transform: 'translate(14 10)' })}
  ${recolorWordmark(wordmarkPath, NAVY)}
  ${tagline(BLUE)}`,
    }),
    'primary-logo-dark.svg': documentSvg({
      width: 1584,
      height: 480,
      viewBox: '0 0 198 60',
      title: 'All Things MCP primary logo for dark backgrounds',
      description:
        'Blue protocol mark with white wordmark and the tagline Learn. Build. Ship with MCP.',
      body: `${mark({ color: BLUE_DARK_SURFACE, transform: 'translate(14 10)' })}
  ${recolorWordmark(wordmarkPath, WHITE)}
  ${tagline(BLUE_DARK_SURFACE)}`,
    }),
    'social-card.svg': documentSvg({
      width: 1200,
      height: 630,
      viewBox: '0 0 1200 630',
      title: 'All Things MCP',
      description: 'All Things MCP social sharing card.',
      body: `<rect width="1200" height="630" fill="#F7F9FC"/>
  <rect x="1" y="1" width="1198" height="628" rx="28" fill="none" stroke="#DDE3ED" stroke-width="2"/>
  <g transform="translate(105 165) scale(5)">
    ${mark({ transform: 'translate(14 10)' })}
    ${recolorWordmark(wordmarkPath, NAVY)}
    ${tagline(BLUE)}
  </g>`,
    }),
  };

  await mkdir(outputDir, { recursive: true });
  await Promise.all(
    Object.entries(assets).map(([name, contents]) =>
      writeFile(path.join(outputDir, name), contents),
    ),
  );
  await writeFile(sourceLogo, assets['all-things-mcp-logo.svg']);

  const sharp = await loadSharp();
  const renders: Array<[string, string, number, number]> = [
    ['all-things-mcp-logo.svg', 'all-things-mcp-logo.png', 1584, 376],
    ['all-things-mcp-logo-dark.svg', 'all-things-mcp-logo-dark.png', 1584, 376],
    ['logo-mark.svg', 'logo-mark.png', 1280, 960],
    ['icon-square.svg', 'icon-square.png', 1024, 1024],
    ['favicon.svg', 'favicon-32.png', 32, 32],
    ['favicon.svg', 'apple-touch-icon.png', 180, 180],
    ['wordmark.svg', 'wordmark.png', 2064, 352],
    ['primary-logo-light.svg', 'primary-logo-light.png', 1584, 480],
    ['primary-logo-dark.svg', 'primary-logo-dark.png', 1584, 480],
    ['social-card.svg', 'social-card.png', 1200, 630],
  ];
  for (const [svgName, pngName, width, height] of renders) {
    await renderPng(
      sharp,
      path.join(outputDir, svgName),
      path.join(outputDir, pngName),
      width,
      height,
    );
  }
}

await main();
