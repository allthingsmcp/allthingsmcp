import assert from 'node:assert/strict';
import {
  copyFile,
  cp,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const webRoot = fileURLToPath(new URL('../', import.meta.url));
const repositoryRoot = path.resolve(webRoot, '../..');
const sourceDir = path.join(
  repositoryRoot,
  'skills/all-things-mcp/brand-system/assets/logo/open-junction',
);
const publicDir = path.join(webRoot, 'public/brand');
const outputDir = path.join(publicDir, 'open-junction');
const substackDir = path.join(outputDir, 'substack');
const identity = JSON.parse(
  await readFile(
    path.join(
      repositoryRoot,
      'skills/all-things-mcp/brand-system/assets/identity.json',
    ),
    'utf8',
  ),
);

// These existing public URLs remain usable, but all contain the new artwork.
// The approved masters are read-only inputs, never redrawn or recoloured here.
const aliases: Record<string, string> = {
  'all-things-mcp-logo.svg': 'svg/horizontal-light.svg',
  'all-things-mcp-logo-dark.svg': 'svg/horizontal-dark.svg',
  'primary-logo-light.svg': 'svg/primary-light.svg',
  'primary-logo-dark.svg': 'svg/primary-dark.svg',
  'logo-mark.svg': 'svg/mark-blue.svg',
  'wordmark.svg': 'svg/wordmark-navy.svg',
  'icon-square.svg': 'icons/avatar.svg',
  'favicon.svg': 'icons/favicon.svg',
  'all-things-mcp-logo.png': 'png/horizontal-light.png',
  'all-things-mcp-logo-dark.png': 'png/horizontal-dark.png',
  'primary-logo-light.png': 'png/primary-light.png',
  'primary-logo-dark.png': 'png/primary-dark.png',
  'logo-mark.png': 'png/mark-blue.png',
  'wordmark.png': 'png/wordmark-navy.png',
  'icon-square.png': 'icons/avatar-1024.png',
  'favicon-32.png': 'icons/favicon-32.png',
  'apple-touch-icon.png': 'icons/avatar-180.png',
};

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
  return (await import(pathToFileURL(modulePath).href)).default;
}

await mkdir(outputDir, { recursive: true });
await mkdir(substackDir, { recursive: true });
await cp(sourceDir, outputDir, { recursive: true });
for (const [alias, master] of Object.entries(aliases)) {
  await copyFile(path.join(sourceDir, master), path.join(publicDir, alias));
}

const primary = await readFile(
  path.join(sourceDir, 'svg/primary-dark.svg'),
  'utf8',
);
assert(
  !/<(?:text|image|filter)\b/.test(primary),
  'The social card requires an outlined, self-contained master.',
);
const inset = primary
  .replace('<svg ', '<svg x="72" y="218" ')
  .replace('width="950" height="194"', 'width="900" height="183.7894736842"');
const socialCard = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="social-title">
  <title id="social-title">All Things MCP — ${identity.positioning}</title>
  <rect width="1200" height="630" fill="${identity.color.navy}"/>
  <rect x="18" y="18" width="1164" height="594" rx="24" fill="none" stroke="${identity.color.blueOnDark}" stroke-opacity="0.32" stroke-width="2"/>
  <path d="M932 92H1092V252H1012V412H1132" fill="none" stroke="${identity.color.blue}" stroke-opacity="0.38" stroke-width="2"/>
  <path d="M972 132H1052V332H1132" fill="none" stroke="${identity.color.blueOnDark}" stroke-opacity="0.2" stroke-width="2"/>
  <g fill="${identity.color.blueOnDark}">
    <circle cx="932" cy="92" r="8"/><circle cx="1092" cy="92" r="8"/>
    <circle cx="1092" cy="252" r="8"/><circle cx="1012" cy="252" r="8"/>
    <circle cx="1012" cy="412" r="15" fill="${identity.color.navy}" stroke="${identity.color.blueOnDark}" stroke-width="5"/>
    <circle cx="1132" cy="412" r="8"/><circle cx="972" cy="132" r="6" opacity="0.7"/>
    <circle cx="1052" cy="332" r="6" opacity="0.7"/><circle cx="1132" cy="332" r="6" opacity="0.7"/>
  </g>
  <path d="M72 492H728" stroke="${identity.color.blueOnDark}" stroke-opacity="0.22" stroke-width="2"/>
  <circle cx="72" cy="492" r="6" fill="${identity.color.blueOnDark}"/>
  ${inset}
