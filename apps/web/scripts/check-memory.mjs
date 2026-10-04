import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { access } from 'node:fs/promises';
import http from 'node:http';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const MiB = 1024 * 1024;
const maximumRetainedGrowth = 32 * MiB;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const paths = [
  ['/', 200],
  ['/about', 200],
  ['/privacy', 404], // No privacy page exists yet; cover the shared 404 renderer.
  ['/blog', 200],
  ['/guides', 200],
  ['/guides/building-your-first-mcp-server', 200],
  ['/guides/building-your-first-mcp-server/what-is-mcp', 200],
  ['/api/search?query=server', 200],
];

export function assertRetainedGrowth(warmBytes, finalBytes) {
  assert(
    Number.isFinite(warmBytes) && warmBytes > 0,
    'Invalid warm heap sample',
  );
  assert(
    Number.isFinite(finalBytes) && finalBytes > 0,
    'Invalid final heap sample',
  );
  assert(
    finalBytes - warmBytes <= maximumRetainedGrowth,
    `Retained heap grew ${mib(finalBytes - warmBytes)} MiB after warmup; limit is 32 MiB`,
  );
}

function mib(bytes) {
  return Math.round((bytes / MiB) * 10) / 10;
}

export function requestPathForMode(path, mode) {
  if (mode !== 'rsc') return path;
  // RSC:1 without router/prefetch headers has an empty cache-busting hash.
  // Next validates that the marker exists; omitting it produces a 307.
  const url = new URL(path, 'http://127.0.0.1');
  url.searchParams.set('_rsc', '');
  return `${url.pathname}${url.search}`;
}

export function assertMemoryGrowth(warm, final) {
  assertRetainedGrowth(warm.heapUsed, final.heapUsed);
  for (const [label, memory] of [
    ['warm', warm],
    ['final', final],
  ]) {
    assert(
      Number.isFinite(memory.external) && memory.external >= 0,
      `Invalid ${label} external sample`,
    );
    assert(
      Number.isFinite(memory.rss) && memory.rss > 0,
      `Invalid ${label} RSS sample`,
    );
  }
  const growth = {
    heap: final.heapUsed - warm.heapUsed,
    external: final.external - warm.external,
    rss: final.rss - warm.rss,
  };
  assert(
    growth.external <= maximumRetainedGrowth,
    `Retained external memory grew ${mib(growth.external)} MiB after warmup; limit is 32 MiB`,
  );
  return { ...growth, rssWarning: growth.rss > 128 * MiB };
}

async function availablePort() {
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const { port } = reservation.address();
  await new Promise((resolveClose, reject) =>
    reservation.close((error) => (error ? reject(error) : resolveClose())),
  );
  return port;
}

