import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type {
  GuideRun,
  UpsertGuideRunRequest,
} from "@all-things-mcp/contracts";

export interface GuideRunRepository {
  find(userId: string, guideSlug: string): Promise<GuideRun | null>;
  upsert(
    userId: string,
    guideSlug: string,
    input: UpsertGuideRunRequest,
  ): Promise<GuideRun>;
}

export class GuideRunRevisionConflictError extends Error {}

export class MemoryGuideRunRepository implements GuideRunRepository {
  private readonly records = new Map<string, GuideRun>();

  async find(userId: string, guideSlug: string) {
    return structuredClone(this.records.get(`${userId}:${guideSlug}`) ?? null);
  }

  async upsert(
    userId: string,
    guideSlug: string,
    input: UpsertGuideRunRequest,
  ) {
    const key = `${userId}:${guideSlug}`;
    const current = this.records.get(key);
    if (
      current &&
      input.expectedRevision !== undefined &&
      input.expectedRevision !== current.revision
    ) {
      throw new GuideRunRevisionConflictError(
        "The guide run changed after it was loaded.",
      );
    }

    const now = new Date().toISOString();
    const next: GuideRun = {
      id: current?.id ?? randomUUID(),
      userId,
      guideSlug,
      progress: input.progress,
      simulatorState: input.simulatorState ?? current?.simulatorState ?? null,
      revision: (current?.revision ?? 0) + 1,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
    this.records.set(key, next);
    return structuredClone(next);
  }
}

type GuideRunRow = {
  id: string;
  user_id: string;
  guide_slug: string;
  progress: GuideRun["progress"];
  simulator_state: GuideRun["simulatorState"];
  revision: number;
  created_at: Date;
  updated_at: Date;
};

function fromRow(row: GuideRunRow): GuideRun {
  return {
    id: row.id,
    userId: row.user_id,
    guideSlug: row.guide_slug,
    progress: row.progress,
    simulatorState: row.simulator_state,
    revision: row.revision,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export class PostgresGuideRunRepository implements GuideRunRepository {
  constructor(private readonly pool: Pool) {}

  async find(userId: string, guideSlug: string) {
    const result = await this.pool.query<GuideRunRow>(
      `select id, user_id, guide_slug, progress, simulator_state, revision,
        created_at, updated_at
       from guide_runs where user_id = $1 and guide_slug = $2`,
      [userId, guideSlug],
    );
    return result.rows[0] ? fromRow(result.rows[0]) : null;
  }

  async upsert(
    userId: string,
    guideSlug: string,
    input: UpsertGuideRunRequest,
  ) {
    const result = await this.pool.query<GuideRunRow>(
      `insert into guide_runs (
         id, user_id, guide_slug, progress, simulator_state, revision
       ) values ($1, $2, $3, $4::jsonb, $5::jsonb, 1)
       on conflict (user_id, guide_slug) do update set
         progress = excluded.progress,
         simulator_state = case
           when $7::boolean then excluded.simulator_state
           else guide_runs.simulator_state
         end,
         revision = guide_runs.revision + 1,
         updated_at = now()
       where $6::integer is null or guide_runs.revision = $6
       returning id, user_id, guide_slug, progress, simulator_state, revision,
         created_at, updated_at`,
      [
        randomUUID(),
        userId,
        guideSlug,
        JSON.stringify(input.progress),
        JSON.stringify(input.simulatorState ?? null),
        input.expectedRevision ?? null,
        Object.prototype.hasOwnProperty.call(input, 'simulatorState'),
      ],
    );

    const row = result.rows[0];
    if (!row) {
      throw new GuideRunRevisionConflictError(
        "The guide run changed after it was loaded.",
      );
    }
    return fromRow(row);
  }
}
