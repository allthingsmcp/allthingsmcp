'use client';

import { Check, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { GuideStep } from '@/lib/content-schema';

const STORAGE_VERSION = 1;

export function GuideProgress({
  slug,
  steps,
}: {
  slug: string;
  steps: GuideStep[];
}) {
  const [completed, setCompleted] = useState<string[]>([]);
  const key = `atmcp:guide-progress:${slug}:v${STORAGE_VERSION}`;

  useEffect(() => {
    let cancelled = false;
    try {
      const stored = JSON.parse(
        window.localStorage.getItem(key) ?? '[]',
      ) as unknown;
      if (Array.isArray(stored)) {
        const validIds = new Set(steps.map((step) => step.id));
        const next = stored.filter(
          (id): id is string => typeof id === 'string' && validIds.has(id),
        );
        queueMicrotask(() => {
          if (!cancelled) setCompleted(next);
        });
      }
    } catch {
      queueMicrotask(() => {
        if (!cancelled) setCompleted([]);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [key, steps]);

  const completeSet = useMemo(() => new Set(completed), [completed]);
  const percent = Math.round((completed.length / steps.length) * 100);

  function persist(next: string[]) {
    setCompleted(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Progress remains usable for the current page when storage is unavailable.
    }
  }

  function toggle(id: string) {
    persist(
      completeSet.has(id)
        ? completed.filter((item) => item !== id)
        : [...completed, id],
    );
  }

  const progress = (
    <div className="guide-progress__content">
      <div className="guide-progress__summary">
        <span>
          {completed.length} of {steps.length} steps
        </span>
        <strong>{percent}%</strong>
      </div>
      <div
        className="guide-progress__bar"
        role="progressbar"
        aria-label="Guide progress"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <ol>
        {steps.map((step) => (
          <li key={step.id}>
            <button
              type="button"
              aria-label={`${completeSet.has(step.id) ? 'Mark incomplete' : 'Mark complete'}: ${step.title}`}
              aria-pressed={completeSet.has(step.id)}
              onClick={() => toggle(step.id)}
            >
              {completeSet.has(step.id) && <Check />}
            </button>
            <a href={`#${step.id}`}>
              {step.title}
              {step.estimatedMinutes && (
                <small>{step.estimatedMinutes} min</small>
              )}
            </a>
          </li>
        ))}
      </ol>
      {completed.length > 0 && (
        <button
          type="button"
          className="guide-progress__reset"
          onClick={() => persist([])}
        >
          <RotateCcw /> Reset progress
        </button>
      )}
    </div>
  );

  return (
    <>
      <aside
        className="guide-progress guide-progress--desktop"
        aria-label="Guide steps"
      >
        <h2>Your progress</h2>
        {progress}
      </aside>
      <details className="guide-progress guide-progress--mobile">
        <summary>Guide progress · {percent}%</summary>
        {progress}
      </details>
    </>
  );
}
