import { SignJWT } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CLIENT_CAPABILITIES_META_KEY,
  CLIENT_INFO_META_KEY,
  PROTOCOL_VERSION_META_KEY,
} from "@modelcontextprotocol/server";
import { weatherTemplate } from "@all-things-mcp/mcp-templates";
import type { McpProtocolEvent, McpWorkspace } from "@all-things-mcp/contracts";
import { createGuideRuntimeApp } from "../src/app.js";
import { runtimeTokenAudience, runtimeTokenIssuer } from "../src/auth.js";
import { MemoryGuideRunRepository } from "../src/repository.js";
import { MemoryWorkspaceRepository } from "../src/workspace-repository.js";
import { OpenMeteoProvider } from "../src/weather.js";

const secret = "test-guide-runtime-shared-secret-32-chars";
const guide = weatherTemplate.guideSlug;
const ownedPath = `/v1/mcp-workspaces/${guide}`;
const configuration = {
  serverName: "demo-weather",
  enabledCapabilityIds: weatherTemplate.capabilities.map(
    (capability) => capability.id,
  ),
};
const createBody = {
  guideSlug: guide,
  templateId: weatherTemplate.id,
  configuration,
};

function providerFixture() {
  return vi.fn(async (input: string | URL | Request) => {
    const url = new URL(String(input));
    return url.hostname.startsWith("geocoding")
      ? Response.json({
          results: [
            {
              name: "Lagos",
              country: "Nigeria",
              latitude: 6.45,
              longitude: 3.39,
              timezone: "Africa/Lagos",
            },
          ],
        })
      : Response.json({
          current: {
            temperature_2m: 30,
            apparent_temperature: 34,
            weather_code: 1,
            wind_speed_10m: 10,
          },
          current_units: { temperature_2m: "°C", wind_speed_10m: "km/h" },
          daily: {
            time: ["2026-09-21"],
            temperature_2m_max: [31],
            temperature_2m_min: [24],
          },
          daily_units: { temperature_2m_max: "°C" },
        });
  });
}

function setup(fetcher: typeof fetch = providerFixture() as typeof fetch) {
  const workspaceRepository = new MemoryWorkspaceRepository();
  const app = createGuideRuntimeApp({
    repository: new MemoryGuideRunRepository(),
    workspaceRepository,
    sharedSecret: secret,
    weather: new OpenMeteoProvider(fetcher),
  });
  return { app, workspaceRepository };
}

async function auth(user = "owner-a") {
  const token = await new SignJWT({
    name: "Demo reader",
    email: "demo@example.com",
    image: null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user)
    .setIssuer(runtimeTokenIssuer)
    .setAudience(runtimeTokenAudience)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(secret));
  return `Bearer ${token}`;
}

const json = (
  body: unknown,
  authorization?: string,
  method = "POST",
): RequestInit => ({
  method,
  headers: {
    "content-type": "application/json",
    ...(authorization ? { authorization } : {}),
  },
  body: JSON.stringify(body),
});

