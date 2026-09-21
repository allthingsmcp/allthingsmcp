import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { createGuideRuntimeApp } from "../src/app.js";
import { runtimeTokenAudience, runtimeTokenIssuer } from "../src/auth.js";
import { MemoryGuideRunRepository } from "../src/repository.js";
import { MemoryWorkspaceRepository } from '../src/workspace-repository.js';

const sharedSecret = "test-guide-runtime-shared-secret-32-chars";

async function authorization() {
  const token = await new SignJWT({
    name: "ATM Reader",
    email: "reader@example.com",
    image: null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("user-123")
    .setIssuer(runtimeTokenIssuer)
    .setAudience(runtimeTokenAudience)
    .setIssuedAt()
    .setExpirationTime("60s")
    .sign(new TextEncoder().encode(sharedSecret));
  return `Bearer ${token}`;
}

describe("Guide Runtime", () => {
  it("keeps health public and protects user data", async () => {
    const app = createGuideRuntimeApp({
      repository: new MemoryGuideRunRepository(),
      workspaceRepository: new MemoryWorkspaceRepository(),
      sharedSecret,
    });
    expect((await app.request("/health")).status).toBe(200);
    expect((await app.request("/v1/me")).status).toBe(401);

    const response = await app.request("/v1/me", {
      headers: { authorization: await authorization() },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      authenticated: true,
      principal: { sub: "user-123", email: "reader@example.com" },
    });
  });

  it("creates, reads, and revision-checks a Guide run", async () => {
    const app = createGuideRuntimeApp({
      repository: new MemoryGuideRunRepository(),
      workspaceRepository: new MemoryWorkspaceRepository(),
      sharedSecret,
    });
    const headers = {
      authorization: await authorization(),
      "content-type": "application/json",
    };
    const body = {
      progress: {
        version: 1,
        completedStepIds: ["what-is-mcp"],
        activeStepId: "create-your-server",
        percent: 13,
        updatedAt: "2026-09-01T10:00:00.000Z",
      },
      simulatorState: { version: 1, server: { name: "weather-server" } },
    };

    const created = await app.request(
      "/v1/guide-runs/building-your-first-mcp-server",
      { method: "PUT", headers, body: JSON.stringify(body) },
    );
    expect(created.status).toBe(200);
    expect(await created.json()).toMatchObject({ revision: 1 });

    const loaded = await app.request(
      "/v1/guide-runs/building-your-first-mcp-server",
      { headers },
    );
    expect(loaded.status).toBe(200);

    const progressOnlyUpdate = await app.request(
      "/v1/guide-runs/building-your-first-mcp-server",
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          progress: {
            ...body.progress,
            completedStepIds: ["what-is-mcp", "create-your-server"],
            percent: 25,
          },
          expectedRevision: 1,
        }),
      },
    );
    expect(progressOnlyUpdate.status).toBe(200);
    expect(await progressOnlyUpdate.json()).toMatchObject({
      revision: 2,
      simulatorState: body.simulatorState,
    });

    const conflict = await app.request(
      "/v1/guide-runs/building-your-first-mcp-server",
      {
        method: "PUT",
        headers,
        body: JSON.stringify({ ...body, expectedRevision: 99 }),
      },
    );
    expect(conflict.status).toBe(409);
  });
});
