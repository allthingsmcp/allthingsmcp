import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { toNodeHandler } from '@modelcontextprotocol/node';
import sharp from 'sharp';
import { createApp } from '../src/app.ts';
import { connect, createDispatcher } from '../src/connection.ts';
import { fixtureRoot, sampleInput, thumbnailInput } from '../src/config.ts';
import { resizeImage } from '../src/resize-image.ts';
import { TaskStore } from '../src/task-store.ts';
import { TaskWorker } from '../src/task-worker.ts';
import { createThumbnails, type Manifest } from '../src/thumbnails.ts';
import { watchTask } from '../src/watch-task.ts';

test('real HTTP discovery, ordinary calls, task lifecycle and recovery', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'atm-tasks-'));
  const store = new TaskStore(path.join(root, 'tasks'), 3_600_000, 100);
  await store.initialize();
  const options = {
    fixtures: fixtureRoot,
    output: path.join(root, 'output'),
    demoDelayMs: 35,
  };
  const worker = new TaskWorker(store, options);
  const app = createApp(options, worker);
  const server = createServer(toNodeHandler(app));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address === 'object');
  const url = `http://127.0.0.1:${address.port}/mcp`;
  t.after(async () => {
    await worker.drain();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(root, { recursive: true, force: true });
  });
  const connection = await connect(url);
  t.after(() => connection.close());

  await t.test('SDK discovers the tool and schema', async () => {
    const { tools } = await connection.client.listTools();
    assert.equal(tools[0]?.name, 'create_thumbnails');
    assert(tools[0]?.inputSchema.properties?.widths);
  });
  await t.test('request without Tasks gets an ordinary result', async () => {
    const result = (await createDispatcher(url, {})('tools/call', {
      name: 'create_thumbnails',
      arguments: { images: ['landscape.png'], widths: [320] },
    })) as { resultType: string; structuredContent: Manifest };
    assert.equal(result.resultType, 'complete');
    assert.equal(result.structuredContent.images.length, 1);
    assert.equal(result.structuredContent.images[0]?.width, 320);
  });
  await t.test(
    'persisted handle is readable immediately; a new client resumes all 18 files',
    async () => {
      const inputBefore = await readFile(
        path.join(fixtureRoot, 'landscape.png'),
      );
      const response = await connection.callTool(sampleInput);
      assert.equal(response.resultType, 'task');
      if (response.resultType !== 'task') throw new Error('Expected task');
      const initial = await connection.getTask(response.taskId);
      assert.equal(initial.taskId, response.taskId);
      assert.equal(initial.status, 'working');
      const resumed = await connect(url);
      const messages: string[] = [];
      let result;
      try {
        result = await watchTask(resumed, response.taskId, (message) =>
          messages.push(message),
        );
      } finally {
        await resumed.close();
      }
      assert(result && !result.isError);
      const manifest = result.structuredContent as unknown as Manifest;
      assert.equal(manifest.images.length, 18);
      for (const entry of manifest.images) {
        const metadata = await sharp(
          path.join(manifest.directory, entry.path),
        ).metadata();
        assert.equal(metadata.format, 'webp');
        assert.equal(metadata.width, entry.requestedWidth);
        assert.equal(metadata.height, entry.height);
      }
      assert(
        messages.some((message) => /working: Created \d+ of 18/.test(message)),
      );
      assert.deepEqual(
        await readFile(path.join(fixtureRoot, 'landscape.png')),
        inputBefore,
      );
      await connection.cancelTask(response.taskId);
      assert.equal(
        (await connection.getTask(response.taskId)).status,
        'completed',
        'late cancellation must not change the completed result',
      );
    },
  );
  await t.test(
    'cancellation acknowledgement is followed by terminal cancellation',
    async () => {
      const response = await connection.callTool(sampleInput);
      if (response.resultType !== 'task') throw new Error('Expected task');
      await delay(120);
      assert.equal(
        (await connection.cancelTask(response.taskId)).resultType,
        'complete',
      );
      assert.equal(
        await watchTask(connection, response.taskId, () => {}),
        undefined,
      );
      const task = await connection.getTask(response.taskId);
      assert.equal(task.status, 'cancelled');
      assert(!('result' in task));
    },
  );
  await t.test(
    'corrupt input is a completed tool error, then a corrected run succeeds',
    async () => {
      const response = await connection.callTool({
        images: ['broken.png'],
        widths: [320],
      });
      if (response.resultType !== 'task') throw new Error('Expected task');
      const result = await watchTask(connection, response.taskId, () => {});
      assert(result?.isError);
      assert.equal(
        (await connection.getTask(response.taskId)).status,
        'completed',
      );
      const fixed = await connection.callTool({
        images: ['landscape.png'],
        widths: [320],
      });
      if (fixed.resultType !== 'task') throw new Error('Expected task');
      assert.equal(
        (await watchTask(connection, fixed.taskId, () => {}))?.isError,
        undefined,
      );
    },
  );
  await t.test(
    'protocol errors and missing per-request extension support are explicit',
    async () => {
      await assert.rejects(
        connection.getTask('missing'),
        /not found or expired/,
      );
      await assert.rejects(
        createDispatcher(url, {})('tasks/get', { taskId: 'missing' }),
        /requires MCP Tasks support/,
      );
      await assert.rejects(
        createDispatcher(url)('tools/call', {
          name: 'create_thumbnails',
          arguments: { images: ['../secret.png'] },
        }),
      );
    },
  );
});

