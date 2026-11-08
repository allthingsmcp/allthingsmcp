import { createServer } from 'node:http';
import { parseArgs } from 'node:util';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { taskRoot } from './config.ts';
import { createApp } from './app.ts';
import { TaskStore } from './task-store.ts';
import { TaskWorker } from './task-worker.ts';

const { values } = parseArgs({
  options: {
    ordinary: { type: 'boolean', default: false },
    port: { type: 'string', default: '3001' },
    'demo-delay-ms': { type: 'string', default: '0' },
  },
});
const port = Number(values.port);
const demoDelayMs = Number(values['demo-delay-ms']);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error('Port must be an integer from 1024 to 65535.');
if (!Number.isInteger(demoDelayMs) || demoDelayMs < 0 || demoDelayMs > 5000)
  throw new Error('Demo delay must be 0–5000 ms.');
const store = new TaskStore(taskRoot);
await store.initialize();
const worker = new TaskWorker(store, { demoDelayMs });
const app = createApp({ demoDelayMs }, values.ordinary ? undefined : worker);
const handler = toNodeHandler(app);
const server = createServer((req, res) => {
  if (req.url !== '/mcp') {
    res.writeHead(404).end();
    return;
  }
  if (
    req.headers.origin ||
    ![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host ?? '')
  ) {
    res.writeHead(403).end();
    return;
  }
  void handler(req, res).catch((error: unknown) => {
    console.error(error);
    if (!res.headersSent) res.writeHead(500);
    res.end();
  });
});
server.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`MCP server: http://127.0.0.1:${port}/mcp`);
  console.log(`Mode: ${values.ordinary ? 'ordinary tool calls' : 'MCP Tasks'}`);
  if (demoDelayMs)
    console.log(
      `Teaching delay: ${demoDelayMs} ms between outputs (not processing time).`,
    );
});
