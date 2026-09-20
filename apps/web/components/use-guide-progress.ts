'use client';

import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { GuideRun } from '@all-things-mcp/contracts';
import { authClient } from '@/lib/auth-client';
import {
  guideProgressMatches,
  normalizeGuideProgress,
  reconcileGuideProgress,
} from '@/lib/guide-progress';
import { useHydrated } from '@/lib/use-hydrated';

export type GuidePersistenceStatus =
  'temporary' | 'loading' | 'saving' | 'saved' | 'error';

type TemporaryProgressContextValue = {
  progress: Record<string, string[]>;
  update: (slug: string, getNext: (current: string[]) => string[]) => string[];
};

const TemporaryProgressContext =
  createContext<TemporaryProgressContextValue | null>(null);
const emptyProgress: string[] = [];

export function GuideProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Record<string, string[]>>({});

  const update = useCallback(
    (slug: string, getNext: (current: string[]) => string[]) => {
      let next: string[] = [];
      setProgress((current) => {
        next = getNext(current[slug] ?? []);
        return { ...current, [slug]: next };
      });
      return next;
    },
    [],
  );

  return createElement(
    TemporaryProgressContext.Provider,
    { value: { progress, update } },
    children,
  );
}

export function useGuideProgress(slug: string, stepIds: string[]) {
  const temporary = useContext(TemporaryProgressContext);
  if (!temporary) {
    throw new Error('useGuideProgress requires GuideProgressProvider.');
  }

  const { data: session, isPending: sessionPending } = authClient.useSession();
  const hydrated = useHydrated();
  const authPending = !hydrated || sessionPending;
  const temporaryCompleted = temporary.progress[slug] ?? emptyProgress;
  const [serverCompleted, setServerCompleted] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [persistence, setPersistence] =
    useState<GuidePersistenceStatus>('loading');
  const revisionRef = useRef<number | undefined>(undefined);
  const saveOperationRef = useRef(0);
  const userId = hydrated ? session?.user.id : undefined;

  const completed = userId ? serverCompleted : temporaryCompleted;

  const save = useCallback(
    async (
      nextCompleted: string[],
      expectedRevision?: number,
      baseCompleted: string[] = [],
    ) => {
      const operation = ++saveOperationRef.current;
      setPersistence('saving');
      let completedToSave = nextCompleted;
      let revisionToMatch = expectedRevision;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        const response = await fetch(`/api/guide-runs/${slug}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            progress: {
              version: 1,
              completedStepIds: completedToSave,
              activeStepId:
                stepIds.find((id) => !completedToSave.includes(id)) ?? null,
              percent: stepIds.length
                ? Math.round((completedToSave.length / stepIds.length) * 100)
                : 0,
              updatedAt: new Date().toISOString(),
            },
            ...(revisionToMatch ? { expectedRevision: revisionToMatch } : {}),
          }),
        });

        if (response.status === 409 && attempt === 0) {
          const latestResponse = await fetch(`/api/guide-runs/${slug}`, {
            cache: 'no-store',
          });
          if (!latestResponse.ok) {
            throw new Error('Unable to resolve progress.');
          }
          const latest = (await latestResponse.json()) as GuideRun;
          completedToSave = reconcileGuideProgress(
            latest.progress.completedStepIds,
            baseCompleted,
            nextCompleted,
            stepIds,
          );
          revisionToMatch = latest.revision;
          continue;
        }

        if (!response.ok) throw new Error('Unable to save progress.');
        const run = (await response.json()) as GuideRun;
        revisionRef.current = Math.max(
          revisionRef.current ?? 0,
          run.revision,
        );
        if (operation === saveOperationRef.current) {
          setServerCompleted(
            normalizeGuideProgress(run.progress.completedStepIds, stepIds),
          );
          setPersistence('saved');
        }
        return run;
      }

      throw new Error('Unable to save progress after resolving a conflict.');
    },
    [slug, stepIds],
  );

  useEffect(() => {
    if (authPending) return;
    if (!userId) {
      saveOperationRef.current += 1;
      revisionRef.current = undefined;
      return;
    }

    const controller = new AbortController();

    void (async () => {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setServerCompleted([]);
      setPersistence('loading');
      setReady(false);
      try {
        const response = await fetch(`/api/guide-runs/${slug}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (response.status === 404) {
          const carryOver = normalizeGuideProgress(temporaryCompleted, stepIds);
          setServerCompleted(carryOver);
          revisionRef.current = undefined;
          if (carryOver.length) await save(carryOver, undefined, []);
          else setPersistence('saved');
          return;
        }
        if (!response.ok) throw new Error('Unable to load progress.');

        const run = (await response.json()) as GuideRun;
        revisionRef.current = run.revision;
        const remote = normalizeGuideProgress(
          run.progress.completedStepIds,
          stepIds,
        );
        const merged = normalizeGuideProgress(
          [...remote, ...temporaryCompleted],
          stepIds,
        );
        setServerCompleted(merged);
        if (!guideProgressMatches(remote, merged)) {
          await save(merged, run.revision, remote);
        } else setPersistence('saved');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setServerCompleted(
            normalizeGuideProgress(temporaryCompleted, stepIds),
          );
          setPersistence('error');
        }
      } finally {
        if (!controller.signal.aborted) setReady(true);
      }
    })();

    return () => controller.abort();
  }, [authPending, save, slug, stepIds, temporaryCompleted, userId]);

  const update = useCallback(
    (getNext: (current: string[]) => string[]) => {
      const next = normalizeGuideProgress(getNext(completed), stepIds);
      if (guideProgressMatches(completed, next)) return;

      if (!userId) {
        temporary.update(slug, () => next);
        return;
      }

      setServerCompleted(next);
      void save(next, revisionRef.current, completed).catch(() => {
        setPersistence('error');
      });
    },
    [completed, save, slug, stepIds, temporary, userId],
  );

  const toggle = useCallback(
    (id: string) => {
      update((current) =>
        current.includes(id)
          ? current.filter((value) => value !== id)
          : [...current, id],
      );
    },
    [update],
  );

  const complete = useCallback(
    (id: string) => update((current) => [...current, id]),
    [update],
  );

  const uncomplete = useCallback(
    (id: string) =>
      update((current) => current.filter((value) => value !== id)),
    [update],
  );

  const reset = useCallback(
    (ids?: string[]) =>
      update((current) =>
        ids?.length ? current.filter((value) => !ids.includes(value)) : [],
      ),
    [update],
  );

  const currentId = useMemo(
    () => stepIds.find((id) => !completed.includes(id)),
    [completed, stepIds],
  );

  return {
    completed,
    currentId,
    ready: authPending ? false : userId ? ready : true,
    persistence: authPending ? 'loading' : userId ? persistence : 'temporary',
    toggle,
    complete,
    uncomplete,
    reset,
    percent: stepIds.length
      ? Math.round((completed.length / stepIds.length) * 100)
      : 0,
  };
}
