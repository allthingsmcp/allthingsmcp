import { expect, type Page } from '@playwright/test';
import type {
  McpProtocolEvent,
  McpWorkspace,
  McpWorkspaceCommand,
} from '@all-things-mcp/contracts';

export const guideSlug = 'building-your-first-mcp-server';
export const workspacePath = `/api/mcp-workspaces/${guideSlug}`;

export async function seedRuntimeWorkspace(page: Page) {
  const response = await page.request.post(workspacePath, {
    data: {
      guideSlug,
      templateId: 'weather',
      configuration: {
        serverName: 'weather-server',
        enabledCapabilityIds: [
          'get-weather',
          'supported-cities',
          'plan-for-weather',
        ],
      },
    },
  });
  expect(response.ok(), await response.text()).toBe(true);
  const session = (await response.json()) as {
    workspace: McpWorkspace;
    temporaryCredential: string;
  };
  expect(session.temporaryCredential).toBeTruthy();
  const headers = {
    'x-atm-workspace-id': session.workspace.id,
    'x-atm-workspace-credential': session.temporaryCredential,
  };
  const commands: McpWorkspaceCommand[] = [
    { type: 'discover' },
    {
      type: 'call-tool',
      name: 'get_weather',
      arguments: { location: 'London', unit: 'celsius' },
    },
    { type: 'read-resource', uri: 'weather://cities' },
    {
      type: 'get-prompt',
      name: 'plan_for_weather',
      arguments: { city: 'London', day: 'Monday' },
    },
  ];
  for (const command of commands) {
    const result = await page.request.post(`${workspacePath}/commands`, {
      headers,
      data: command,
    });
    expect(result.ok(), await result.text()).toBe(true);
    const body = (await result.json()) as { events: McpProtocolEvent[] };
    expect(body.events.every((event) => event.status === 'response')).toBe(
      true,
    );
  }
  await page.addInitScript(
    ({ key, temporary }) => {
      sessionStorage.setItem(key, JSON.stringify(temporary));
    },
    {
      key: `all-things-mcp:mcp-workspace:${guideSlug}`,
      temporary: {
        workspaceId: session.workspace.id,
        credential: session.temporaryCredential,
      },
    },
  );
  return session.workspace;
}

export async function runClientCommand(
  page: Page,
  buttonName: string,
  method: string,
) {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith(`${workspacePath}/commands`) &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: buttonName, exact: true }).click();
  const response = await responsePromise;
  expect(response.ok(), await response.text()).toBe(true);
  const body = (await response.json()) as { events: McpProtocolEvent[] };
  expect(body.events.map((event) => event.method)).toContain(method);
  expect(body.events.every((event) => event.status === 'response')).toBe(true);
  return body.events;
}
