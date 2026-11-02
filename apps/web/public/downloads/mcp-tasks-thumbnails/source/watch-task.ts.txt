import { setTimeout as delay } from 'node:timers/promises';
import { CallToolResultV2Schema } from '@modelcontextprotocol/ext-tasks/core/v2';
import type { Connection } from './connection.ts';

export async function watchTask(
  connection: Connection,
  taskId: string,
  log = console.log,
) {
  const deadline = Date.now() + 120_000;
  let previous = '';
  while (Date.now() < deadline) {
    const task = await connection.getTask(taskId);
    const message = `${task.status}: ${task.statusMessage ?? ''}`;
    if (message !== previous) log(message);
    previous = message;
    if (task.status === 'completed')
      return CallToolResultV2Schema.parse(task.result);
    if (task.status === 'cancelled') return undefined;
    if (task.status === 'failed') throw new Error(task.error.message);
    if (task.status === 'input_required')
      throw new Error(
        'This example does not handle requests for additional input.',
      );
    await delay(Math.max(100, task.pollIntervalMs ?? 500));
  }
  throw new Error(
    'Stopped waiting after two minutes; the server may still be working. Run the watch command again.',
  );
}
