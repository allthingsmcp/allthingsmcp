'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  McpProtocolEvent,
  McpWorkspace,
  McpWorkspaceCommand,
} from '@all-things-mcp/contracts';
import { weatherTemplate } from '@all-things-mcp/mcp-templates';
import { authClient } from '@/lib/auth-client';
import {
  createInitialInteractiveGuideState,
  getGuideObjectives,
  interactiveGuideDefinitions,
  interactiveGuideReducer,
  isInteractiveGuideState,
  stateFromWorkspace,
  workspaceConfigurationFromState,
  type InteractiveGuideAction,
  type InteractiveGuideDefinition,
  type InteractiveGuideId,
  type InteractiveGuideStateV1,
} from '@/lib/interactive-guides';
import type { GuidePersistenceStatus } from '@/components/use-guide-progress';

type RuntimeStatus =
  'loading' | 'ready' | 'saving' | 'executing' | 'paused' | 'expired' | 'error';
type AccessToken = { token: string; tokenPrefix: string; endpoint: string };
type Temporary = { workspaceId: string; credential: string };
type WorkspaceResponse = {
  workspace: McpWorkspace;
  events?: McpProtocolEvent[];
  temporaryCredential?: string;
};
type Value = {
  state: InteractiveGuideStateV1;
  definition: InteractiveGuideDefinition;
  dispatch: (action: InteractiveGuideAction) => void;
  reset: () => void;
  retryRuntime: () => void;
  progressPersistence: GuidePersistenceStatus;
  workspace: McpWorkspace | null;
  runtimeStatus: RuntimeStatus;
  runtimeError: string | null;
  runtimeBusy: boolean;
  claimConflict: boolean;
  resolveClaimConflict: (
    choice: 'resume-saved' | 'replace-with-current',
  ) => Promise<void>;
  issueExternalToken: () => Promise<AccessToken | null>;
  revokeExternalToken: () => Promise<boolean>;
  setWorkspacePaused: (paused: boolean) => Promise<void>;
};
const Context = createContext<Value | null>(null);
const legacyKey = (id: string) => `all-things-mcp:interactive-guide:v1:${id}`;
const temporaryKey = (id: string) => `all-things-mcp:mcp-workspace:${id}`;

function readTemporary(id: string): Temporary | null {
  try {
    const value = JSON.parse(
      sessionStorage.getItem(temporaryKey(id)) ?? 'null',
    ) as Temporary | null;
    return typeof value?.workspaceId === 'string' &&
      typeof value.credential === 'string'
      ? value
      : null;
  } catch {
    return null;
  }
}

const temporaryHeaders = (value: Temporary | null): Record<string, string> =>
  value
    ? {
        'x-atm-workspace-id': value.workspaceId,
        'x-atm-workspace-credential': value.credential,
      }
    : {};

class WorkspaceRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function responseBody<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as
    (T & { error?: string }) | null;
  if (!response.ok)
    throw new WorkspaceRequestError(
      body?.error ?? `Guide Runtime returned ${response.status}. Please retry.`,
      response.status,
    );
  if (!body)
    throw new Error(
      'Guide Runtime returned an invalid response. Please retry.',
    );
  return body;
}

