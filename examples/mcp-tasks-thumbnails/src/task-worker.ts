import { type ThumbnailInput } from './config.ts';
import {
  BatchCancelled,
  createThumbnails,
  type BatchOptions,
} from './thumbnails.ts';
import { TaskStore } from './task-store.ts';

// Lives outside the SDK's per-request server, so finishing a response does not
// cancel the image work. This is a local single-process worker, not a queue.
export class TaskWorker {
  private running = new Set<Promise<void>>();
  constructor(
    readonly store: TaskStore,
    readonly options: BatchOptions = {},
  ) {}
  async start(input: ThumbnailInput) {
    const task = await this.store.create();
    const job = new Promise<void>((resolve) => setImmediate(resolve)).then(() =>
      this.run(task.taskId, input),
    );
    this.running.add(job);
    void job.finally(() => this.running.delete(job)).catch(console.error);
    return { resultType: 'task' as const, ...task };
  }
  async drain() {
    await Promise.all(this.running);
  }
  private async run(id: string, input: ThumbnailInput) {
    try {
      const result = await createThumbnails(input, {
        ...this.options,
        isCancelled: () => this.store.cancellationRequested(id),
        onProgress: async (done, total) => {
          await this.store.update(id, (record) => {
            record.task.statusMessage = `Created ${done} of ${total} thumbnails.`;
          });
        },
      });
      await this.store.update(id, (record) => {
        record.task = record.cancelRequested
          ? {
              ...record.task,
              status: 'cancelled',
              statusMessage: 'Cancelled; completed files remain in output.',
            }
          : {
              ...record.task,
              status: 'completed',
              statusMessage: result.isError
                ? 'Batch returned a tool error.'
                : 'All thumbnails are ready.',
              result,
            };
      });
    } catch (error) {
      await this.store.update(id, (record) => {
        record.task =
          error instanceof BatchCancelled
            ? {
                ...record.task,
                status: 'cancelled',
                statusMessage: 'Cancelled; completed files remain in output.',
              }
            : {
                ...record.task,
                status: 'failed',
                statusMessage: 'Task execution failed.',
                error: {
                  code: -32603,
                  message:
                    error instanceof Error ? error.message : String(error),
                },
              };
      });
    }
  }
}
