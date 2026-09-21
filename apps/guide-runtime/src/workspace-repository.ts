import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type {
  McpProtocolEvent,
  McpWorkspace,
  McpWorkspaceConfiguration,
} from "@all-things-mcp/contracts";
import { createOpaqueCredential, hashCredential } from "./credentials.js";

export class WorkspaceRevisionConflictError extends Error {}
export class WorkspaceClaimConflictError extends Error {
  constructor(readonly existing: McpWorkspace) {
    super("An owned workspace already exists for this Guide.");
  }
}

type StoredWorkspace = McpWorkspace & {
  ownerUserId: string | null;
  anonymousCredentialHash: string | null;
};

export interface WorkspaceRepository {
  createAnonymous(input: {
    guideSlug: string;
    templateId: string;
    templateVersion: number;
    configuration: McpWorkspaceConfiguration;
  }): Promise<{ workspace: McpWorkspace; temporaryCredential: string }>;
  findOwned(userId: string, guideSlug: string): Promise<McpWorkspace | null>;
  findByPublicId(publicId: string): Promise<StoredWorkspace | null>;
  findAnonymous(id: string, credential: string): Promise<McpWorkspace | null>;
  update(
    id: string,
    configuration: McpWorkspaceConfiguration,
    expectedRevision: number,
  ): Promise<McpWorkspace>;
  setStatus(id: string, status: "active" | "paused"): Promise<McpWorkspace>;
  claim(
    id: string,
    credential: string,
    userId: string,
    replace: boolean,
  ): Promise<McpWorkspace>;
  issueAccessToken(
    workspaceId: string,
  ): Promise<{ token: string; tokenPrefix: string }>;
  validateAccessToken(workspaceId: string, token: string): Promise<boolean>;
  revokeAccessTokens(workspaceId: string): Promise<void>;
  appendEvents(workspaceId: string, events: McpProtocolEvent[]): Promise<void>;
  listEvents(workspaceId: string): Promise<McpProtocolEvent[]>;
}

function publicWorkspace(value: StoredWorkspace): McpWorkspace {
  const {
    ownerUserId: _owner,
    anonymousCredentialHash: _credential,
    ...workspace
  } = value;
  return structuredClone(workspace);
}

export class MemoryWorkspaceRepository implements WorkspaceRepository {
  private workspaces = new Map<string, StoredWorkspace>();
  private accessTokens = new Map<
    string,
    { workspaceId: string; revoked: boolean }
  >();
  readonly events = new Map<string, McpProtocolEvent[]>();

