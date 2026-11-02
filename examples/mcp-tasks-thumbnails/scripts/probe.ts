import { connect } from '../src/connection.ts';
import { sampleInput } from '../src/config.ts';
const connection = await connect(process.argv[2]);
try {
  const response = await connection.callTool(sampleInput);
  if (response.resultType !== 'task')
    throw new Error('Restart the server without --ordinary to enable Tasks.');
  console.log(`Task handle received: ${response.taskId}`);
  const task = await connection.getTask(response.taskId);
  console.log(`Task is readable: ${task.status}`);
  console.log('The server continues working after this probe exits.');
} finally {
  await connection.close();
}