function protocol(
  method: string,
  params: Record<string, unknown>,
  token: string,
): RequestInit {
  return {
    method: "POST",
    headers: {
      authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      "content-type": "application/json",
      "mcp-protocol-version": "2026-07-28",
      "mcp-method": method,
      ...(typeof params.name === "string" ? { "mcp-name": params.name } : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params: {
        ...params,
        _meta: {
          [PROTOCOL_VERSION_META_KEY]: "2026-07-28",
          [CLIENT_INFO_META_KEY]: {
            name: "external-demo-client",
            version: "1.0.0",
          },
          [CLIENT_CAPABILITIES_META_KEY]: {},
        },
      },
    }),
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("real MCP guide HTTP flow", () => {
  it("creates an empty anonymous server, saves capabilities, and completes every real MCP operation", async () => {
    const fetcher = providerFixture();
    const { app } = setup(fetcher as typeof fetch);
    const created = await app.request(
      "/anonymous/workspaces",
      json({
        ...createBody,
        configuration: { ...configuration, enabledCapabilityIds: [] },
      }),
    );
    expect(created.status).toBe(201);
    const session = (await created.json()) as {
      workspace: McpWorkspace;
      temporaryCredential: string;
    };
    expect(session.workspace).not.toHaveProperty("anonymousCredentialHash");
    expect(session.workspace).not.toHaveProperty("ownerUserId");
    const path = `/anonymous/workspaces/${session.workspace.id}`;
    const bearer = `Bearer ${session.temporaryCredential}`;

    const empty = await app.request(
      `${path}/commands`,
      json({ type: "discover" }, bearer),
    );
    expect(empty.status).toBe(200);
    const emptyBody = (await empty.json()) as { events: McpProtocolEvent[] };
    expect(
      emptyBody.events.map((event) => [event.method, event.status]),
    ).toEqual([["server/discover", "response"]]);

    const saved = await app.request(
      path,
      json({ configuration, expectedRevision: 1 }, bearer, "PUT"),
    );
    expect(saved.status).toBe(200);
    const conflict = await app.request(
      path,
      json({ configuration, expectedRevision: 1 }, bearer, "PUT"),
    );
    expect(conflict.status).toBe(409);
    const discovery = await app.request(
      `${path}/commands`,
      json({ type: "discover" }, bearer),
    );
    expect(discovery.status).toBe(200);
    const discoveryBody = (await discovery.json()) as {
      events: McpProtocolEvent[];
    };
    expect(discoveryBody.events.map((event) => event.method)).toEqual([
      "server/discover",
      "tools/list",
      "resources/list",
      "prompts/list",
    ]);
    expect(
      discoveryBody.events.every((event) => event.status === "response"),
    ).toBe(true);

    for (const command of [
      {
        type: "call-tool",
        name: "get_weather",
        arguments: { location: "Lagos", unit: "celsius" },
      },
      {
        type: "call-tool",
        name: "get_forecast",
        arguments: { location: "Lagos" },
      },
      {
        type: "call-tool",
        name: "search_locations",
        arguments: { query: "Lagos" },
      },
      { type: "read-resource", uri: "weather://cities" },
      { type: "read-resource", uri: "weather://docs/usage" },
      {
        type: "get-prompt",
        name: "plan_for_weather",
        arguments: { city: "Lagos", day: "Monday" },
      },
    ]) {
      const response = await app.request(
        `${path}/commands`,
        json(command, bearer),
      );
      expect(response.status, JSON.stringify(command)).toBe(200);
      const body = await response.json();
      expect(body.events[0].status).toBe("response");
      expect(JSON.stringify(body.result)).toContain(
        command.type === "get-prompt" ? "Lagos on Monday" : "Open-Meteo",
      );
    }
    // Current + forecast share one cached geocoding request.
    expect(fetcher).toHaveBeenCalledTimes(3);
    const loaded = await app.request(path, {
      headers: { authorization: bearer },
    });
    const loadedBody = (await loaded.json()) as {
      workspace: McpWorkspace;
      events: McpProtocolEvent[];
    };
    expect(loadedBody.events).toHaveLength(10);
    expect(loadedBody.events.map((event) => event.sequence)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(
      (await app.request(path, { headers: { authorization: "Bearer wrong" } }))
        .status,
    ).toBe(401);

    await app.request(
      path,
      json(
        {
          configuration: { ...configuration, enabledCapabilityIds: [] },
          expectedRevision: 2,
        },
        bearer,
        "PUT",
      ),
    );
    expect(
      (
        await (
          await app.request(path, { headers: { authorization: bearer } })
        ).json()
      ).events,
    ).toEqual([]);
  });

  it("persists owned workspaces and isolates external endpoint credentials, payloads, pause, rotation, and revocation", async () => {
    const { app } = setup();
    const owner = await auth();
    const created = await app.request(ownedPath, json(createBody, owner));
    expect(created.status).toBe(201);
    const { workspace } = (await created.json()) as { workspace: McpWorkspace };
    expect(workspace.anonymous).toBe(false);
    expect(workspace.expiresAt).toBeNull();
    const duplicate = await app.request(ownedPath, json(createBody, owner));
    expect((await duplicate.json()).workspace.id).toBe(workspace.id);
    expect(
      (
        await app.request(ownedPath, {
          headers: { authorization: await auth("owner-b") },
        })
      ).status,
    ).toBe(404);

    const token = await (
      await app.request(`${ownedPath}/token`, json({}, owner))
    ).json();
    const endpoint = `/mcp/${workspace.publicId}`;
    expect(token.endpoint).toBe(`http://localhost:8787${endpoint}`);
    const external = await app.request(
      endpoint,
      protocol(
        "tools/call",
        {
          name: "get_weather",
          arguments: { location: "external-only-location" },
        },
        token.token,
      ),
    );
    expect(external.status).toBe(200);
    expect(
      (await external.json()).result.structuredContent.current.temperature_2m,
    ).toBe(30);
    let loaded = await (
      await app.request(ownedPath, { headers: { authorization: owner } })
    ).json();
    expect(loaded.events).toEqual([]);

    expect(
      (
        await app.request(
          `${ownedPath}/commands`,
          json({ type: "discover" }, owner),
        )
      ).status,
    ).toBe(200);
    loaded = await (
      await app.request(ownedPath, { headers: { authorization: owner } })
    ).json();
    expect(loaded.events).toHaveLength(4);
    expect(JSON.stringify(loaded.events)).not.toContain(
      "external-only-location",
    );
    expect(
      (await app.request(endpoint, protocol("server/discover", {}, owner)))
        .status,
    ).toBe(200);
    expect(
      (
        await app.request(
          endpoint,
          protocol("server/discover", {}, await auth("owner-b")),
        )
      ).status,
    ).toBe(401);

    expect(
      (
        await app.request(
          `${ownedPath}/status`,
          json({ status: "paused" }, owner),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await app.request(
          endpoint,
          protocol("server/discover", {}, token.token),
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await app.request(
          `${ownedPath}/commands`,
          json({ type: "discover" }, owner),
        )
      ).status,
    ).toBe(423);
    await app.request(`${ownedPath}/status`, json({ status: "active" }, owner));
    const rotated = await (
      await app.request(`${ownedPath}/token`, json({}, owner))
    ).json();
    expect(
      (
        await app.request(
          endpoint,
          protocol("server/discover", {}, token.token),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await app.request(
          endpoint,
          protocol("server/discover", {}, rotated.token),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await app.request(`${ownedPath}/token`, {
          method: "DELETE",
          headers: { authorization: owner },
        })
      ).status,
    ).toBe(204);
    expect(
      (
        await app.request(
          endpoint,
          protocol("server/discover", {}, rotated.token),
        )
      ).status,
    ).toBe(401);
  });

  it("claims anonymous workspaces without silently replacing an existing saved workspace", async () => {
    const { app } = setup();
    const owner = await auth();
    const existing = await (
      await app.request(ownedPath, json(createBody, owner))
    ).json();
    const candidate = await (
      await app.request("/anonymous/workspaces", json(createBody))
    ).json();
    const claimBody = {
      workspaceId: candidate.workspace.id,
      temporaryCredential: candidate.temporaryCredential,
    };
    const conflict = await app.request(
      `${ownedPath}/claim`,
      json(claimBody, owner),
    );
    expect(conflict.status).toBe(409);
    expect((await conflict.json()).existing.id).toBe(existing.workspace.id);
    expect(
      (
        await (
          await app.request(ownedPath, { headers: { authorization: owner } })
        ).json()
      ).workspace.id,
    ).toBe(existing.workspace.id);
    expect(
      (
        await app.request(
          "/v1/mcp-workspaces/wrong-guide/claim",
          json(claimBody, owner),
        )
      ).status,
    ).toBe(401);
    const claimed = await app.request(
      `${ownedPath}/claim`,
      json({ ...claimBody, replaceExisting: true }, owner),
    );
    expect(claimed.status).toBe(200);
    expect((await claimed.json()).workspace).toMatchObject({
      id: candidate.workspace.id,
      anonymous: false,
      expiresAt: null,
    });
    expect(
      (
        await app.request(`/anonymous/workspaces/${candidate.workspace.id}`, {
          headers: { authorization: `Bearer ${candidate.temporaryCredential}` },
        })
      ).status,
    ).toBe(401);
  });

  it("rejects expired temporary credentials for reads, execution, and claiming", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime("2026-09-01T00:00:00Z");
    const { app } = setup();
    const temporary = await (
      await app.request("/anonymous/workspaces", json(createBody))
    ).json();
    vi.setSystemTime("2026-09-09T00:00:00Z");
    const path = `/anonymous/workspaces/${temporary.workspace.id}`;
    const bearer = `Bearer ${temporary.temporaryCredential}`;
    expect(
      (await app.request(path, { headers: { authorization: bearer } })).status,
    ).toBe(401);
    expect(
      (
        await app.request(
          `${path}/commands`,
          json({ type: "discover" }, bearer),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await app.request(
          `${ownedPath}/claim`,
          json(
            {
              workspaceId: temporary.workspace.id,
              temporaryCredential: temporary.temporaryCredential,
            },
            await auth(),
          ),
        )
      ).status,
    ).toBe(401);
  });

  it("returns actionable errors and failed traces for provider outages and invalid MCP arguments", async () => {
    const { app } = setup(
      vi.fn(
        async () => new Response("Unavailable", { status: 503 }),
      ) as typeof fetch,
    );
    const temporary = await (
      await app.request("/anonymous/workspaces", json(createBody))
    ).json();
    const path = `/anonymous/workspaces/${temporary.workspace.id}/commands`;
    const bearer = `Bearer ${temporary.temporaryCredential}`;
    const upstream = await app.request(
      path,
      json(
        {
          type: "call-tool",
          name: "get_weather",
          arguments: { location: "Lagos" },
        },
        bearer,
      ),
    );
    expect(upstream.status).toBe(502);
    const upstreamBody = await upstream.json();
    expect(upstreamBody.code).toBe("UPSTREAM_UNAVAILABLE");
    expect(upstreamBody.events[0].status).toBe("error");
    expect(upstreamBody.result.result.isError).toBe(true);

    const invalid = await app.request(
      path,
      json(
        {
          type: "call-tool",
          name: "get_weather",
          arguments: { location: "Lagos", unit: "kelvin" },
        },
        bearer,
      ),
    );
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).events[0].status).toBe("error");
    const unknown = await app.request(
      path,
      json({ type: "call-tool", name: "run_anything", arguments: {} }, bearer),
    );
    expect(unknown.status).toBe(400);
  });

  it("rejects invalid inputs and enforces the configured per-workspace limit", async () => {
    const { app } = setup();
    const owner = await auth();
    expect(
      (await app.request(`${ownedPath}/claim`, json(null, owner))).status,
    ).toBe(400);
    expect(
      (await app.request(`${ownedPath}/status`, json(null, owner))).status,
    ).toBe(400);
    expect((await app.request("/mcp/not-a-uuid")).status).toBe(404);
    expect(
      (
        await app.request("/anonymous/workspaces/not-a-uuid", {
          headers: { authorization: "Bearer invalid" },
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await app.request(
          "/anonymous/workspaces",
          json({
            ...createBody,
            configuration: {
              ...configuration,
              enabledCapabilityIds: ["unknown"],
            },
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await app.request(
          "/anonymous/workspaces",
          json({
            ...createBody,
            configuration: {
              ...configuration,
              enabledCapabilityIds: ["get-weather", "get-weather"],
            },
          }),
        )
      ).status,
    ).toBe(400);
    vi.stubEnv("MCP_REQUESTS_PER_WORKSPACE_HOUR", "1");
    const temporary = await (
      await app.request("/anonymous/workspaces", json(createBody))
    ).json();
    const path = `/anonymous/workspaces/${temporary.workspace.id}/commands`;
    const bearer = `Bearer ${temporary.temporaryCredential}`;
    expect(
      (await app.request(path, json({ type: "discover" }, bearer))).status,
    ).toBe(200);
    const blocked = await app.request(path, json({ type: "discover" }, bearer));
    expect(blocked.status).toBe(429);
    expect((await blocked.json()).code).toBe("RATE_LIMIT_EXCEEDED");
  });
});
