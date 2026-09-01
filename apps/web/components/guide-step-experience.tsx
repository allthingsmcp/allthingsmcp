'use client';

import { useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
} from 'lucide-react';
import type { GuideStep } from '@/lib/content-schema';
import { useGuideProgress } from '@/components/use-guide-progress';
import { InteractiveGuideProvider } from '@/components/interactive-guide-context';
import type { InteractiveGuideId } from '@/lib/interactive-guides';

type StepPageData = {
  title: string;
  description: string;
  estimatedMinutes: number;
  updatedAt: string;
  specVersion: string;
};

export function GuideStepExperience({
  guideSlug,
  guideTitle,
  steps,
  activeStep,
  page,
  actions,
  children,
  interactiveGuideId,
}: {
  guideSlug: string;
  guideTitle: string;
  steps: GuideStep[];
  activeStep: GuideStep;
  page: StepPageData;
  actions: ReactNode;
  children: ReactNode;
  interactiveGuideId?: InteractiveGuideId;
}) {
  const router = useRouter();
  const stepIds = useMemo(() => steps.map((step) => step.id), [steps]);
  const progress = useGuideProgress(guideSlug, stepIds);
  const activeIndex = steps.findIndex((step) => step.id === activeStep.id);
  const nextStep = steps[activeIndex + 1];
  const previousStep = steps[activeIndex - 1];
  const isComplete = progress.completed.includes(activeStep.id);
  const usesInteractiveCompletion =
    !!interactiveGuideId && activeStep.id !== 'what-is-mcp';
  const articleContent = interactiveGuideId ? (
    <InteractiveGuideProvider
      activeStepId={activeStep.id}
      guideId={interactiveGuideId}
      onComplete={progress.complete}
      onResetAutoSteps={progress.reset}
    >
      {children}
    </InteractiveGuideProvider>
  ) : (
    children
  );

  return (
    <div className="shell guide-step-layout">
      <aside className="guide-step-nav">
        <Link className="guide-step-nav__back" href={`/guides/${guideSlug}`}>
          <ArrowLeft aria-hidden="true" /> Guide overview
        </Link>
        <h2>{guideTitle}</h2>
        <div className="guide-step-nav__progress">
          <span>
            {progress.completed.length} of {steps.length} complete
          </span>
          <div className="guide-progress-track" aria-hidden="true">
            <span style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
        <label className="guide-step-mobile-selector">
          <span>Current step</span>
          <select
            aria-label="Choose Guide step"
            onChange={(event) =>
              router.push(`/guides/${guideSlug}/${event.target.value}`)
            }
            value={activeStep.id}
          >
            {steps.map((step, index) => (
              <option key={step.id} value={step.id}>
                {index + 1}. {step.title}
                {progress.completed.includes(step.id) ? ' — Complete' : ''}
              </option>
            ))}
          </select>
        </label>
        <ol>
          {steps.map((step, index) => {
            const completed = progress.completed.includes(step.id);
            const active = step.id === activeStep.id;
            return (
              <li className={active ? 'is-active' : undefined} key={step.id}>
                <Link
                  href={`/guides/${guideSlug}/${step.id}`}
                  aria-current={active ? 'step' : undefined}
                >
                  <span>{completed ? <CheckCircle2 /> : <Circle />}</span>
                  <small>Step {index + 1}</small>
                  <strong>{step.title}</strong>
                </Link>
              </li>
            );
          })}
        </ol>
      </aside>

      <article className="guide-step-article">
        <header>
          <p className="eyebrow">
            Step {activeIndex + 1} of {steps.length}
          </p>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
          <div className="guide-step-article__meta">
            <span>
              <Clock3 aria-hidden="true" /> {page.estimatedMinutes} min
            </span>
            <span>Spec {page.specVersion}</span>
            <span>Updated {page.updatedAt}</span>
          </div>
        </header>

        <div className="prose guide-step-prose">{articleContent}</div>

        {!usesInteractiveCompletion && (
          <div className="guide-step-completion">
            <div>
              <p className="eyebrow">Step {activeIndex + 1}</p>
              <h2>{isComplete ? 'Step completed' : 'Ready to continue?'}</h2>
              <p>
                {isComplete
                  ? 'Your progress is saved in this browser.'
                  : 'Mark this step complete when you have finished the checks above.'}
              </p>
            </div>
            <button
              className={isComplete ? 'is-complete' : undefined}
              type="button"
              onClick={() => progress.toggle(activeStep.id)}
            >
              <Check aria-hidden="true" />
              {isComplete ? 'Mark as incomplete' : 'Mark step complete'}
            </button>
          </div>
        )}

        <nav className="guide-step-pagination" aria-label="Guide steps">
          {previousStep ? (
            <Link href={`/guides/${guideSlug}/${previousStep.id}`}>
              <ArrowLeft aria-hidden="true" />
              <span>
                <small>Previous</small>
                <strong>{previousStep.title}</strong>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {nextStep ? (
            <Link href={`/guides/${guideSlug}/${nextStep.id}`}>
              <span>
                <small>Next</small>
                <strong>{nextStep.title}</strong>
              </span>
              <ArrowRight aria-hidden="true" />
            </Link>
          ) : (
            <Link href={`/guides/${guideSlug}`}>
              <span>
                <small>Finished</small>
                <strong>Return to overview</strong>
              </span>
              <ArrowRight aria-hidden="true" />
            </Link>
          )}
        </nav>

        <div className="guide-step-actions">{actions}</div>
      </article>
    </div>
  );
}