export function InteractiveGuideProvider({
  guideId,
  activeStepId,
  onComplete,
  onResetAutoSteps,
  progressReady,
  progressPersistence,
  children,
}: {
  guideId: InteractiveGuideId;
  activeStepId: string;
  onComplete: (id: string) => void;
  onResetAutoSteps: (ids: string[]) => void;
  progressReady: boolean;
  progressPersistence: GuidePersistenceStatus;
  children: ReactNode;
}) {
  const definition = interactiveGuideDefinitions[guideId];
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user.id;
  const [state, setState] = useState(createInitialInteractiveGuideState);
  const stateRef = useRef(state);
  const workspaceRef = useRef<McpWorkspace | null>(null);
  const temporaryRef = useRef<Temporary | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const pending = useRef(0);
  const [workspace, setWorkspace] = useState<McpWorkspace | null>(null);
  const [runtimeStatus, setStatus] = useState<RuntimeStatus>('loading');
  const [runtimeError, setError] = useState<string | null>(null);
  const [runtimeBusy, setBusy] = useState(true);
  const [claimConflict, setConflict] = useState(false);
  const conflictRef = useRef(false);

  const commitState = useCallback((next: InteractiveGuideStateV1) => {
    stateRef.current = next;
    setState(next);
  }, []);
  const commitWorkspace = useCallback((value: McpWorkspace) => {
    workspaceRef.current = value;
    setWorkspace(value);
  }, []);
  const applyWorkspace = useCallback(
    (body: WorkspaceResponse) => {
      commitWorkspace(body.workspace);
      commitState(stateFromWorkspace(body.workspace, body.events));
      setStatus(body.workspace.status === 'paused' ? 'paused' : 'ready');
    },
    [commitState, commitWorkspace],
  );
  const clearTemporary = useCallback(() => {
    temporaryRef.current = null;
    try {
      sessionStorage.removeItem(temporaryKey(guideId));
    } catch {
      /* Storage may be disabled. */
    }
  }, [guideId]);
  const fail = useCallback((error: unknown) => {
    setError(
      error instanceof Error
        ? error.message
        : 'Unable to reach Guide Runtime. Please retry.',
    );
    setStatus(
      error instanceof WorkspaceRequestError &&
        [401, 410].includes(error.status)
        ? 'expired'
        : 'error',
    );
  }, []);

  // Configuration writes and MCP commands share one queue, so every command uses
  // the last confirmed revision and rapid clicks cannot create duplicate workspaces.
  const enqueue = useCallback(
    <T,>(task: () => Promise<T>): Promise<T | null> => {
      pending.current += 1;
      setBusy(true);
      const result = queue.current.then(async () => {
        setError(null);
        try {
          return await task();
        } catch (error) {
          fail(error);
          return null;
        } finally {
          pending.current -= 1;
          if (pending.current === 0) setBusy(false);
        }
      });
      queue.current = result;
      return result;
    },
    [fail],
  );

  const load = useCallback(async () => {
    setStatus('loading');
    const temp = readTemporary(guideId);
    temporaryRef.current = temp;
    conflictRef.current = false;
    setConflict(false);
    if (userId && temp) {
      const response = await fetch(`/api/mcp-workspaces/${guideId}/claim`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          workspaceId: temp.workspaceId,
          temporaryCredential: temp.credential,
          replaceExisting: false,
        }),
      });
      if (response.status === 409) {
        conflictRef.current = true;
        setConflict(true);
        setStatus('ready');
        return;
      }
      if (response.ok) {
        const body = await responseBody<WorkspaceResponse>(response);
        clearTemporary();
        applyWorkspace(body);
        return;
      }
      if ([401, 404, 410].includes(response.status)) clearTemporary();
      else await responseBody(response);
    }
    const response = await fetch(`/api/mcp-workspaces/${guideId}`, {
      headers: temporaryHeaders(temporaryRef.current),
      cache: 'no-store',
    });
    if (response.status === 404) {
      workspaceRef.current = null;
      setWorkspace(null);
      commitState(createInitialInteractiveGuideState());
      if (!userId) clearTemporary();
      setStatus('ready');
      return;
    }
    applyWorkspace(await responseBody<WorkspaceResponse>(response));
  }, [applyWorkspace, clearTemporary, commitState, guideId, userId]);

  useEffect(() => {
    if (isPending) return;
    const timer = window.setTimeout(() => void enqueue(load), 0);
    return () => window.clearTimeout(timer);
  }, [enqueue, isPending, load]);

  const save = useCallback(
    async (next: InteractiveGuideStateV1) => {
      if (conflictRef.current)
        throw new Error(
          'Choose whether to resume your saved workspace or replace it before making changes.',
        );
      setStatus('saving');
      const current = workspaceRef.current;
      let imported = next;
      let hasLegacyState = false;
      if (!current) {
        try {
          const raw = localStorage.getItem(legacyKey(guideId));
          const legacy: unknown = raw ? JSON.parse(raw) : null;
          if (isInteractiveGuideState(legacy) && legacy.server.created) {
            imported = {
              ...legacy,
              server: { ...legacy.server, name: next.server.name },
            };
            hasLegacyState = true;
          }
        } catch {
          /* Invalid legacy data is not imported. */
        }
      }
      const response = await fetch(`/api/mcp-workspaces/${guideId}`, {
        method: current ? 'PUT' : 'POST',
        headers: {
          'content-type': 'application/json',
          ...temporaryHeaders(temporaryRef.current),
        },
        body: JSON.stringify(
          current
            ? {
                configuration: workspaceConfigurationFromState(next),
                expectedRevision: current.revision,
              }
            : {
                guideSlug: guideId,
                templateId: weatherTemplate.id,
                configuration: workspaceConfigurationFromState(imported),
              },
        ),
      });
      if (response.status === 409) {
        await load();
        throw new Error(
          'This workspace changed in another tab or device. Your latest saved workspace is loaded; please retry your change.',
        );
      }
      const body = await responseBody<WorkspaceResponse>(response);
      if (body.temporaryCredential) {
        temporaryRef.current = {
          workspaceId: body.workspace.id,
          credential: body.temporaryCredential,
        };
        try {
          sessionStorage.setItem(
            temporaryKey(guideId),
            JSON.stringify(temporaryRef.current),
          );
        } catch {
          throw new Error(
            'Your browser blocked workspace storage. Allow session storage before continuing so your server can be restored.',
          );
        }
      }
      applyWorkspace(body);
      if (hasLegacyState) {
        try {
          localStorage.removeItem(legacyKey(guideId));
        } catch {
          /* Workspace is already persisted. */
        }
      }
    },
    [applyWorkspace, guideId, load],
  );

  const execute = useCallback(
    async (command: McpWorkspaceCommand) => {
      if (conflictRef.current)
        throw new Error('Choose your workspace before connecting the client.');
      if (!workspaceRef.current)
        throw new Error('Create your server before connecting the client.');
      if (workspaceRef.current.status === 'paused')
        throw new Error('Resume your endpoint before running MCP requests.');
      setStatus('executing');
      const response = await fetch(`/api/mcp-workspaces/${guideId}/commands`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...temporaryHeaders(temporaryRef.current),
        },
        body: JSON.stringify(command),
      });
      const body = (await response.json().catch(() => null)) as {
        result?: {
          result?: Record<string, unknown>;
          error?: { message?: string };
        };
        events?: McpProtocolEvent[];
        error?: string;
      } | null;
      if (body?.events)
        commitState(
          interactiveGuideReducer(stateRef.current, {
            type: 'apply-runtime',
            command: command.type,
            events: body.events,
            result: body.result?.result,
          }),
        );
      if (
        !response.ok ||
        body?.result?.error ||
        body?.result?.result?.isError
      ) {
        throw new WorkspaceRequestError(
          body?.error ??
            body?.result?.error?.message ??
            'The MCP operation failed. Inspect the exchange and retry.',
          response.status,
        );
      }
      if (!body?.events?.length)
        throw new Error(
          'Guide Runtime returned no protocol exchange. Please retry.',
        );
      setStatus('ready');
    },
    [commitState, guideId],
  );

  const dispatch = useCallback(
    (action: InteractiveGuideAction) => {
      if (action.type === 'select-event' || action.type === 'finish') {
        commitState(interactiveGuideReducer(stateRef.current, action));
        return;
      }
      void enqueue(async () => {
        if (action.type === 'connect-client')
          return execute({ type: 'discover' });
        if (action.type === 'run-tool') {
          const capability = definition.capabilities.find(
            (item) => item.kind === 'tool' && item.name === action.toolName,
          );
          if (!capability) throw new Error('Select an available tool.');
          const argumentsValue = Object.fromEntries(
            capability.fields.map((field) => [
              field.name,
              field.name === 'unit' ? action.unit : action.location.trim(),
            ]),
          );
          return execute({
            type: 'call-tool',
            name: capability.name,
            arguments: argumentsValue,
          });
        }
        if (action.type === 'read-resource') {
          const capability = definition.capabilities.find(
            (item) =>
              item.kind === 'resource' && item.name === action.resourceName,
          );
          if (!capability?.uri)
            throw new Error('Select an available resource.');
          return execute({ type: 'read-resource', uri: capability.uri });
        }
        if (action.type === 'get-prompt')
          return execute({
            type: 'get-prompt',
            name: action.promptName,
            arguments: action.arguments ?? { city: 'London', day: 'Monday' },
          });
        if (
          ['create-server', 'upsert-capability', 'remove-capability'].includes(
            action.type,
          )
        ) {
          if (action.type === 'upsert-capability') {
            const capability = definition.capabilities.find(
              (item) => item.id === action.capability.id,
            );
            if (!capability)
              throw new Error('Select a capability from the Weather template.');
            return save(
              interactiveGuideReducer(stateRef.current, {
                ...action,
                capability,
              }),
            );
          }
          return save(interactiveGuideReducer(stateRef.current, action));
        }
      });
    },
    [commitState, definition.capabilities, enqueue, execute, save],
  );

  useEffect(() => {
    if (
      runtimeStatus !== 'ready' ||
      runtimeBusy ||
      claimConflict ||
      !progressReady ||
      !workspace
    )
      return;
    if (
      getGuideObjectives(state).find((item) => item.stepId === activeStepId)
        ?.complete
    )
      onComplete(activeStepId);
  }, [
    activeStepId,
    claimConflict,
    onComplete,
    progressReady,
    runtimeBusy,
    runtimeStatus,
    state,
    workspace,
  ]);

  const resolveClaimConflict = useCallback(
    async (choice: 'resume-saved' | 'replace-with-current') => {
      await enqueue(async () => {
        const temp = temporaryRef.current;
        if (!temp) return;
        setStatus('saving');
        if (choice === 'replace-with-current') {
          const response = await fetch(`/api/mcp-workspaces/${guideId}/claim`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              workspaceId: temp.workspaceId,
              temporaryCredential: temp.credential,
              replaceExisting: true,
            }),
          });
          await responseBody<WorkspaceResponse>(response);
        }
        clearTemporary();
        await load();
      });
    },
    [clearTemporary, enqueue, guideId, load],
  );

  const issueExternalToken = useCallback(
    () =>
      enqueue(async () => {
        setStatus('saving');
        const token = await responseBody<AccessToken>(
          await fetch(`/api/mcp-workspaces/${guideId}/token`, {
            method: 'POST',
          }),
        );
        setStatus(
          workspaceRef.current?.status === 'paused' ? 'paused' : 'ready',
        );
        return token;
      }),
    [enqueue, guideId],
  );
  const revokeExternalToken = useCallback(
    async () =>
      (await enqueue(async () => {
        setStatus('saving');
        const response = await fetch(`/api/mcp-workspaces/${guideId}/token`, {
          method: 'DELETE',
        });
        if (!response.ok) await responseBody(response);
        setStatus(
          workspaceRef.current?.status === 'paused' ? 'paused' : 'ready',
        );
        return true;
      })) === true,
    [enqueue, guideId],
  );
  const setWorkspacePaused = useCallback(
    async (paused: boolean) => {
      await enqueue(async () => {
        setStatus('saving');
        const body = await responseBody<WorkspaceResponse>(
          await fetch(`/api/mcp-workspaces/${guideId}/status`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ status: paused ? 'paused' : 'active' }),
          }),
        );
        commitWorkspace(body.workspace);
        setStatus(paused ? 'paused' : 'ready');
      });
    },
    [commitWorkspace, enqueue, guideId],
  );
  const reset = useCallback(() => {
    void enqueue(async () => {
      if (runtimeStatus === 'expired' && !userId) {
        clearTemporary();
        workspaceRef.current = null;
        setWorkspace(null);
        commitState(createInitialInteractiveGuideState());
        setStatus('ready');
      } else if (workspaceRef.current)
        await save(createInitialInteractiveGuideState());
      else commitState(createInitialInteractiveGuideState());
      if (progressReady)
        onResetAutoSteps([
          ...definition.autoCompletedStepIds,
          'review-and-export',
        ]);
    });
  }, [
    clearTemporary,
    commitState,
    definition.autoCompletedStepIds,
    enqueue,
    onResetAutoSteps,
    progressReady,
    runtimeStatus,
    save,
    userId,
  ]);
  const retryRuntime = useCallback(() => {
    void enqueue(load);
  }, [enqueue, load]);
  const value = useMemo(
    () => ({
      state,
      definition,
      dispatch,
      reset,
      retryRuntime,
      progressPersistence,
      workspace,
      runtimeStatus,
      runtimeError,
      runtimeBusy,
      claimConflict,
      resolveClaimConflict,
      issueExternalToken,
      revokeExternalToken,
      setWorkspacePaused,
    }),
    [
      state,
      definition,
      dispatch,
      reset,
      retryRuntime,
      progressPersistence,
      workspace,
      runtimeStatus,
      runtimeError,
      runtimeBusy,
      claimConflict,
      resolveClaimConflict,
      issueExternalToken,
      revokeExternalToken,
      setWorkspacePaused,
    ],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useInteractiveGuide() {
  const value = useContext(Context);
  if (!value)
    throw new Error(
      'InteractiveGuideBlock must be rendered inside InteractiveGuideProvider',
    );
  return value;
}
