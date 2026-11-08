import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { projectRoot } from '../src/config.ts';
import { snapshot, stages, teachingFiles } from './snapshots.ts';
import { createZipArchive } from './zip.ts';

const check = process.argv.includes('--check');
const site = check || process.argv.includes('--site');
const destination = site
  ? path.resolve(
      projectRoot,
      '../../apps/web/public/downloads/mcp-tasks-thumbnails',
    )
  : path.join(projectRoot, 'dist');
const hashes: Record<string, string> = {};
async function emit(name: string, data: Uint8Array | string) {
  const bytes =
    typeof data === 'string' ? Buffer.from(data) : Buffer.from(data);
  const target = path.join(destination, name);
  if (check)
    assert.deepEqual(
      await readFile(target),
      bytes,
      `Regenerate ${name} with pnpm run package --site`,
    );
  else {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
  }
  hashes[name] = createHash('sha256').update(bytes).digest('hex');
}
for (const stage of stages) {
  const files = await snapshot(stage);
  const archive = Object.fromEntries(
    Object.entries(files).map(([name, text]) => [
      `mcp-tasks-thumbnails/${name}`,
      text,
    ]),
  );
  await emit(`${stage}.zip`, createZipArchive(archive));
}
for (const name of teachingFiles)
  await emit(
    `source/${path.basename(name)}.txt`,
    await readFile(path.join(projectRoot, name), 'utf8'),
  );
const manifest =
  JSON.stringify(
    { protocolVersion: '2026-07-28', verifiedOn: '2026-10-31', sha256: hashes },
    null,
    2,
  ) + '\n';
if (check)
  assert.equal(
    await readFile(path.join(destination, 'manifest.json'), 'utf8'),
    manifest,
  );
else await writeFile(path.join(destination, 'manifest.json'), manifest);
console.log(
  `${check ? 'Verified' : 'Generated'} ${stages.length} archives and ${teachingFiles.length} source downloads.`,
);
