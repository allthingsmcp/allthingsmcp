// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  McpWorkspace,
  McpWorkspaceConfiguration,
} from '@all-things-mcp/contracts';
import {
  InteractiveGuideProvider,
  useInteractiveGuide,
} from '@/components/interactive-guide-context';
import {
  buildingFirstServerDefinition,
  createInitialInteractiveGuideState,
} from '@/lib/interactive-guides';

vi.mock('@/lib/auth-client', () => ({
  authClient: { useSession: () => ({ data: null, isPending: false }) },
}));

const guideId = 'building-your-first-mcp-server';
const legacyKey = `all-things-mcp:interactive-guide:v1:${guideId}`;
const onComplete = vi.fn();
function workspace(
  configuration: McpWorkspaceConfiguration,
  revision = 1,
): McpWorkspace {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    publicId: '22222222-2222-4222-8222-222222222222',
    guideSlug: guideId,
    templateId: 'weather',
    templateVersion: 1,
    configuration,
    revision,
    status: 'active',
    anonymous: true,
    createdAt: '2026-09-21T00:00:00.000Z',
    updatedAt: '2026-09-21T00:00:00.000Z',
    expiresAt: '2026-09-28T00:00:00.000Z',
  };
}
function Wrapper({ children }: { children: ReactNode }) {
  // The provider requires children in its props; createElement's third argument
  // does not satisfy that required property in React's overload.
  // eslint-disable-next-line react/no-children-prop
  return createElement(InteractiveGuideProvider, {
    guideId,
    activeStepId: 'create-your-server',
    onComplete,
    onResetAutoSteps: vi.fn(),
    progressReady: true,
    progressPersistence: 'temporary',
    children,
  });
}
beforeEach(() => {
  const localValues = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => localValues.get(key) ?? null,
    setItem: (key: string, value: string) => localValues.set(key, value),
    removeItem: (key: string) => localValues.delete(key),
  });
  sessionStorage.clear();
  onComplete.mockReset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('real Guide workspace client', () => {
  it('does not complete creation until the database confirms it, and retains failed state', async () => {
    let completeRequest!: (value: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url, init?: RequestInit) =>
        !init?.method
          ? Promise.resolve(new Response(null, { status: 404 }))
          : new Promise<Response>((resolve) => {
              completeRequest = resolve;
            }),
      ),
    );
    const { result } = renderHook(useInteractiveGuide, { wrapper: Wrapper });
    await waitFor(() => expect(result.current.runtimeBusy).toBe(false));
    act(() =>
      result.current.dispatch({ type: 'create-server', name: 'demo-weather' }),
    );
    await waitFor(() => expect(result.current.runtimeStatus).toBe('saving'));
    expect(result.current.state.server.created).toBe(false);
    expect(onComplete).not.toHaveBeenCalled();
    await act(async () =>
      completeRequest(
        Response.json({ error: 'Database unavailable' }, { status: 503 }),
      ),
    );
    await waitFor(() => expect(result.current.runtimeStatus).toBe('error'));
    expect(result.current.state.server.created).toBe(false);
    expect(result.current.runtimeError).toBe('Database unavailable');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('serializes creation and rapid capability changes using confirmed revisions', async () => {
    const revisions: number[] = [];
    let creates = 0;
    const fetchMock = vi.fn(async (_url, init?: RequestInit) => {
      if (!init?.method) return new Response(null, { status: 404 });
      const body = JSON.parse(String(init.body)) as {
        configuration: McpWorkspaceConfiguration;
        expectedRevision?: number;
      };
      if (init.method === 'POST') {
        creates++;
        return Response.json({
          workspace: workspace(body.configuration),
          temporaryCredential: 'a'.repeat(64),
        });
      }
      revisions.push(body.expectedRevision!);
      return Response.json({
        workspace: workspace(body.configuration, body.expectedRevision! + 1),
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(useInteractiveGuide, { wrapper: Wrapper });
    await waitFor(() => expect(result.current.runtimeBusy).toBe(false));
    act(() => {
      result.current.dispatch({ type: 'create-server', name: 'demo-weather' });
      result.current.dispatch({
        type: 'upsert-capability',
        capability: buildingFirstServerDefinition.capabilities[0],
      });
      result.current.dispatch({
        type: 'upsert-capability',
        capability: buildingFirstServerDefinition.capabilities[1],
      });
    });
    await waitFor(() => expect(result.current.workspace?.revision).toBe(3));
    expect(creates).toBe(1);
    expect(revisions).toEqual([1, 2]);
    expect(result.current.state.server.tools.map(({ id }) => id)).toEqual([
      'get-weather',
      'get-forecast',
    ]);
    expect(result.current.runtimeError).toBeNull();
  });

  it('imports supported legacy capability IDs once without retaining fabricated exchanges', async () => {
    const legacy = createInitialInteractiveGuideState();
    legacy.server.created = true;
    legacy.server.tools = [
      buildingFirstServerDefinition.capabilities[0],
      {
        ...buildingFirstServerDefinition.capabilities[1],
        id: 'unreviewed-tool',
      },
    ];
    legacy.clientConnected = true;
    localStorage.setItem(legacyKey, JSON.stringify(legacy));
    let createdConfiguration: McpWorkspaceConfiguration | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, init?: RequestInit) => {
        if (!init?.method) return new Response(null, { status: 404 });
        createdConfiguration = JSON.parse(String(init.body))
          .configuration as McpWorkspaceConfiguration;
        return Response.json({
          workspace: workspace(createdConfiguration),
          temporaryCredential: 'a'.repeat(64),
        });
      }),
    );
    const { result } = renderHook(useInteractiveGuide, { wrapper: Wrapper });
    await waitFor(() => expect(result.current.runtimeBusy).toBe(false));
    act(() =>
      result.current.dispatch({
        type: 'create-server',
        name: 'imported-weather',
      }),
    );
    await waitFor(() => expect(result.current.state.server.created).toBe(true));
    expect(createdConfiguration).toEqual({
      serverName: 'imported-weather',
      enabledCapabilityIds: ['get-weather'],
    });
    expect(result.current.state.clientConnected).toBe(false);
    expect(localStorage.getItem(legacyKey)).toBeNull();
  });
});
