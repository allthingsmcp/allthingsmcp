'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  createInitialInteractiveGuideState,
  getGuideObjectives,
  interactiveGuideDefinitions,
  interactiveGuideReducer,
  isInteractiveGuideState,
  type InteractiveGuideAction,
  type InteractiveGuideDefinition,
  type InteractiveGuideId,
  type InteractiveGuideStateV1,
} from '@/lib/interactive-guides';
import type { GuidePersistenceStatus } from '@/components/use-guide-progress';

type InteractiveGuideContextValue = {
  state: InteractiveGuideStateV1;
  definition: InteractiveGuideDefinition;
  dispatch: (action: InteractiveGuideAction) => void;
  reset: () => void;
  progressPersistence: GuidePersistenceStatus;
};

const InteractiveGuideContext =
  createContext<InteractiveGuideContextValue | null>(null);

function storageKey(guideId: InteractiveGuideId) {
  return `all-things-mcp:interactive-guide:v1:${guideId}`;
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
  onComplete: (stepId: string) => void;
  onResetAutoSteps: (stepIds: string[]) => void;
  progressReady: boolean;
  progressPersistence: GuidePersistenceStatus;
  children: ReactNode;
}) {
  const definition = interactiveGuideDefinitions[guideId];
  const [state, reducerDispatch] = useReducer(
    interactiveGuideReducer,
    undefined,
    createInitialInteractiveGuideState,
  );
  const [ready, setReady] = useState(false);
  const restoredRef = useRef(false);
  const pendingActionsRef = useRef<InteractiveGuideAction[]>([]);

  const dispatch = useCallback((action: InteractiveGuideAction) => {
    if (!restoredRef.current && action.type !== 'hydrate') {
      pendingActionsRef.current.push(action);
    }
    reducerDispatch(action);
  }, []);

  useEffect(() => {
    if (restoredRef.current) return;

    let restoredState: InteractiveGuideStateV1 | undefined;
    try {
      const stored = window.localStorage.getItem(storageKey(guideId));
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isInteractiveGuideState(parsed)) {
          restoredState = parsed;
        }
      }
    } catch {
      // The simulator remains usable in memory when storage is unavailable.
    } finally {
      const pendingActions = pendingActionsRef.current;
      if (restoredState || pendingActions.length) {
        const baseState = restoredState ?? createInitialInteractiveGuideState();
        const nextState = pendingActions.reduce(
          interactiveGuideReducer,
          baseState,
        );
        reducerDispatch({ type: 'hydrate', state: nextState });
      }
      pendingActionsRef.current = [];
      restoredRef.current = true;
      setReady(true);
    }
  }, [guideId]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(storageKey(guideId), JSON.stringify(state));
    } catch {
      // Keep the in-memory state when storage is unavailable.
    }
  }, [guideId, ready, state]);

  useEffect(() => {
    if (!ready || !progressReady) return;
    const objective = getGuideObjectives(state).find(
      (item) => item.stepId === activeStepId,
    );
    if (objective?.complete) onComplete(activeStepId);
  }, [activeStepId, onComplete, progressReady, ready, state]);

  const reset = useCallback(() => {
    dispatch({ type: 'reset' });
    if (progressReady) onResetAutoSteps(definition.autoCompletedStepIds);
  }, [
    definition.autoCompletedStepIds,
    dispatch,
    onResetAutoSteps,
    progressReady,
  ]);

  const value = useMemo(
    () => ({ state, definition, dispatch, reset, progressPersistence }),
    [definition, dispatch, progressPersistence, reset, state],
  );

  return (
    <InteractiveGuideContext.Provider value={value}>
      {children}
    </InteractiveGuideContext.Provider>
  );
}

export function useInteractiveGuide() {
  const context = useContext(InteractiveGuideContext);
  if (!context) {
    throw new Error(
      'InteractiveGuideBlock must be rendered inside InteractiveGuideProvider',
    );
  }
  return context;
}