  async createAnonymous(
    input: Parameters<WorkspaceRepository["createAnonymous"]>[0],
  ) {
    const credential = createOpaqueCredential("atm_tmp");
    const now = new Date();
    const workspace: StoredWorkspace = {
      id: randomUUID(),
      publicId: randomUUID(),
      ownerUserId: null,
      anonymousCredentialHash: credential.hash,
      guideSlug: input.guideSlug,
      templateId: input.templateId,
      templateVersion: input.templateVersion,
      configuration: input.configuration,
      status: "active",
      revision: 1,
      anonymous: true,
      expiresAt: new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.workspaces.set(workspace.id, workspace);
    return {
      workspace: publicWorkspace(workspace),
      temporaryCredential: credential.token,
    };
  }

  async findOwned(userId: string, guideSlug: string) {
    const value = [...this.workspaces.values()].find(
      (item) => item.ownerUserId === userId && item.guideSlug === guideSlug,
    );
    return value ? publicWorkspace(value) : null;
  }

  async findByPublicId(publicId: string) {
    return structuredClone(
      [...this.workspaces.values()].find(
        (item) => item.publicId === publicId,
      ) ?? null,
    );
  }

  async findAnonymous(id: string, credential: string) {
    const value = this.workspaces.get(id);
    if (
      !value ||
      !value.anonymous ||
      value.anonymousCredentialHash !== hashCredential(credential)
    )
      return null;
    if (!value.expiresAt || new Date(value.expiresAt) <= new Date())
      return null;
    return publicWorkspace(value);
  }

  async update(
    id: string,
    configuration: McpWorkspaceConfiguration,
    expectedRevision: number,
  ) {
    const value = this.workspaces.get(id);
    if (!value) throw new Error("Workspace not found.");
    if (value.revision !== expectedRevision)
      throw new WorkspaceRevisionConflictError(
        "Workspace changed after it was loaded.",
      );
    value.configuration = structuredClone(configuration);
    value.revision += 1;
    value.updatedAt = new Date().toISOString();
    this.events.delete(id);
    return publicWorkspace(value);
  }

  async setStatus(id: string, status: "active" | "paused") {
    const value = this.workspaces.get(id);
    if (!value) throw new Error("Workspace not found.");
    value.status = status;
    value.revision += 1;
    value.updatedAt = new Date().toISOString();
    return publicWorkspace(value);
  }

  async claim(
    id: string,
    credential: string,
    userId: string,
    replace: boolean,
  ) {
    const value = this.workspaces.get(id);
    if (!value || !(await this.findAnonymous(id, credential)))
      throw new Error("Temporary workspace is unavailable.");
    const existing = [...this.workspaces.values()].find(
      (item) =>
        item.ownerUserId === userId && item.guideSlug === value.guideSlug,
    );
    if (existing && !replace)
      throw new WorkspaceClaimConflictError(publicWorkspace(existing));
    if (existing) {
      this.workspaces.delete(existing.id);
      this.events.delete(existing.id);
      await this.revokeAccessTokens(existing.id);
    }
    value.ownerUserId = userId;
    value.anonymousCredentialHash = null;
    value.anonymous = false;
    value.expiresAt = null;
    value.revision += 1;
    value.updatedAt = new Date().toISOString();
    return publicWorkspace(value);
  }

  async issueAccessToken(workspaceId: string) {
    await this.revokeAccessTokens(workspaceId);
    const credential = createOpaqueCredential("atm_mcp");
    this.accessTokens.set(credential.hash, { workspaceId, revoked: false });
    return { token: credential.token, tokenPrefix: credential.tokenPrefix };
  }
  async validateAccessToken(workspaceId: string, token: string) {
    const value = this.accessTokens.get(hashCredential(token));
    return value?.workspaceId === workspaceId && !value.revoked;
  }
  async revokeAccessTokens(workspaceId: string) {
    for (const token of this.accessTokens.values())
      if (token.workspaceId === workspaceId) token.revoked = true;
  }
  async appendEvents(workspaceId: string, events: McpProtocolEvent[]) {
    const previous = this.events.get(workspaceId) ?? [];
    const lastSequence = previous.at(-1)?.sequence ?? 0;
    const sequenced = structuredClone(events).map((event, index) => ({
      ...event,
      sequence: lastSequence + index + 1,
    }));
    this.events.set(workspaceId, [...previous, ...sequenced].slice(-100));
  }
  async listEvents(workspaceId: string) {
    return structuredClone(this.events.get(workspaceId) ?? []);
  }
}

type WorkspaceRow = {
  id: string;
  public_id: string;
  owner_user_id: string | null;
  anonymous_credential_hash: string | null;
  guide_slug: string;
  template_id: string;
  template_version: number;
  configuration: McpWorkspaceConfiguration;
  status: "active" | "paused";
  revision: number;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
};
function fromRow(row: WorkspaceRow): StoredWorkspace {
  return {
    id: row.id,
    publicId: row.public_id,
    ownerUserId: row.owner_user_id,
    anonymousCredentialHash: row.anonymous_credential_hash,
    guideSlug: row.guide_slug,
    templateId: row.template_id,
    templateVersion: row.template_version,
    configuration: row.configuration,
    status: row.status,
    revision: row.revision,
    anonymous: !row.owner_user_id,
    expiresAt: row.expires_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export class PostgresWorkspaceRepository implements WorkspaceRepository {
  constructor(private pool: Pool) {}
  async createAnonymous(
    input: Parameters<WorkspaceRepository["createAnonymous"]>[0],
  ) {
    const credential = createOpaqueCredential("atm_tmp");
    const result = await this.pool.query<WorkspaceRow>(
      `insert into mcp_workspaces (id, public_id, anonymous_credential_hash, guide_slug, template_id, template_version, configuration, expires_at)
       values ($1,$2,$3,$4,$5,$6,$7::jsonb,now() + interval '7 days') returning *`,
      [
        randomUUID(),
        randomUUID(),
        credential.hash,
        input.guideSlug,
        input.templateId,
        input.templateVersion,
        JSON.stringify(input.configuration),
      ],
    );
    return {
      workspace: publicWorkspace(fromRow(result.rows[0]!)),
      temporaryCredential: credential.token,
    };
  }
  async findOwned(userId: string, guideSlug: string) {
    const result = await this.pool.query<WorkspaceRow>(
      "select * from mcp_workspaces where owner_user_id=$1 and guide_slug=$2",
      [userId, guideSlug],
    );
    return result.rows[0] ? publicWorkspace(fromRow(result.rows[0])) : null;
  }
  async findByPublicId(publicId: string) {
    const result = await this.pool.query<WorkspaceRow>(
      "select * from mcp_workspaces where public_id=$1",
      [publicId],
    );
    return result.rows[0] ? fromRow(result.rows[0]) : null;
  }
  async findAnonymous(id: string, credential: string) {
    const result = await this.pool.query<WorkspaceRow>(
      "select * from mcp_workspaces where id=$1 and owner_user_id is null and anonymous_credential_hash=$2 and expires_at > now()",
      [id, hashCredential(credential)],
    );
    return result.rows[0] ? publicWorkspace(fromRow(result.rows[0])) : null;
  }
  async update(
    id: string,
    configuration: McpWorkspaceConfiguration,
    expectedRevision: number,
  ) {
    const result = await this.pool.query<WorkspaceRow>(
      "update mcp_workspaces set configuration=$2::jsonb, revision=revision+1, updated_at=now() where id=$1 and revision=$3 returning *",
      [id, JSON.stringify(configuration), expectedRevision],
    );
    if (!result.rows[0])
      throw new WorkspaceRevisionConflictError(
        "Workspace changed after it was loaded.",
      );
    await this.pool.query(
      "delete from mcp_protocol_events where workspace_id=$1",
      [id],
    );
    return publicWorkspace(fromRow(result.rows[0]));
  }
  async setStatus(id: string, status: "active" | "paused") {
    const result = await this.pool.query<WorkspaceRow>(
      "update mcp_workspaces set status=$2, revision=revision+1, updated_at=now() where id=$1 returning *",
      [id, status],
    );
    if (!result.rows[0]) throw new Error("Workspace not found.");
    return publicWorkspace(fromRow(result.rows[0]));
  }
  async claim(
    id: string,
    credential: string,
    userId: string,
    replace: boolean,
  ) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const candidateResult = await client.query<WorkspaceRow>(
        "select * from mcp_workspaces where id=$1 and anonymous_credential_hash=$2 and expires_at > now() for update",
        [id, hashCredential(credential)],
      );
      const candidate = candidateResult.rows[0];
      if (!candidate) throw new Error("Temporary workspace is unavailable.");
      // Serialize claims for an owner/guide even before its first owned row
      // exists, so concurrent create requests cannot violate the unique index.
      await client.query(
        "select pg_advisory_xact_lock(hashtextextended($1, 0))",
        [`${userId}:${candidate.guide_slug}`],
      );
      const existingResult = await client.query<WorkspaceRow>(
        "select * from mcp_workspaces where owner_user_id=$1 and guide_slug=$2 for update",
        [userId, candidate.guide_slug],
      );
      const existing = existingResult.rows[0];
      if (existing && !replace)
        throw new WorkspaceClaimConflictError(
          publicWorkspace(fromRow(existing)),
        );
      if (existing)
        await client.query("delete from mcp_workspaces where id=$1", [
          existing.id,
        ]);
      const claimed = await client.query<WorkspaceRow>(
        "update mcp_workspaces set owner_user_id=$2, anonymous_credential_hash=null, expires_at=null, revision=revision+1, updated_at=now() where id=$1 returning *",
        [id, userId],
      );
      await client.query("commit");
      return publicWorkspace(fromRow(claimed.rows[0]!));
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
  async issueAccessToken(workspaceId: string) {
    const credential = createOpaqueCredential("atm_mcp");
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      await client.query(
        "select id from mcp_workspaces where id=$1 for update",
        [workspaceId],
      );
      await client.query(
        "update mcp_access_tokens set revoked_at=now() where workspace_id=$1 and revoked_at is null",
        [workspaceId],
      );
      await client.query(
        "insert into mcp_access_tokens (id, workspace_id, token_hash, token_prefix) values ($1,$2,$3,$4)",
        [randomUUID(), workspaceId, credential.hash, credential.tokenPrefix],
      );
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
    return { token: credential.token, tokenPrefix: credential.tokenPrefix };
  }
  async validateAccessToken(workspaceId: string, token: string) {
    const result = await this.pool.query(
      `update mcp_access_tokens set last_used_at=now() where workspace_id=$1 and token_hash=$2 and revoked_at is null returning id`,
      [workspaceId, hashCredential(token)],
    );
    return result.rowCount === 1;
  }
  async revokeAccessTokens(workspaceId: string) {
    await this.pool.query(
      "update mcp_access_tokens set revoked_at=now() where workspace_id=$1 and revoked_at is null",
      [workspaceId],
    );
  }
  async appendEvents(workspaceId: string, events: McpProtocolEvent[]) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      await client.query(
        "select id from mcp_workspaces where id=$1 for update",
        [workspaceId],
      );
      const last = await client.query<{ sequence: number }>(
        "select coalesce(max(sequence), 0) as sequence from mcp_protocol_events where workspace_id=$1",
        [workspaceId],
      );
      let sequence = Number(last.rows[0]?.sequence ?? 0);
      for (const event of events) {
        await client.query(
          `insert into mcp_protocol_events (id,workspace_id,sequence,method,status,request,response,duration_ms,created_at)
         values ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9)`,
          [
            event.id,
            workspaceId,
            ++sequence,
            event.method,
            event.status,
            JSON.stringify(event.request),
            JSON.stringify(event.response),
            Math.round(event.durationMs),
            event.createdAt,
          ],
        );
      }
      await client.query(
        `delete from mcp_protocol_events where workspace_id=$1 and id not in
       (select id from mcp_protocol_events where workspace_id=$1 order by sequence desc limit 100)`,
        [workspaceId],
      );
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
  async listEvents(workspaceId: string): Promise<McpProtocolEvent[]> {
    const result = await this.pool.query<{
      id: string;
      sequence: number;
      method: string;
      status: McpProtocolEvent["status"];
      request: Record<string, unknown>;
      response: Record<string, unknown>;
      duration_ms: number;
      created_at: Date;
    }>(
      "select * from mcp_protocol_events where workspace_id=$1 order by sequence asc limit 100",
      [workspaceId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      sequence: row.sequence,
      method: row.method,
      status: row.status,
      request: row.request,
      response: row.response,
      durationMs: row.duration_ms,
      createdAt: row.created_at.toISOString(),
    }));
  }
}
