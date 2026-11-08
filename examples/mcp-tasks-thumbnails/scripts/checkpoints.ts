import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { projectRoot } from '../src/config.ts';
import { snapshot, stages } from './snapshots.ts';
import { createZipArchive } from './zip.ts';

const execute = promisify(execFile);
const root = await mkdtemp(path.join(tmpdir(), 'atm-checkpoints-'));
try {
  for (const [index, stage] of stages.entries()) {
    const files = await snapshot(stage);
    const zip = path.join(root, `${stage}.zip`);
    await writeFile(
      zip,
      createZipArchive(
        Object.fromEntries(
          Object.entries(files).map(([name, text]) => [
            `mcp-tasks-thumbnails/${name}`,
            text,
          ]),
        ),
      ),
    );
    const destination = path.join(root, stage);
    await execute('unzip', ['-q', zip, '-d', destination]);
    const cwd = path.join(destination, 'mcp-tasks-thumbnails');
    for (const [name, text] of Object.entries(files))
      assert.equal(await readFile(path.join(cwd, name), 'utf8'), text);
    await symlink(
      path.join(projectRoot, 'node_modules'),
      path.join(cwd, 'node_modules'),
      'dir',
    );
    const run = (args: string[]) =>
      execute(process.execPath, args, { cwd, timeout: 30_000 });
    await run(['node_modules/typescript/bin/tsc', '--noEmit']);
    await run(['--import', 'tsx', 'scripts/setup.ts']);
    assert.match(
      (await run(['--import', 'tsx', 'scripts/verify.ts'])).stdout,
      /6 images verified/,
    );
    if (index >= 0)
      assert.match(
        (await run(['--import', 'tsx', 'scripts/resize.ts'])).stdout,
        /1280 × 800/,
      );
    if (index >= 2) {
      const reservation = createServer();
      reservation.listen(0, '127.0.0.1');
      await once(reservation, 'listening');
      const address = reservation.address();
      assert(address && typeof address === 'object');
      await new Promise<void>((resolve) => reservation.close(() => resolve()));
      const args = [
        '--import',
        'tsx',
        'src/server.ts',
        '--port',
        String(address.port),
        ...(index >= 4 ? ['--demo-delay-ms', '40'] : []),
      ];
      const child = spawn(process.execPath, args, {
        cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let output = '';
      child.stderr.on('data', (chunk) => {
        output += String(chunk);
      });
      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error(`Server did not start: ${output}`)),
            10_000,
          );
          child.once('exit', (code) => {
            clearTimeout(timeout);
            reject(new Error(`Server exited ${code}: ${output}`));
          });
          child.stdout.on('data', (chunk) => {
            output += String(chunk);
            if (output.includes('MCP server:')) {
              clearTimeout(timeout);
              resolve();
            }
          });
        });
        const url = `http://127.0.0.1:${address.port}/mcp`;
        assert.match(
          (
            await run([
              '--import',
              'tsx',
              'src/client.ts',
              'inspect',
              '--url',
              url,
            ])
          ).stdout,
          /Tools: create_thumbnails/,
        );
        if (index === 2)
          assert.match(
            (await run(['--import', 'tsx', 'scripts/probe.ts', url])).stdout,
            /Task handle received:/,
          );
        if (index >= 3) {
          assert.match(
            (await run(['--import', 'tsx', 'scripts/tasks-client.ts', url]))
              .stdout,
            /Created 18 thumbnails/,
          );
          assert.match(
            (await run(['--import', 'tsx', 'scripts/verify.ts', '--output']))
              .stdout,
            /Verified 18 WebP/,
          );
        }
        if (index >= 4) {
          const cli = (...args: string[]) =>
            run(['--import', 'tsx', 'src/client.ts', ...args, '--url', url]);
          assert.match((await cli('run', '--detach')).stdout, /Detached/);
          const saved = await readFile(
            path.join(cwd, 'output/last-task.json'),
            'utf8',
          );
          assert.match(
            (await cli('watch', 'last')).stdout,
            /Created 18 thumbnails/,
          );
          assert.equal(
            await readFile(path.join(cwd, 'output/last-task.json'), 'utf8'),
            saved,
          );
          await cli('run', '--detach');
          const cancelled = (await cli('cancel', 'last')).stdout;
          assert.match(cancelled, /Cancellation requested/);
          assert.match(cancelled, /cancelled:|completed:/);
        }
        if (stage === 'completed') {
          await assert.rejects(
            run([
              '--import',
              'tsx',
              'src/client.ts',
              'run',
              '--images',
              'broken.png',
              '--url',
              url,
            ]),
            (error: unknown) => {
              assert.match(
                (error as { stdout: string }).stdout,
                /completed: Batch returned a tool error/,
              );
              return true;
            },
          );
          assert.match(
            (
              await run([
                '--import',
                'tsx',
                'src/client.ts',
                'run',
                '--images',
                'landscape.png',
                '--widths',
                '320,640',
                '--url',
                url,
              ])
            ).stdout,
            /Created 2 thumbnails/,
          );
          assert.match(
            (await run(['--import', 'tsx', 'scripts/verify.ts', '--output']))
              .stdout,
            /Verified 2 WebP/,
          );
        }
        const blocked = await fetch(url, {
          method: 'POST',
          headers: { origin: 'https://example.com' },
        });
        assert.equal(blocked.status, 403);
      } finally {
        if (child.exitCode === null) {
          const exited = once(child, 'exit');
          child.kill('SIGTERM');
          await exited;
        }
      }
    }
    console.log(`${stage}: extracted archive, types and step commands passed.`);
  }
} finally {
  await rm(root, { recursive: true, force: true });
}
