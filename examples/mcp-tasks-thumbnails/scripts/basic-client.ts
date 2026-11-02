import { z } from 'zod';
import { connect } from '../src/connection.ts';
import { sampleInput } from '../src/config.ts';

const connection = await connect(process.argv[2]);
try {
  const result = await connection.client.callTool({
    name: 'create_thumbnails',
    arguments: sampleInput,
  });
  const textResult = z
    .object({
      content: z.array(z.object({ type: z.literal('text'), text: z.string() })),
    })
    .parse(result);
  for (const item of textResult.content) console.log(item.text);
  if (result.isError) process.exitCode = 1;
} finally {
  await connection.close();
}
