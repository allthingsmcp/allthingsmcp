'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  ExternalLink,
  ListChecks,
  Play,
} from 'lucide-react';
import type { GuideResource, GuideStep } from '@/lib/content-schema';
import { useGuideProgress } from '@/components/use-guide-progress';
import { InteractiveGuideEnhancement } from '@/components/interactive-guide-overview';
import type { InteractiveGuideId } from '@/lib/interactive-guides';
import { GuideProgressStatus } from '@/components/auth-dialog';

export type GuideOverviewData = {
  slug: string;
  title: string;
  description: string;
  outcome: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  updatedAt: string;
  steps: GuideStep[];
  prerequisites: string[];
  resources: GuideResource[];
  interactiveGuideId?: InteractiveGuideId;
};

function label(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function GuideOverviewExperience({
  guide,
}: {
  guide: GuideOverviewData;
}) {
  return <StandardGuideOverview guide={guide} />;
}

function StandardGuideOverview({ guide }: { guide: GuideOverviewData }) {
  const stepIds = useMemo(
    () => guide.steps.map((step) => step.id),
    [guide.steps],
  );
  const progress = useGuideProgress(guide.slug, stepIds);
  const complete = progress.completed.length === guide.steps.length;

  return (
    <>
      <section className="guide-overview-hero">
        <div className="shell guide-overview-hero__inner">
          <div>
            <nav className="guide-dark-breadcrumbs" aria-label="Breadcrumb">
              <Link href="/guides">Guides</Link>
              <span aria-hidden="true">/</span>
              <span>{label(guide.difficulty)}</span>
            </nav>
            <div className="guide-title-line">
              <h1>{guide.title}</h1>
              <div className="guide-title-badges">
                <span>{label(guide.difficulty)}</span>
                {guide.interactiveGuideId && <span>Interactive</span>}
              </div>
            </div>
            <p>{guide.description}</p>
            <div className="guide-overview-meta">
              <span>
                <ListChecks aria-hidden="true" /> {guide.steps.length} steps
              </span>
              <span>
                <Clock3 aria-hidden="true" /> {guide.estimatedMinutes} min
              </span>
              <span>
                <CalendarDays aria-hidden="true" /> Updated {guide.updatedAt}
              </span>
              {guide.interactiveGuideId && (
                <span>
                  <Play aria-hidden="true" /> Browser simulation
                </span>
              )}
            </div>
          </div>
          <div className="guide-progress-summary" aria-live="polite">
            <span>Your progress</span>
            <strong>
              {progress.completed.length} of {guide.steps.length} completed
            </strong>
            <div
              className="guide-progress-track"
              role="progressbar"
              aria-label="Guide progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress.percent}
            >
              <span style={{ width: `${progress.percent}%` }} />
            </div>
            <small>
              {complete ? 'Guide complete' : `${progress.percent}% complete`}
            </small>
            <GuideProgressStatus status={progress.persistence} tone="dark" />
          </div>
        </div>
      </section>

      {guide.interactiveGuideId && <InteractiveGuideEnhancement />}

      <section className="shell guide-overview-layout">
        <div className="guide-step-list">
          <div className="guide-step-list__heading">
            <div>
              <p className="eyebrow">Guide steps</p>
              <h2>Work through the guide</h2>
            </div>
            {!complete && progress.currentId && (
              <Link href={`/guides/${guide.slug}/${progress.currentId}`}>
                {progress.completed.length ? 'Continue guide' : 'Start guide'}
                <ArrowRight aria-hidden="true" />
              </Link>
            )}
          </div>

          <ol>
            {guide.steps.map((step, index) => {
              const isComplete = progress.completed.includes(step.id);
              const isCurrent = !complete && progress.currentId === step.id;
              return (
                <li
                  className={
                    isComplete
                      ? 'is-complete'
                      : isCurrent
                        ? 'is-current'
                        : undefined
                  }
                  key={step.id}
                >
                  <Link href={`/guides/${guide.slug}/${step.id}`}>
                    <span className="guide-step-number">{index + 1}</span>
                    <span className="guide-step-copy">
                      <strong>{step.title}</strong>
                      <small>{step.description}</small>
                    </span>
                    {step.estimatedMinutes && (
                      <span className="guide-step-time">
                        {step.estimatedMinutes} min
                      </span>
                    )}
                    <span className="guide-step-status" aria-hidden="true">
                      {isComplete ? (
                        <CheckCircle2 />
                      ) : isCurrent ? (
                        <Play />
                      ) : (
                        <Circle />
                      )}
                    </span>
                    <span className="sr-only">
                      {isComplete
                        ? 'Completed'
                        : isCurrent
                          ? 'Current step'
                          : 'Not started'}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>

        <aside className="guide-overview-aside">
          <section>
            <BookOpen aria-hidden="true" />
            <h2>What you’ll accomplish</h2>
            <p>{guide.outcome}</p>
          </section>
          <section>
            <h2>Prerequisites</h2>
            {guide.prerequisites.length ? (
              <ul>
                {guide.prerequisites.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No prior MCP experience required.</p>
            )}
          </section>
          <section>
            <h2>Resources</h2>
            <div className="guide-resource-links">
              {guide.resources.map((resource) => (
                <a href={resource.url} key={resource.url}>
                  {resource.title} <ExternalLink aria-hidden="true" />
                </a>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </>
  );
}
