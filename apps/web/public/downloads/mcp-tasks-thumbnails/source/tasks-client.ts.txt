import { connect } from '../src/connection.ts';
import { sampleInput } from '../src/config.ts';
import { watchTask } from '../src/watch-task.ts';
import { z } from 'zod';

const capabilities = {
  extensions: { 'io.modelcontextprotocol/tasks': {} },
};
const connection = await connect(process.argv[2], capabilities);

try {
  const response = await connection.callTool(sampleInput);
  let result;
  if (response.resultType === 'task') {
    console.log(`Task ID: ${response.taskId}`);
    result = await watchTask(connection, response.taskId);
  } else {
    result = response;
  }
  if (result) {
    const output = z
      .object({
        content: z.array(
          z.object({ type: z.literal('text'), text: z.string() }),
        ),
        isError: z.boolean().optional(),
      })
      .parse(result);
    for (const item of output.content) {
      if (item.type === 'text') console.log(item.text);
    }
    if (output.isError) process.exitCode = 1;
  }
} finally {
  await connection.close();
}
