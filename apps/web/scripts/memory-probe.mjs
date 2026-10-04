// Loaded only by check-memory.mjs into its own child. No HTTP debug endpoint.
import inspector from 'node:inspector';

if (!process.send)
  throw new Error('The memory probe requires the smoke-test IPC channel');
const session = new inspector.Session();
session.connect(); // In-process inspector session; does not open a debugging port.
const peak = { heapUsed: 0, rss: 0 };
function observe() {
  const memory = process.memoryUsage();
  peak.heapUsed = Math.max(peak.heapUsed, memory.heapUsed);
  peak.rss = Math.max(peak.rss, memory.rss);
  return memory;
}
const interval = setInterval(observe, 250);
interval.unref();
process.on('message', async (message) => {
  if (message?.type !== 'atm-memory-sample' || !Number.isInteger(message.id))
    return;
  try {
    observe();
    await new Promise((resolve, reject) =>
      session.post('HeapProfiler.collectGarbage', (error) =>
        error ? reject(error) : resolve(),
      ),
    );
    if (process.connected)
      process.send(
        { type: 'atm-memory-sample', id: message.id, memory: observe(), peak },
        () => {},
      );
  } catch {
    if (process.connected)
      process.send(
        {
          type: 'atm-memory-sample',
          id: message.id,
          error: 'Unable to collect post-GC memory sample',
        },
        () => {},
      );
  }
});
process.once('disconnect', () => {
  clearInterval(interval);
  session.disconnect();
});