</svg>\n`;
await writeFile(path.join(outputDir, 'social-card-v2.svg'), socialCard);
const sharp = await loadSharp();
await sharp(Buffer.from(socialCard))
  .png({ compressionLevel: 9 })
  .toFile(path.join(outputDir, 'social-card-v2.png'));
for (const extension of ['svg', 'png']) {
  const versionedName = `social-card-v2.${extension}`;
  await copyFile(
    path.join(outputDir, versionedName),
    path.join(outputDir, `social-card.${extension}`),
  );
  await copyFile(
    path.join(outputDir, versionedName),
    path.join(publicDir, versionedName),
  );
  await copyFile(
    path.join(outputDir, versionedName),
    path.join(publicDir, `social-card.${extension}`),
  );
}

const githubInset = primary
  .replace('<svg ', '<svg x="76" y="222" ')
  .replace('width="950" height="194"', 'width="930" height="189.9789473684"');
const githubCard = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="640" viewBox="0 0 1280 640" role="img" aria-labelledby="github-title">
  <title id="github-title">All Things MCP GitHub repository — ${identity.positioning}</title>
  <rect width="1280" height="640" fill="${identity.color.navy}"/>
  <rect x="18" y="18" width="1244" height="604" rx="24" fill="none" stroke="${identity.color.blueOnDark}" stroke-opacity="0.32" stroke-width="2"/>
  <path d="M1012 82H1178V248H1095V414H1218" fill="none" stroke="${identity.color.blue}" stroke-opacity="0.38" stroke-width="2"/>
  <path d="M1054 124H1136V330H1218" fill="none" stroke="${identity.color.blueOnDark}" stroke-opacity="0.2" stroke-width="2"/>
  <g fill="${identity.color.blueOnDark}">
    <circle cx="1012" cy="82" r="8"/><circle cx="1178" cy="82" r="8"/>
    <circle cx="1178" cy="248" r="8"/><circle cx="1095" cy="248" r="8"/>
    <circle cx="1095" cy="414" r="15" fill="${identity.color.navy}" stroke="${identity.color.blueOnDark}" stroke-width="5"/>
    <circle cx="1218" cy="414" r="8"/><circle cx="1054" cy="124" r="6" opacity="0.7"/>
    <circle cx="1136" cy="330" r="6" opacity="0.7"/><circle cx="1218" cy="330" r="6" opacity="0.7"/>
  </g>
  <path d="M76 510H790" stroke="${identity.color.blueOnDark}" stroke-opacity="0.22" stroke-width="2"/>
  <circle cx="76" cy="510" r="6" fill="${identity.color.blueOnDark}"/>
  ${githubInset}
</svg>\n`;
await writeFile(path.join(outputDir, 'github-social-preview.svg'), githubCard);
await sharp(Buffer.from(githubCard))
  .png({ compressionLevel: 9 })
  .toFile(path.join(outputDir, 'github-social-preview.png'));

const markBlue = await readFile(
  path.join(sourceDir, 'svg/mark-blue.svg'),
  'utf8',
);
const horizontalLight = await readFile(
  path.join(sourceDir, 'svg/horizontal-light.svg'),
  'utf8',
);
const horizontalDark = await readFile(
  path.join(sourceDir, 'svg/horizontal-dark.svg'),
  'utf8',
);
const primaryLight = await readFile(
  path.join(sourceDir, 'svg/primary-light.svg'),
  'utf8',
);
const stackedDark = await readFile(
  path.join(sourceDir, 'svg/stacked-dark.svg'),
  'utf8',
);
for (const master of [
  markBlue,
  horizontalLight,
  horizontalDark,
  primaryLight,
  stackedDark,
]) {
  assert(
    !/<(?:text|image|filter)\b/.test(master),
    'Substack assets require outlined, self-contained masters.',
  );
}

await copyFile(
  path.join(sourceDir, 'svg/mark-blue.svg'),
  path.join(substackDir, 'publication-logo.svg'),
);
await sharp(Buffer.from(markBlue))
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(path.join(substackDir, 'publication-logo.png'));
const fittedWordmark = horizontalLight
  .replace('<svg ', '<svg x="0" y="3.5368421053" ')
  .replace('width="950" height="176"', 'width="1344" height="248.9263157895"');
const publicationWordmark = `<svg xmlns="http://www.w3.org/2000/svg" width="1344" height="256" viewBox="0 0 1344 256" role="img" aria-labelledby="substack-wordmark-title">
  <title id="substack-wordmark-title">All Things MCP</title>
  ${fittedWordmark}
</svg>\n`;
await writeFile(
  path.join(substackDir, 'publication-wordmark.svg'),
  publicationWordmark,
);
await sharp(Buffer.from(publicationWordmark))
  .png({ compressionLevel: 9 })
  .toFile(path.join(substackDir, 'publication-wordmark.png'));

const emailLogo = primaryLight
  .replace('<svg ', '<svg x="48" y="44" ')
  .replace('width="950" height="194"', 'width="640" height="130.6947368421"');
