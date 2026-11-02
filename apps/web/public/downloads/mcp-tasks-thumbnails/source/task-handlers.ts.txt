import type { McpServer } from '@modelcontextprotocol/server';
import { tasksExtension } from './config.ts';
import { createThumbnails } from './thumbnails.ts';
import type { TaskWorker } from './task-worker.ts';
import {
  callSchema,
  getSchema,
  cancelSchema,
  supportsTasks,
  requireTasks,
} from './task-protocol.ts';

export function registerTaskHandlers(server: McpServer, worker: TaskWorker) {
  const protocol = server.server;
  protocol.registerCapabilities({ extensions: { [tasksExtension]: {} } });

  protocol.setRequestHandler('tools/call', callSchema, (params, context) => {
    return supportsTasks(context)
      ? worker.start(params.arguments)
      : createThumbnails(params.arguments, worker.options);
  });

  protocol.setRequestHandler(
    'tasks/get',
    getSchema,
    async (params, context) => {
      requireTasks(context);
      return {
        resultType: 'complete' as const,
        ...(await worker.store.get(params.taskId)),
      };
    },
  );

  protocol.setRequestHandler(
    'tasks/cancel',
    cancelSchema,
    async (params, context) => {
      requireTasks(context);
      await worker.store.cancel(params.taskId);
      return { resultType: 'complete' as const };
    },
  );
}
