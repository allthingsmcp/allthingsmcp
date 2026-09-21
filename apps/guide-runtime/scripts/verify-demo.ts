import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { Pool } from "pg";
import { weatherTemplate } from "@all-things-mcp/mcp-templates";
import {
  CLIENT_CAPABILITIES_META_KEY,
  CLIENT_INFO_META_KEY,
  PROTOCOL_VERSION_META_KEY,
} from "@modelcontextprotocol/server";
import type { McpWorkspace, McpProtocolEvent } from "@all-things-mcp/contracts";

// Run against local servers with the real configured database and Open-Meteo.
// Credentials stay in memory; only the isolated workspace created here is removed.
const runtime = process.env.GUIDE_RUNTIME_PUBLIC_URL ?? "http://localhost:8787";
const web = process.env.DEMO_WEB_URL ?? "http://localhost:3000";
const secret = process.env.GUIDE_RUNTIME_SHARED_SECRET;
assert(secret, "GUIDE_RUNTIME_SHARED_SECRET is required.");
assert(
  process.env.DATABASE_URL,
  "Use the configured Supabase database for this check.",
);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10_000,
});
const owner = `demo-check-${randomUUID()}`;
let id: string | undefined;
let token: string;
const jwt = () =>
  new SignJWT({
    name: "Demo verification",
    email: "demo-check@example.invalid",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("all-things-mcp-web")
    .setAudience("all-things-mcp-guide-runtime")
    .setSubject(owner)
    .setIssuedAt()
    .setExpirationTime("120s")
    .sign(new TextEncoder().encode(secret));
const guide = weatherTemplate.guideSlug;
const ownerPath = `/v1/mcp-workspaces/${guide}`;

async function request(path: string, method = "GET", body?: unknown) {
  const response = await fetch(`${runtime}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30_000),
  });
  if (response.status === 204) return null;
  const value = (await response.json()) as Record<string, unknown>;
  assert(
    response.ok,
    `${method} ${path}: ${response.status} ${value.error ?? ""}`,
  );
  return value;
}

async function external(endpoint: string, bearer: string) {
  return fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${bearer}`,
      "content-type": "application/json",
      "mcp-protocol-version": "2026-07-28",
      "mcp-method": "tools/list",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {
        _meta: {
          [PROTOCOL_VERSION_META_KEY]: "2026-07-28",
          [CLIENT_INFO_META_KEY]: {
            name: "demo-external-client",
            version: "1.0.0",
          },
          [CLIENT_CAPABILITIES_META_KEY]: {},
        },
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });
}

try {
  token = await jwt();
  const created = await fetch(`${web}/api/mcp-workspaces/${guide}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      guideSlug: guide,
      templateId: weatherTemplate.id,
      configuration: {
        serverName: "demo-verification",
        enabledCapabilityIds: [],
      },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  assert(
    created.headers.get("content-type")?.includes("application/json"),
    `Web server returned ${created.status} instead of JSON. Restart pnpm dev:web to load its API routes.`,
  );
  const session = (await created.json()) as {
    workspace: McpWorkspace;
    temporaryCredential: string;
    error?: string;
  };
  assert.equal(created.status, 201, session.error);
  id = session.workspace.id;
  assert(
    session.temporaryCredential,
    "BFF must issue a temporary workspace credential.",
  );
  console.log("PASS: browser API creates a real anonymous workspace.");

  const claimed = (await request(`${ownerPath}/claim`, "POST", {
    workspaceId: id,
    temporaryCredential: session.temporaryCredential,
  })) as { workspace: McpWorkspace };
  assert.equal(claimed.workspace.anonymous, false);
  const saved = (await request(ownerPath, "PUT", {
    expectedRevision: claimed.workspace.revision,
    configuration: {
      serverName: "demo-verification",
      enabledCapabilityIds: weatherTemplate.capabilities.map(
        (capability) => capability.id,
      ),
    },
  })) as { workspace: McpWorkspace };
  assert(saved.workspace.revision > claimed.workspace.revision);
  console.log(
    "PASS: sign-in claim and revision-controlled configuration persist.",
  );

  const commands = [
    { type: "discover" },
    {
      type: "call-tool",
      name: "get_weather",
      arguments: { location: "Lagos", unit: "celsius" },
    },
    {
      type: "call-tool",
      name: "get_forecast",
      arguments: { location: "London" },
    },
    {
      type: "call-tool",
      name: "search_locations",
      arguments: { query: "Lagos" },
    },
    ...weatherTemplate.capabilities
      .filter((capability) => capability.kind === "resource")
      .map((capability) => ({ type: "read-resource", uri: capability.uri })),
    {
      type: "get-prompt",
      name: "plan_for_weather",
      arguments: { city: "Lagos", day: "Monday" },
    },
  ];
  for (const command of commands) {
    const response = (await request(
      `${ownerPath}/commands`,
      "POST",
      command,
    )) as {
      result: { error?: unknown; result?: { isError?: boolean } };
      events: McpProtocolEvent[];
    };
    assert(
      !response.result.error && !response.result.result?.isError,
      `MCP ${command.type} failed.`,
    );
    assert(
      response.events.length > 0 &&
        response.events.every((event) => event.status !== "error"),
    );
    if (command.type === "call-tool")
      assert(
        JSON.stringify(response.result).includes("open-meteo.com"),
        "Provider attribution must be present.",
      );
    console.log(
      `PASS: ${command.type}${"name" in command ? ` ${command.name}` : ""}.`,
    );
  }
  const reloaded = (await request(ownerPath)) as {
    workspace: McpWorkspace;
    events: McpProtocolEvent[];
  };
  assert.equal(reloaded.workspace.id, id);
  assert(
    reloaded.events.some((event) => event.method === "tools/call"),
    "Reload must return owner traces.",
  );
  console.log("PASS: workspace and protocol history survive reload.");

  const progressPath = `/v1/guide-runs/${guide}`;
  await request(progressPath, "PUT", {
    progress: {
      version: 1,
      completedStepIds: [
        "create-your-server",
        "add-tools",
        "connect-the-atm-client",
        "test-your-server",
      ],
      percent: 50,
      updatedAt: new Date().toISOString(),
    },
  });
  const progress = (await request(progressPath)) as {
    progress: { completedStepIds: string[] };
  };
  assert(progress.progress.completedStepIds.includes("test-your-server"));
  console.log("PASS: signed-in Guide progress persists in Supabase.");

  const access = (await request(`${ownerPath}/token`, "POST")) as {
    token: string;
    endpoint: string;
  };
  const accepted = await external(access.endpoint, access.token);
  assert.equal(accepted.status, 200);
  const responseBody = (await accepted.json()) as {
    result?: { tools?: unknown[] };
  };
  assert.equal(responseBody.result?.tools?.length, 3);
  const afterExternal = (await request(ownerPath)) as {
    events: McpProtocolEvent[];
  };
  assert.equal(
    afterExternal.events.length,
    reloaded.events.length,
    "External payloads must not be retained.",
  );

  await request(`${ownerPath}/status`, "POST", { status: "paused" });
  assert.notEqual((await external(access.endpoint, access.token)).status, 200);
  await request(`${ownerPath}/status`, "POST", { status: "active" });
  assert.equal((await external(access.endpoint, access.token)).status, 200);
  await request(`${ownerPath}/token`, "DELETE");
  assert.equal((await external(access.endpoint, access.token)).status, 401);
  console.log(
    "PASS: external access, trace privacy, pause/resume, and revocation.",
  );
} finally {
  if (id)
    await pool.query(
      "delete from mcp_workspaces where id=$1 and (owner_user_id=$2 or owner_user_id is null)",
      [id, owner],
    );
  await pool.query("delete from guide_runs where user_id=$1", [owner]);
  await pool.end();
}
