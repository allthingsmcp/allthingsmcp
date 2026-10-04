import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { copyFile, mkdir, mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import {
  assertRetainedGrowth,
  assertMemoryGrowth,
  requestPathForMode,
} from './check-memory.mjs';

const MiB = 1024 * 1024;

test('RSC-only requests carry the empty canonical cache-busting marker', () => {
  assert.equal(requestPathForMode('/guides', 'rsc'), '/guides?_rsc=');
  assert.equal(
    requestPathForMode('/guides?tag=mcp', 'rsc'),
    '/guides?tag=mcp&_rsc=',
  );
  assert.equal(
    requestPathForMode('/guides?_rsc=stale', 'rsc'),
    '/guides?_rsc=',
  );
  assert.equal(requestPathForMode('/guides', 'html'), '/guides');
  assert.equal(requestPathForMode('/guides', 'cancel'), '/guides');
});

test('external growth has a 32 MiB hard cap while RSS growth is advisory', () => {
  const warm = { heapUsed: 50 * MiB, external: 5 * MiB, rss: 100 * MiB };
  assert.doesNotThrow(() =>
    assertMemoryGrowth(warm, { ...warm, external: 37 * MiB }),
  );
  assert.throws(
    () => assertMemoryGrowth(warm, { ...warm, external: 37 * MiB + 1 }),
    /Retained external/,
  );
  assert.equal(
    assertMemoryGrowth(warm, { ...warm, rss: 228 * MiB }).rssWarning,
    false,
  );
  assert.equal(
    assertMemoryGrowth(warm, { ...warm, rss: 228 * MiB + 1 }).rssWarning,
    true,
  );
  assert.throws(
    () => assertMemoryGrowth(warm, { ...warm, external: NaN }),
    /Invalid final external/,
  );
  assert.throws(
    () => assertMemoryGrowth(warm, { ...warm, rss: Infinity }),
    /Invalid final RSS/,
  );
});

test('retained heap may stay flat, shrink, or grow within the allowance', () => {
  for (const finalMiB of [40, 50, 60]) {
    assert.doesNotThrow(() => assertRetainedGrowth(50 * MiB, finalMiB * MiB));
  }
});

test('exactly 32 MiB of retained growth passes', () => {
  assert.doesNotThrow(() => assertRetainedGrowth(50 * MiB, 82 * MiB));
});

test('one byte over the retained-growth allowance fails', () => {
  assert.throws(
    () => assertRetainedGrowth(50 * MiB, 82 * MiB + 1),
    /Retained heap grew/,
  );
});

test('invalid warm samples cannot produce a false pass', () => {
  for (const invalid of [0, -1, NaN, Infinity, undefined]) {
    assert.throws(
      () => assertRetainedGrowth(invalid, 50 * MiB),
      /Invalid warm/,
    );
  }
});

test('invalid final samples cannot produce a false pass', () => {
  for (const invalid of [0, -1, NaN, Infinity, undefined]) {
    assert.throws(
      () => assertRetainedGrowth(50 * MiB, invalid),
      /Invalid final/,
    );
  }
});

test('missing build exits nonzero even when the CLI is invoked via a symlink', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'atm-memory-check-test-'));
  try {
    const scripts = join(directory, 'scripts');
    await mkdir(scripts);
    const script = join(scripts, 'check-memory.mjs');
    await copyFile(
      fileURLToPath(new URL('./check-memory.mjs', import.meta.url)),
      script,
    );
    const alias = join(directory, 'check-memory-alias.mjs');
    await symlink(script, alias);
    await assert.rejects(
      promisify(execFile)(process.execPath, [alias], { timeout: 5_000 }),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /A production build is required/);
        return true;
      },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test(
  'probe returns correlated post-GC samples over IPC without opening a debug port',
  {
    timeout: 5_000,
  },
  async () => {
    const probe = fileURLToPath(new URL('./memory-probe.mjs', import.meta.url));
    const child = spawn(
      process.execPath,
      [
        '--max-old-space-size=64',
        '--import',
        probe,
        '--input-type=module',
        '-e',
        "import inspector from 'node:inspector'; process.send({type:'probe-state',inspectorUrl:inspector.url()}); setInterval(()=>{},1000);",
      ],
      { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] },
    );
    const exited = once(child, 'exit');
    const signal = AbortSignal.timeout(3_000);
    try {
      const [state] = await once(child, 'message', { signal });
      assert.equal(state.type, 'probe-state');
      assert.equal(state.inspectorUrl, undefined);
      const response = once(child, 'message', { signal });
      child.send({ type: 'atm-memory-sample', id: 7 });
      const [sample] = await response;
      assert.equal(sample.type, 'atm-memory-sample');
      assert.equal(sample.id, 7);
      assert.equal(sample.error, undefined);
      assert(sample.memory.heapUsed > 0);
      assert(sample.memory.rss > 0);
      assert(sample.peak.heapUsed >= sample.memory.heapUsed);
      assert(sample.peak.rss >= sample.memory.rss);
    } finally {
      child.kill('SIGTERM');
      const killTimer = setTimeout(() => child.kill('SIGKILL'), 1_000);
      await exited;
      clearTimeout(killTimer);
    }
  },
);
