import { createHmac } from 'node:crypto';

type Window = { count: number; expiresAt: number };
export class RequestLimiter {
  private windows = new Map<string, Window>();
  constructor(private secret: string) {}

  private consume(key: string, limit: number, durationMs: number) {
    const now = Date.now();
    const current = this.windows.get(key);
    const window = !current || current.expiresAt <= now ? { count: 0, expiresAt: now + durationMs } : current;
    if (window.count >= limit) return false;
    window.count += 1;
    this.windows.set(key, window);
    return true;
  }

  check(workspaceId: string, ip: string) {
    const now = Date.now();
    for (const [key, window] of this.windows) if (window.expiresAt <= now) this.windows.delete(key);
    const ipHash = createHmac('sha256', this.secret).update(ip).digest('hex');
    const perIp = Number(process.env.MCP_REQUESTS_PER_IP_MINUTE ?? 30);
    const perWorkspace = Number(process.env.MCP_REQUESTS_PER_WORKSPACE_HOUR ?? 120);
    return this.consume(`ip:${ipHash}`, perIp, 60_000) &&
      this.consume(`workspace:${workspaceId}`, perWorkspace, 60 * 60_000);
  }
}
