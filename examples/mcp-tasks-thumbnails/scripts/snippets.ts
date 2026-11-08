import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot } from '../src/config.ts';
import { teachingFiles } from './snapshots.ts';

const directory = path.resolve(
  projectRoot,
  '../../apps/web/content/guide-steps/build-mcp-tasks-with-sharp',
);
const shown = new Set<string>();
for (const name of await readdir(directory)) {
  const document = await readFile(path.join(directory, name), 'utf8');
  for (const match of document.matchAll(
    /```typescript title="([^"]+)"\n([\s\S]*?)\n```/g,
  )) {
    const filename = match[1]!;
    if (!teachingFiles.includes(filename)) continue;
    assert.equal(
      match[2]!.trim(),
      (await readFile(path.join(projectRoot, filename), 'utf8')).trim(),
      `${name}: ${filename} differs from canonical code`,
    );
    shown.add(filename);
  }
}
assert.deepEqual([...shown].sort(), [...teachingFiles].sort());
console.log(
  `Verified ${shown.size} complete teaching snippets against canonical source.`,
);
