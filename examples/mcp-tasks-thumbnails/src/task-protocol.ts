// Supplied validation for the current Tasks extension. These are project
// helpers built from official V2 schemas, not new MCP SDK APIs.
import {
  ProtocolError,
  type ServerContext,
} from '@modelcontextprotocol/server';
import {
  CallToolResultV2Schema,
  CreateTaskResultV2Schema,
  GetTaskResultV2Schema,
  CancelTaskResultV2Schema,
  hasTaskClientCapabilityV2,
} from '@modelcontextprotocol/ext-tasks/core/v2';
import { z } from 'zod';
import { sampleInput, tasksExtension, thumbnailInput } from './config.ts';

const taskParams = z.object({
  taskId: z.string(),
  _meta: z.record(z.string(), z.unknown()).optional(),
});
export const callSchema = {
  params: z.object({
    name: z.literal('create_thumbnails'),
    arguments: thumbnailInput.default(sampleInput),
    _meta: z.record(z.string(), z.unknown()).optional(),
  }),
  result: z.union([CreateTaskResultV2Schema, CallToolResultV2Schema]),
};
export const getSchema = { params: taskParams, result: GetTaskResultV2Schema };
export const cancelSchema = {
  params: taskParams,
  result: CancelTaskResultV2Schema,
};

export function supportsTasks(context: ServerContext) {
  // SDK v2 moves reserved request metadata from params to the envelope.
  return hasTaskClientCapabilityV2({ _meta: context.mcpReq.envelope });
}
export function requireTasks(context: ServerContext) {
  if (!supportsTasks(context))
    throw new ProtocolError(
      -32021,
      'This request requires MCP Tasks support.',
      {
        requiredCapabilities: { extensions: { [tasksExtension]: {} } },
      },
    );
}
