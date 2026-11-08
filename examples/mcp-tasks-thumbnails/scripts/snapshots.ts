import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot } from '../src/config.ts';

export const stages = [
  'starter',
  'step-2',
  'step-3',
  'step-4',
  'step-5',
  'completed',
] as const;
export type Stage = (typeof stages)[number];
export const teachingFiles = [
  'src/app.ts',
  'scripts/tasks-client.ts',
  'src/task-handlers.ts',
  'src/watch-task.ts',
];
const maintenance = new Set([
  'snapshots.ts',
  'zip.ts',
  'package.ts',
  'checkpoints.ts',
  'snippets.ts',
  'preview.ts',
]);

export async function snapshot(stage: Stage): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  for (const name of [
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'tsconfig.json',
    '.nvmrc',
    '.gitignore',
    'README.md',
  ]) {
    files[name] = await readFile(path.join(projectRoot, name), 'utf8');
  }
  for (const directory of ['src', 'scripts', 'tests']) {
    for (const name of (
      await readdir(path.join(projectRoot, directory))
    ).sort()) {
      if (maintenance.has(name)) continue;
      files[`${directory}/${name}`] = await readFile(
        path.join(projectRoot, directory, name),
        'utf8',
      );
    }
  }
  const step =
    stage === 'starter'
      ? 0
      : stage === 'completed'
        ? 6
        : Number(stage.slice(-1));
  const edits = [
    [
      3,
      'src/app.ts',
      "import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';\nimport type { BatchOptions } from './thumbnails.ts';\nimport type { TaskWorker } from './task-worker.ts';\nexport function createApp(_options: BatchOptions, _worker?: TaskWorker) {\n  return createMcpHandler(() => new McpServer({ name: 'thumbnail-server', version: '1.0.0' }), { legacy: 'reject' });\n}\n",
    ],
    [
      3,
      'src/task-handlers.ts',
      "import type { McpServer } from '@modelcontextprotocol/server';\nimport type { TaskWorker } from './task-worker.ts';\n// TODO: register the Tasks handlers in step 3.\nexport function registerTaskHandlers(_server: McpServer, _worker: TaskWorker) {}\n",
    ],
    [
      4,
      'scripts/tasks-client.ts',
      "throw new Error('TODO: write your MCP Tasks client in step 4.');\nexport {};\n",
    ],
    [
      4,
      'src/watch-task.ts',
      "import type { CallToolResultV2 } from '@modelcontextprotocol/ext-tasks/core/v2';\nimport type { Connection } from './connection.ts';\nexport async function watchTask(_connection: Connection, _taskId: string, _log = console.log): Promise<CallToolResultV2 | undefined> {\n  throw new Error('TODO: implement task polling in step 4.');\n}\n",
    ],
  ] as const;
  for (const [introduced, name, scaffold] of edits)
    if (step < introduced) files[name] = scaffold;
  const packageJson = JSON.parse(files['package.json']!);
  for (const name of ['package', 'checkpoints', 'snippets'])
    delete packageJson.scripts[name];
  files['package.json'] = JSON.stringify(packageJson, null, 2) + '\n';
  const next =
    stage === 'starter'
      ? 'Use this starter in step 2 of the ATM Guide.'
      : stage === 'completed'
        ? 'You have the completed project for all six Guide steps.'
        : `Continue at step ${step + 1} of the ATM Guide.`;
  const description =
    stage === 'starter'
      ? 'This is the starter project for step 2.'
      : `This project contains the code at the end of step ${step}.`;
  files['CHECKPOINT.md'] =
    `# ${stage}\n\n${description}\nRun pnpm install --frozen-lockfile, then pnpm run fixtures.\n${next}\nGenerated images and task records are not included.\n`;
  return Object.fromEntries(
    Object.entries(files).sort(([a], [b]) => a.localeCompare(b)),
  );
}
