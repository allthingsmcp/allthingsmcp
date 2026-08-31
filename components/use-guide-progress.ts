'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const progressVersion = 1;

type ProgressPayload = {
  version: number;
  completed: string[];
};

function storageKey(slug: string) {
  return `all-things-mcp:guide-progress:v${progressVersion}:${slug}`;
}

export function useGuideProgress(slug: string, stepIds: string[]) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(storageKey(slug));
        if (stored) {
          const payload = JSON.parse(stored) as ProgressPayload;
          if (
            payload.version === progressVersion &&
            Array.isArray(payload.completed)
          ) {
            setCompleted(
              payload.completed.filter((id) => stepIds.includes(id)),
            );
          }
        }
      } catch {
        // Progress remains available in memory when storage is unavailable.
      } finally {
        setReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [slug, stepIds]);

  const update = useCallback(
    (next: string[]) => {
      const normalized = Array.from(
        new Set(next.filter((id) => stepIds.includes(id))),
      );
      setCompleted(normalized);
      try {
        const payload: ProgressPayload = {
          version: progressVersion,
          completed: normalized,
        };
        window.localStorage.setItem(storageKey(slug), JSON.stringify(payload));
      } catch {
        // Keep the in-memory update when storage is unavailable.
      }
    },
    [slug, stepIds],
  );

  const toggle = useCallback(
    (id: string) => {
      update(
        completed.includes(id)
          ? completed.filter((value) => value !== id)
          : [...completed, id],
      );
    },
    [completed, update],
  );

  const currentId = useMemo(
    () => stepIds.find((id) => !completed.includes(id)),
    [completed, stepIds],
  );

  return {
    completed,
    currentId,
    ready,
    toggle,
    percent: stepIds.length
      ? Math.round((completed.length / stepIds.length) * 100)
      : 0,
  };
}