test('fast completion, expired handles, and interrupted server work', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'atm-store-'));
  try {
    const store = new TaskStore(path.join(root, 'tasks'));
    await store.initialize();
    const worker = new TaskWorker(store, { output: path.join(root, 'output') });
    const response = await worker.start({
      images: ['landscape.png'],
      widths: [320],
    });
    await worker.drain();
    assert.equal((await store.get(response.taskId)).status, 'completed');
    const interrupted = await store.create();
    await new TaskStore(store.directory).initialize();
    const recovered = await store.get(interrupted.taskId);
    assert.equal(recovered.status, 'failed');
    if (recovered.status === 'failed')
      assert.equal(recovered.error.code, -32603);
    assert.equal((await store.get(response.taskId)).status, 'completed');
    const expiry = new TaskStore(path.join(root, 'short'), 1);
    await expiry.initialize();
    const task = await expiry.create();
    await delay(5);
    await assert.rejects(expiry.get(task.taskId), /not found or expired/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('image boundaries, orientation, no enlargement, and duplicate inputs', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'atm-images-'));
  try {
    const small = path.join(root, 'small.jpg');
    await sharp({
      create: { width: 100, height: 50, channels: 3, background: 'red' },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toFile(small);
    const info = await resizeImage(small, path.join(root, 'result.webp'), 320);
    assert.equal(info.width, 50);
    assert.equal(info.height, 100);
    const fixtures = path.join(root, 'fixtures');
    const { mkdir } = await import('node:fs/promises');
    await mkdir(fixtures);
    await symlink(small, path.join(fixtures, 'escape.jpg'));
    const escaped = await createThumbnails(
      { images: ['escape.jpg'], widths: [320] },
      { fixtures, output: path.join(root, 'out') },
    );
    assert.equal(escaped.isError, true);
    assert.match(escaped.content[0]!.text, /stay inside/);
    const missing = await createThumbnails(
      { images: ['absent.png'], widths: [320] },
      { fixtures, output: path.join(root, 'out') },
    );
    assert.equal(missing.isError, true);
    assert.equal(
      thumbnailInput.safeParse({ widths: [320, 320] }).success,
      false,
    );
    assert.equal(
      thumbnailInput.safeParse({ images: ['landscape.png', 'landscape.png'] })
        .success,
      false,
    );
    await writeFile(path.join(root, 'note.txt'), 'Inputs remain untouched.');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