const emailBanner = `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="220" viewBox="0 0 1100 220" role="img" aria-labelledby="email-title">
  <title id="email-title">All Things MCP email banner — ${identity.positioning}</title>
  <rect width="1100" height="220" rx="14" fill="${identity.color.mist}"/>
  <rect x="1" y="1" width="1098" height="218" rx="13" fill="none" stroke="${identity.color.border}" stroke-width="2"/>
  <path d="M886 38H1026V108H956V178H1050" fill="none" stroke="${identity.color.blue}" stroke-opacity="0.3" stroke-width="2"/>
  <g fill="${identity.color.blue}">
    <circle cx="886" cy="38" r="6"/><circle cx="1026" cy="38" r="6"/>
    <circle cx="1026" cy="108" r="6"/><circle cx="956" cy="108" r="6"/>
    <circle cx="956" cy="178" r="11" fill="${identity.color.mist}" stroke="${identity.color.blue}" stroke-width="4"/>
    <circle cx="1050" cy="178" r="6"/>
  </g>
  ${emailLogo}
</svg>\n`;
await writeFile(path.join(substackDir, 'email-banner.svg'), emailBanner);
await sharp(Buffer.from(emailBanner))
  .png({ compressionLevel: 9 })
  .toFile(path.join(substackDir, 'email-banner.png'));

const welcomeLogo = stackedDark
  .replace('<svg ', '<svg x="190" y="350" ')
  .replace('width="820" height="444"', 'width="820" height="444"');
const welcomeCover = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200" role="img" aria-labelledby="welcome-title">
  <title id="welcome-title">Welcome to All Things MCP — ${identity.positioning}</title>
  <rect width="1200" height="1200" fill="${identity.color.navy}"/>
  <rect x="36" y="36" width="1128" height="1128" rx="28" fill="none" stroke="${identity.color.blueOnDark}" stroke-opacity="0.34" stroke-width="3"/>
  <path d="M842 116H1048V322H945V528H1092" fill="none" stroke="${identity.color.blue}" stroke-opacity="0.34" stroke-width="3"/>
  <path d="M108 958H436V1064H680" fill="none" stroke="${identity.color.blueOnDark}" stroke-opacity="0.2" stroke-width="3"/>
  <g fill="${identity.color.blueOnDark}">
    <circle cx="842" cy="116" r="10"/><circle cx="1048" cy="116" r="10"/>
    <circle cx="1048" cy="322" r="10"/><circle cx="945" cy="322" r="10"/>
    <circle cx="945" cy="528" r="18" fill="${identity.color.navy}" stroke="${identity.color.blueOnDark}" stroke-width="6"/>
    <circle cx="1092" cy="528" r="10"/><circle cx="108" cy="958" r="9"/>
    <circle cx="436" cy="958" r="9"/><circle cx="436" cy="1064" r="9"/>
    <circle cx="680" cy="1064" r="9"/>
  </g>
  ${welcomeLogo}
</svg>\n`;
await writeFile(path.join(substackDir, 'welcome-cover.svg'), welcomeCover);
await sharp(Buffer.from(welcomeCover))
  .png({ compressionLevel: 9 })
  .toFile(path.join(substackDir, 'welcome-cover.png'));

const postLogo = horizontalDark
  .replace('<svg ', '<svg x="72" y="58" ')
  .replace('width="950" height="176"', 'width="338" height="62.6273684211"');
const postPreview = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="post-title">
  <title id="post-title">ATM Field Note post preview template</title>
  <rect width="1200" height="630" fill="${identity.color.navy}"/>
  <rect x="18" y="18" width="1164" height="594" rx="24" fill="none" stroke="${identity.color.blueOnDark}" stroke-opacity="0.32" stroke-width="2"/>
  <text x="72" y="204" fill="${identity.color.blueOnDark}" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="5">ATM FIELD NOTE</text>
  <path d="M836 540V364L954 246H1182" fill="none" stroke="${identity.color.blue}" stroke-opacity="0.4" stroke-width="2"/>
  <g fill="${identity.color.blueOnDark}">
    <circle cx="836" cy="540" r="8"/><circle cx="954" cy="364" r="8"/>
    <circle cx="954" cy="246" r="15" fill="${identity.color.navy}" stroke="${identity.color.blueOnDark}" stroke-width="5"/>
    <circle cx="1072" cy="246" r="8"/><circle cx="1182" cy="246" r="8"/>
  </g>
  <path d="M72 548H650" stroke="${identity.color.blueOnDark}" stroke-opacity="0.2" stroke-width="2"/>
  <circle cx="72" cy="548" r="6" fill="${identity.color.blueOnDark}"/>
  ${postLogo}
</svg>\n`;
await writeFile(
  path.join(substackDir, 'post-preview-template.svg'),
  postPreview,
);
await sharp(Buffer.from(postPreview))
  .png({ compressionLevel: 9 })
  .toFile(path.join(substackDir, 'post-preview-background.png'));

console.log(
  'Published Open Junction masters, current-artwork URL aliases, icons, social previews, and the Substack brand pack.',
);
