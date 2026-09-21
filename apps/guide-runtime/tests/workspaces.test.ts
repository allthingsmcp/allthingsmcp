import { describe, expect, it, vi } from 'vitest';
import { weatherTemplate } from '@all-things-mcp/mcp-templates';
import { MemoryWorkspaceRepository, WorkspaceClaimConflictError } from '../src/workspace-repository.js';
import { OpenMeteoProvider } from '../src/weather.js';
import { executeWorkspaceCommand, redactProtocolValue } from '../src/mcp-runtime.js';

const configuration = {
  serverName: 'weather-server',
  enabledCapabilityIds: weatherTemplate.capabilities.map((item) => item.id),
};

describe('MCP workspaces', () => {
  it('creates, updates, claims, and protects revisions', async () => {
    const repository = new MemoryWorkspaceRepository();
    const created = await repository.createAnonymous({
      guideSlug: weatherTemplate.guideSlug,
      templateId: weatherTemplate.id,
      templateVersion: weatherTemplate.version,
      configuration,
    });
    expect(created.workspace.anonymous).toBe(true);
    const updated = await repository.update(created.workspace.id, { ...configuration, serverName: 'lagos-weather' }, 1);
    expect(updated.revision).toBe(2);
    const claimed = await repository.claim(updated.id, created.temporaryCredential, 'user-1', false);
    expect(claimed.anonymous).toBe(false);

    const second = await repository.createAnonymous({
      guideSlug: weatherTemplate.guideSlug,
      templateId: weatherTemplate.id,
      templateVersion: weatherTemplate.version,
      configuration,
    });
    await expect(repository.claim(second.workspace.id, second.temporaryCredential, 'user-1', false))
      .rejects.toBeInstanceOf(WorkspaceClaimConflictError);
  });

  it('executes a real MCP tool through the SDK handler', async () => {
    const repository = new MemoryWorkspaceRepository();
    const created = await repository.createAnonymous({
      guideSlug: weatherTemplate.guideSlug,
      templateId: weatherTemplate.id,
      templateVersion: weatherTemplate.version,
      configuration,
    });
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      if (url.hostname.startsWith('geocoding')) {
        return Response.json({ results: [{ name: 'Lagos', country: 'Nigeria', latitude: 6.45, longitude: 3.39, timezone: 'Africa/Lagos' }] });
      }
      return Response.json({ current: { temperature_2m: 30 }, current_units: { temperature_2m: '°C' } });
    });
    const response = await executeWorkspaceCommand(created.workspace, {
      type: 'call-tool', name: 'get_weather', arguments: { location: 'Lagos', unit: 'celsius' },
    }, new OpenMeteoProvider(fetcher as typeof fetch));
    expect(response.events[0]?.method).toBe('tools/call');
    expect(JSON.stringify(response.result)).toContain('temperature_2m');
  });

  it('redacts secrets recursively before traces are retained', () => {
    expect(redactProtocolValue({ token: 'secret', nested: { authorization: 'Bearer secret', city: 'Lagos' } }))
      .toEqual({ token: '[REDACTED]', nested: { authorization: '[REDACTED]', city: 'Lagos' } });
  });
});
