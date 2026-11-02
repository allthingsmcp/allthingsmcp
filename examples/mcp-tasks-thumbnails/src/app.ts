import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { thumbnailInput } from './config.ts';
import { createThumbnails, type BatchOptions } from './thumbnails.ts';
import { registerTaskHandlers } from './task-handlers.ts';
import { TaskWorker } from './task-worker.ts';

export function createApp(options: BatchOptions, worker?: TaskWorker) {
  return createMcpHandler(
    () => {
      const server = new McpServer({
        name: 'thumbnail-server',
        version: '1.0.0',
      });
      server.registerTool(
        'create_thumbnails',
        {
          description: 'Create WebP thumbnails from local sample images.',
          inputSchema: thumbnailInput,
        },
        (input) => createThumbnails(input, options),
      );
      if (worker) registerTaskHandlers(server, worker);
      return server;
    },
    { legacy: 'reject' },
  );
}
