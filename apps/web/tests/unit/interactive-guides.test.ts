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
  stateFromWorkspace,
  validateCapability,
} from '@/lib/interactive-guides';
import { createZipArchive } from '@/lib/zip';
import type { McpProtocolEvent, McpWorkspace } from '@all-things-mcp/contracts';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

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
  it('does not complete a real tool objective for an MCP error returned over HTTP 200', () => {
    const event: McpProtocolEvent = {
      id: 'failed-call',
      sequence: 1,
      method: 'tools/call',
      status: 'response',
      request: {},
      response: {
        result: {
          isError: true,
          content: [{ type: 'text', text: 'Provider unavailable' }],
        },
      },
      durationMs: 10,
      createdAt: '2026-09-21T00:00:00.000Z',
    };
    const state = interactiveGuideReducer(configureServer(), {
      type: 'apply-runtime',
      command: 'call-tool',
      events: [event],
      result: event.response.result as Record<string, unknown>,
    });
    expect(state.protocolEvents[0].status).toBe('error');
    expect(state.lastResult).toBeUndefined();
    expect(
      getGuideObjectives(state).find(
        ({ stepId }) => stepId === 'test-your-server',
      )?.complete,
    ).toBe(false);
  });

  it('restores successful real discovery and tool objectives from persisted owner traces', () => {
    const workspace: McpWorkspace = {
      id: '11111111-1111-4111-8111-111111111111',
      publicId: '22222222-2222-4222-8222-222222222222',
      guideSlug: 'building-your-first-mcp-server',
      templateId: 'weather',
      templateVersion: 1,
      configuration: {
        serverName: 'persisted-weather',
        enabledCapabilityIds: ['get-weather'],
      },
      revision: 2,
      status: 'active',
      anonymous: true,
      createdAt: '2026-09-21T00:00:00.000Z',
      updatedAt: '2026-09-21T00:00:00.000Z',
      expiresAt: '2026-09-28T00:00:00.000Z',
    };
    const events: McpProtocolEvent[] = ['server/discover', 'tools/call'].map(
      (method, index) => ({
        id: String(index),
        sequence: 1,
        method,
        status: 'response',
        request: {},
        response: { result: { source: 'Open-Meteo' } },
        durationMs: 10,
        createdAt: '2026-09-21T00:00:00.000Z',
      }),
    );
    const state = stateFromWorkspace(workspace, events);
    expect(state.clientConnected).toBe(true);
    expect(state.protocolEvents.map(({ sequence }) => sequence)).toEqual([
      1, 2,
    ]);
    expect(
      getGuideObjectives(state)
        .filter(({ stepId }) =>
          ['connect-the-atm-client', 'test-your-server'].includes(stepId),
        )
        .every(({ complete }) => complete),
    ).toBe(true);
  });

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
  it('typechecks every exported curated capability and uses a separate configurable port', () => {
    const state = configureServer();
    state.server.tools = buildingFirstServerDefinition.capabilities.filter(
      ({ kind }) => kind === 'tool',
    );
    state.server.resources = buildingFirstServerDefinition.capabilities.filter(
      ({ kind }) => kind === 'resource',
    );
    const source = generateServerSource(state);
    const filename = fileURLToPath(
      new URL('../fixtures/virtual-export.ts', import.meta.url),
    );
    const options: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      types: ['node'],
    };
    const host = ts.createCompilerHost(options);
    const originalSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (path, version, onError, fresh) =>
      path === filename
        ? ts.createSourceFile(path, source, version, true)
        : originalSourceFile(path, version, onError, fresh);
    const diagnostics = ts.getPreEmitDiagnostics(
      ts.createProgram([filename], options, host),
    );
    expect(
      diagnostics.map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      ),
    ).toEqual([]);
    expect(source).toContain('process.env.PORT ?? 3001');
    expect(generateProjectFiles(state)['README.md']).toContain(
      '127.0.0.1:3001/mcp',
    );
  }, 10000);

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
