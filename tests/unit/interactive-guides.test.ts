import { describe, expect, it } from 'vitest';
import {
  buildingFirstServerDefinition,
  cloneCapability,
  createInitialInteractiveGuideState,
  generateProjectFiles,
  generateServerSource,
  getGuideObjectives,
  interactiveGuideReducer,
  isInteractiveGuideState,
  validateCapability,
} from '@/lib/interactive-guides';
import { createZipArchive } from '@/lib/zip';

function configureServer() {
  let state = interactiveGuideReducer(createInitialInteractiveGuideState(), {
    type: 'create-server',
    name: 'weather-server',
  });
  for (const kind of ['tool', 'resource', 'prompt'] as const) {
    const capability = buildingFirstServerDefinition.capabilities.find(
      (item) => item.kind === kind,
    );
    if (!capability) throw new Error(`Missing ${kind} fixture`);
    state = interactiveGuideReducer(state, {
      type: 'upsert-capability',
      capability: cloneCapability(capability),
    });
  }
  return state;
}

describe('interactive Guide state', () => {
  it('configures capabilities without mutating the curated definitions', () => {
    const original = buildingFirstServerDefinition.capabilities[0];
    const edited = cloneCapability(original);
    edited.name = 'current_weather';
    const state = interactiveGuideReducer(
      interactiveGuideReducer(createInitialInteractiveGuideState(), {
        type: 'create-server',
        name: 'weather-server',
      }),
      { type: 'upsert-capability', capability: edited },
    );
    expect(state.server.tools[0]?.name).toBe('current_weather');
    expect(original.name).toBe('get_weather');
  });

  it('rejects invalid and duplicate capability names', () => {
    const capability = cloneCapability(
      buildingFirstServerDefinition.capabilities[0],
    );
    capability.name = 'Get Weather';
    expect(validateCapability(capability, []).name).toBeTruthy();

    capability.name = 'get_weather';
    const duplicate = cloneCapability(capability);
    duplicate.id = 'another-tool';
    expect(validateCapability(duplicate, [capability]).name).toMatch(/unique/i);

    const resource = cloneCapability(
      buildingFirstServerDefinition.capabilities.find(
        (item) => item.kind === 'resource',
      )!,
    );
    resource.uri = 'not a resource uri';
    expect(validateCapability(resource, []).uri).toBeTruthy();

    capability.fields = [capability.fields[0], capability.fields[0]];
    expect(validateCapability(capability, [])['fields.1.name']).toMatch(
      /unique/i,
    );
  });

  it('creates current discovery messages and a deterministic tool result', () => {
    let state = configureServer();
    state = interactiveGuideReducer(state, { type: 'connect-client' });
    expect(state.protocolEvents.map((event) => event.method)).toEqual([
      'server/discover',
      'tools/list',
      'resources/list',
      'prompts/list',
    ]);
    expect(state.protocolEvents[0]?.request).toMatchObject({
      method: 'server/discover',
      _meta: { 'io.modelcontextprotocol/spec-version': '2026-07-28' },
    });

    state = interactiveGuideReducer(state, {
      type: 'run-tool',
      toolName: 'get_weather',
      location: 'London',
      unit: 'celsius',
    });
    expect(state.lastResult).toMatchObject({
      location: 'London',
      temperature: 18,
    });
    expect(
      getGuideObjectives(state).find(
        (item) => item.stepId === 'test-your-server',
      )?.complete,
    ).toBe(true);
  });

  it('simulates resource reads, prompt retrieval, and protocol errors', () => {
    let state = interactiveGuideReducer(configureServer(), {
      type: 'connect-client',
    });
    state = interactiveGuideReducer(state, {
      type: 'read-resource',
      resourceName: 'supported_cities',
    });
    expect(state.protocolEvents.at(-1)).toMatchObject({
      method: 'resources/read',
      status: 'response',
    });
    state = interactiveGuideReducer(state, {
      type: 'get-prompt',
      promptName: 'plan_for_weather',
    });
    expect(state.protocolEvents.at(-1)).toMatchObject({
      method: 'prompts/get',
      status: 'response',
    });
    state = interactiveGuideReducer(state, {
      type: 'read-resource',
      resourceName: 'missing_resource',
    });
    expect(state.protocolEvents.at(-1)).toMatchObject({
      method: 'resources/read',
      status: 'error',
    });
  });

  it('resets to a valid versioned state', () => {
    const reset = interactiveGuideReducer(configureServer(), { type: 'reset' });
    expect(reset.server.created).toBe(false);
    expect(reset.server.tools).toHaveLength(0);
    expect(isInteractiveGuideState(reset)).toBe(true);
    expect(isInteractiveGuideState({ version: 2 })).toBe(false);
    expect(
      isInteractiveGuideState({
        ...reset,
        server: { tools: [], resources: [], prompts: [] },
      }),
    ).toBe(false);
  });
});

describe('generated TypeScript project', () => {
  it('uses SDK v2 registration and the current HTTP handler', () => {
    const source = generateServerSource(configureServer());
    expect(source).toContain('createMcpHandler');
    expect(source).toContain('server.registerTool');
    expect(source).toContain('server.registerResource');
    expect(source).toContain('server.registerPrompt');
    expect(source).not.toContain('SSEServerTransport');
  });

  it('keeps generated handlers valid when an editable schema has no fields', () => {
    const state = configureServer();
    state.server.tools[0] = { ...state.server.tools[0], fields: [] };
    const source = generateServerSource(state);
    expect(source).toContain('async () =>');
    expect(source).not.toContain('async ({  })');
  });

  it('produces the required project files and a valid ZIP envelope', () => {
    const files = generateProjectFiles(configureServer());
    expect(Object.keys(files).sort()).toEqual([
      'README.md',
      'package.json',
      'src/server.ts',
      'tsconfig.json',
    ]);
    const zip = createZipArchive(files);
    expect(Array.from(zip.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(new TextDecoder().decode(zip)).toContain('src/server.ts');
  });
});
