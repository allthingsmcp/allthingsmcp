import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ProtocolError } from '@modelcontextprotocol/server';
import {
  DetailedTaskV2Schema,
  type DetailedTaskV2,
} from '@modelcontextprotocol/ext-tasks/core/v2';
import { z } from 'zod';

type Record = { task: DetailedTaskV2; cancelRequested: boolean };
const recordSchema = z.object({
  task: DetailedTaskV2Schema,
  cancelRequested: z.boolean(),
});

// Sample helper, not an MCP SDK API. A single server process owns this store.
export class TaskStore {
  private locks = new Map<string, Promise<void>>();
  constructor(
    readonly directory: string,
    readonly ttlMs = 3_600_000,
    readonly pollIntervalMs = 500,
  ) {}

  private filename(id: string) {
    if (!z.uuid().safeParse(id).success)
      throw new ProtocolError(-32602, 'Task not found or expired.');
    return path.join(this.directory, `${id}.json`);
  }
  private async read(id: string): Promise<Record> {
    try {
      return recordSchema.parse(
        JSON.parse(await readFile(this.filename(id), 'utf8')),
      );
    } catch (error) {
      if (error instanceof ProtocolError) throw error;
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        throw new ProtocolError(-32602, 'Task not found or expired.');
      throw error;
    }
  }
  private async write(record: Record) {
    const target = this.filename(record.task.taskId);
    const temporary = `${target}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(record), { mode: 0o600 });
    await rename(temporary, target);
  }
  private async locked<T>(id: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(id) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.locks.set(id, current);
    await previous;
    try {
      return await operation();
    } finally {
      release();
      if (this.locks.get(id) === current) this.locks.delete(id);
    }
  }
  async initialize() {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    for (const name of await readdir(this.directory)) {
      if (!name.endsWith('.json')) continue;
      const id = name.slice(0, -5);
      await this.update(id, (record) => {
        if (
          record.task.status === 'working' ||
          record.task.status === 'input_required'
        ) {
          record.task = {
            ...record.task,
            status: 'failed',
            statusMessage: 'Server restarted; start a new batch.',
            error: {
              code: -32603,
              message: 'Server restarted before the task finished.',
            },
          };
        }
      });
    }
  }
  async create() {
    const now = new Date().toISOString();
    const task: DetailedTaskV2 = {
      taskId: randomUUID(),
      status: 'working',
      statusMessage: 'Starting the image batch.',
      createdAt: now,
      lastUpdatedAt: now,
      ttlMs: this.ttlMs,
      pollIntervalMs: this.pollIntervalMs,
    };
    await this.write({ task, cancelRequested: false });
    return task;
  }
  async get(id: string) {
    const { task } = await this.read(id);
    if (
      task.ttlMs !== null &&
      Date.now() >= Date.parse(task.createdAt) + task.ttlMs
    )
      throw new ProtocolError(-32602, 'Task not found or expired.');
    return task;
  }
  async update(id: string, change: (record: Record) => void) {
    return this.locked(id, async () => {
      const record = await this.read(id);
      change(record);
      record.task.lastUpdatedAt = new Date().toISOString();
      DetailedTaskV2Schema.parse(record.task);
      await this.write(record);
      return record.task;
    });
  }
  async cancel(id: string) {
    await this.get(id);
    await this.update(id, (record) => {
      if (record.task.status === 'working') record.cancelRequested = true;
    });
  }
  async cancellationRequested(id: string) {
    return (await this.read(id)).cancelRequested;
  }
}
