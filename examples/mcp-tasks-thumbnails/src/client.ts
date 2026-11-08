import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { CallToolResultV2Schema } from '@modelcontextprotocol/ext-tasks/core/v2';
import { z } from 'zod';
import { connect } from './connection.ts';
import { outputRoot, thumbnailInput } from './config.ts';
import { watchTask } from './watch-task.ts';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    url: { type: 'string', default: 'http://127.0.0.1:3001/mcp' },
    images: { type: 'string' },
    widths: { type: 'string' },
    detach: { type: 'boolean', default: false },
  },
});
const [command = 'inspect', taskReference = 'last'] = positionals;
const referenceFile = path.join(outputRoot, 'last-task.json');

async function main() {
  const connection = await connect(values.url);
  try {
    if (command === 'inspect') {
      const result = await connection.client.listTools();
      console.log(`Connected: ${connection.client.getServerVersion()?.name}`);
      console.log(`Tools: ${result.tools.map((tool) => tool.name).join(', ')}`);
      return;
    }
    let result;
    if (command === 'run') {
      const input = thumbnailInput.parse({
        images: values.images?.split(','),
        widths: values.widths?.split(',').map(Number),
      });
      const response = await connection.callTool(input);
      if (response.resultType === 'task') {
        console.log(`Task ID: ${response.taskId}`);
        await mkdir(outputRoot, { recursive: true });
        await writeFile(
          referenceFile,
          JSON.stringify({ url: values.url, taskId: response.taskId }),
          { mode: 0o600 },
        );
        if (values.detach) {
          console.log('Detached. Run: pnpm run client watch last');
          return;
        }
        result = await watchTask(connection, response.taskId);
      } else {
        result = response;
      }
    } else if (command === 'watch' || command === 'cancel') {
      const saved =
        taskReference === 'last'
          ? (JSON.parse(await readFile(referenceFile, 'utf8')) as {
              url: string;
              taskId: string;
            })
          : { url: values.url, taskId: taskReference };
      if (saved.url !== values.url)
        throw new Error(
          'Saved task belongs to another server URL. Pass its --url.',
        );
      if (command === 'cancel') {
        await connection.cancelTask(saved.taskId);
        console.log('Cancellation requested. Checking the actual outcome…');
      }
      result = await watchTask(connection, saved.taskId);
    } else {
      throw new Error('Use inspect, run, watch, or cancel.');
    }
    if (result) {
      const toolResult = CallToolResultV2Schema.parse(result);
      const textResult = z
        .object({
          content: z.array(
            z.object({ type: z.literal('text'), text: z.string() }),
          ),
        })
        .parse(toolResult);
      for (const item of textResult.content) console.log(item.text);
      if (toolResult.isError) process.exitCode = 1;
    }
  } finally {
    await connection.close();
  }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