export async function checkMemory() {
  await access(resolve(root, '.next', 'BUILD_ID')).catch(() => {
    throw new Error('A production build is required. Run pnpm build first.');
  });
  const port = await availablePort();
  const controller = new AbortController();
  const agent = new http.Agent({ keepAlive: true, maxSockets: 8 });
  const child = fork(
    resolve(root, 'node_modules/next/dist/bin/next'),
    ['start', '--hostname', '127.0.0.1', '--port', String(port)],
    {
      cwd: root,
      execArgv: [
        '--max-old-space-size=1024',
        '--import',
        fileURLToPath(new URL('./memory-probe.mjs', import.meta.url)),
      ],
      env: {
        ...process.env,
        NODE_OPTIONS: '',
        NODE_ENV: 'production',
        NEXT_DIST_DIR: '.next',
        NEXT_TELEMETRY_DISABLED: '1',
        NEXT_PUBLIC_SUPABASE_ENABLED: 'false',
        NEXT_PUBLIC_SUPABASE_URL: '',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
        GUIDE_RUNTIME_URL: '',
      },
      stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    },
  );
  let shuttingDown = false;
  let childExited = false;
  const exited = new Promise((resolveExit) => {
    child.once('exit', (code, signal) => {
      childExited = true;
      if (!shuttingDown)
        controller.abort(
          new Error(`Production server exited (${code ?? signal})`),
        );
      resolveExit();
    });
    child.once('error', (error) => {
      controller.abort(error);
      if (!child.pid) {
        childExited = true;
        resolveExit();
      }
    });
  });
  const stop = () => controller.abort(new Error('Memory check interrupted'));
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  const deadline = setTimeout(
    () =>
      controller.abort(
        new Error('Memory check exceeded its 120-second deadline'),
      ),
    120_000,
  );
  let sequence = 0;
  const counts = {
    completed: 0,
    cancelAttempts: 0,
    incompleteAtCancellation: 0,
  };

  async function sample(label) {
    controller.signal.throwIfAborted();
    const id = ++sequence;
    const signal = AbortSignal.any([
      controller.signal,
      AbortSignal.timeout(10_000),
    ]);
    const result = new Promise((resolveSample, reject) => {
      const cleanup = () => {
        child.off('message', onMessage);
        signal.removeEventListener('abort', onAbort);
      };
      const onAbort = () => {
        cleanup();
        reject(signal.reason);
      };
      const onMessage = (message) => {
        if (message?.type !== 'atm-memory-sample' || message.id !== id) return;
        cleanup();
        if (message.error) reject(new Error(message.error));
        else resolveSample(message);
      };
      child.on('message', onMessage);
      signal.addEventListener('abort', onAbort, { once: true });
      child.send({ type: 'atm-memory-sample', id }, (error) => {
        if (error) {
          cleanup();
          reject(error);
        }
      });
    });
    const { memory, peak } = await result;
    console.log(
      JSON.stringify({
        phase: label,
        postGcHeapMiB: mib(memory.heapUsed),
        rssMiB: mib(memory.rss),
        externalMiB: mib(memory.external),
        observedPeakHeapMiB: mib(peak.heapUsed),
        observedPeakRssMiB: mib(peak.rss),
        ...counts,
      }),
    );
    return memory;
  }

  async function request(path, expected = 200, mode = 'html') {
    controller.signal.throwIfAborted();
    path = requestPathForMode(path, mode);
    return new Promise((resolveRequest, reject) => {
      let settled = false;
      let bytes = 0;
      const signal = AbortSignal.any([
        controller.signal,
        AbortSignal.timeout(10_000),
      ]);
      const finish = (error) => {
        if (settled) return;
        settled = true;
        if (error) reject(error);
        else resolveRequest();
      };
      const req = http.get(
        {
          hostname: '127.0.0.1',
          port,
          path,
          agent,
          signal,
          headers: {
            'Accept-Encoding': 'gzip',
            ...(mode === 'rsc' ? { RSC: '1' } : {}),
          },
        },
        (res) => {
          if (res.statusCode !== expected) {
            finish(
              new Error(
                `${path}: expected ${expected}, received ${res.statusCode}`,
              ),
            );
            res.destroy();
            return;
          }
          if (
            mode === 'rsc' &&
            !res.headers['content-type']?.includes('text/x-component')
          ) {
            finish(new Error(`${path}: expected an RSC response`));
            res.destroy();
            return;
          }
          if (mode === 'cancel' && res.headers['content-encoding'] !== 'gzip') {
            finish(
              new Error(`${path}: expected gzip for cancellation coverage`),
            );
            res.destroy();
            return;
          }
          res.on('data', (chunk) => {
            bytes += chunk.length;
            if (mode === 'cancel' && !settled) {
              counts.cancelAttempts++;
              if (!res.complete) counts.incompleteAtCancellation++;
              // Exercise cancellation after a compressed body chunk, not an HTTP error.
              // Small responses may already be fully received; report that separately.
              finish();
              res.destroy();
            }
          });
          res.on('end', () => {
            if (!bytes) return finish(new Error(`${path}: empty response`));
            if (!settled) counts.completed++;
            finish();
          });
          res.on('aborted', () =>
            finish(new Error(`${path}: unexpected response abort`)),
          );
          res.on('error', finish);
        },
      );
      req.on('error', finish);
    });
  }

  try {
    console.log(
      'Production memory smoke: loopback-only, 1 GiB heap, 32 MiB retained-growth limit.',
    );
    let ready = false;
    for (let attempt = 0; attempt < 200; attempt++) {
      try {
        await request('/');
        ready = true;
        break;
      } catch (error) {
        controller.signal.throwIfAborted();
        if (error.code !== 'ECONNREFUSED') throw error;
        await delay(100, undefined, { signal: controller.signal });
      }
    }
    assert(ready, 'Production server did not become ready');
    // Warm every route and response mode before measuring retained growth.
    for (let round = 0; round < 3; round++) {
      await Promise.all(paths.map(([path, status]) => request(path, status)));
      await request('/guides', 200, 'rsc');
      await request(paths[6][0], 200, 'cancel');
      await request(`/__memory-check-missing__/warm-${round}`, 404);
    }
    await delay(200, undefined, { signal: controller.signal });
    const warm = await sample('warm');
    for (let round = 0; round < 4; round++) {
      for (let batch = 0; batch < 25; batch++) {
        await Promise.all(paths.map(([path, status]) => request(path, status)));
        await request('/guides', 200, 'rsc');
        await request(`/__memory-check-missing__/${round}-${batch}`, 404);
      }
      await sample(`full-${round + 1}`);
    }
    for (let round = 0; round < 2; round++) {
      for (let batch = 0; batch < 25; batch++) {
        await Promise.all(
          paths.slice(4, 7).map(([path]) => request(path, 200, 'cancel')),
        );
      }
      await delay(200, undefined, { signal: controller.signal });
      await sample(`cancel-${round + 1}`);
    }
    await delay(300, undefined, { signal: controller.signal });
    const final = await sample('final');
    assert(
      counts.incompleteAtCancellation > 0,
      'Cancellation coverage is inconclusive: every response finished before it was cancelled',
    );
    const growth = assertMemoryGrowth(warm, final);
    if (growth.rssWarning)
      console.warn(
        `WARN: post-warm RSS grew ${mib(growth.rss)} MiB. Investigate native allocations with a longer soak; allocator high-water retention can outlive garbage collection.`,
      );
    console.log(
      `PASS: post-GC growth heap=${mib(growth.heap)} MiB, external=${mib(growth.external)} MiB (32 MiB limit each), RSS=${mib(growth.rss)} MiB.`,
    );
    console.log(
      'This smoke test covers anonymous HTTP/RSC/search and cancellation, not authenticated traffic or a long-running soak.',
    );
  } finally {
    shuttingDown = true;
    clearTimeout(deadline);
    process.off('SIGINT', stop);
    process.off('SIGTERM', stop);
    controller.abort(new Error('Memory check finished'));
    agent.destroy();
    if (!childExited) {
      child.kill('SIGTERM');
      const killTimer = setTimeout(() => {
        if (!childExited) child.kill('SIGKILL');
      }, 3_000);
      await exited;
      clearTimeout(killTimer);
    }
  }
}

if (import.meta.main) {
  checkMemory().catch((error) => {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  });
}
