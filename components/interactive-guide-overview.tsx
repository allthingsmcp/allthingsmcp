'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Code2,
  Database,
  ExternalLink,
  ListChecks,
  MessageSquareText,
  MonitorPlay,
  Play,
  Server,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { useMemo } from 'react';
import { useGuideProgress } from '@/components/use-guide-progress';
import type { GuideOverviewData } from '@/components/guide-overview-experience';

export function InteractiveGuideOverview({
  guide,
}: {
  guide: GuideOverviewData;
}) {
  const stepIds = useMemo(
    () => guide.steps.map((step) => step.id),
    [guide.steps],
  );
  const progress = useGuideProgress(guide.slug, stepIds);
  const startId = progress.currentId ?? guide.steps[0]?.id;

  return (
    <div className="interactive-overview">
      <section className="shell interactive-overview-hero">
        <div className="interactive-overview-copy">
          <Link className="interactive-overview-back" href="/guides">
            ← Back to Guides
          </Link>
          <p className="eyebrow">Interactive Guide</p>
          <h1>{guide.title}</h1>
          <p>{guide.description}</p>
          <div className="interactive-overview-meta">
            <span>
              <ShieldCheck aria-hidden="true" /> Beginner
            </span>
            <span>
              <Clock3 aria-hidden="true" /> {guide.estimatedMinutes} min
            </span>
            <span>
              <ListChecks aria-hidden="true" /> {guide.steps.length} steps
            </span>
          </div>
          {startId && (
            <Link
              className="button button--primary interactive-start-button"
              href={`/guides/${guide.slug}/${startId}`}
            >
              <Play aria-hidden="true" />
              {progress.completed.length ? 'Continue guide' : 'Start guide'}
              <ArrowRight aria-hidden="true" />
            </Link>
          )}
          <div className="interactive-overview-progress">
            <span>Your progress</span>
            <strong>{progress.percent}%</strong>
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
          </div>
        </div>

        <div className="interactive-overview-outcome">
          <header>
            <span>
              <Server aria-hidden="true" />
            </span>
            <div>
              <p className="eyebrow">You’ll build</p>
              <h2>A configurable weather MCP server</h2>
            </div>
          </header>
          <div
            className="interactive-overview-diagram"
            role="img"
            aria-label="An ATM client connects over Streamable HTTP to a weather MCP server with tools, resources, and prompts."
          >
            <span className="interactive-node is-client">
              <MonitorPlay aria-hidden="true" /> ATM client
            </span>
            <i>Streamable HTTP →</i>
            <span className="interactive-node is-server">
              <Server aria-hidden="true" /> Weather MCP server
            </span>
            <div>
              <span className="is-tool">
                <Wrench aria-hidden="true" /> Tools
              </span>
              <span className="is-resource">
                <Database aria-hidden="true" /> Resources
              </span>
              <span className="is-prompt">
                <MessageSquareText aria-hidden="true" /> Prompts
              </span>
            </div>
          </div>
          <section className="interactive-overview-learn">
            <h3>You’ll learn</h3>
            {[
              'How MCP participants fit together',
              'How tools, resources, and prompts differ',
              'How current protocol messages flow',
              'How to test and export a real TypeScript project',
            ].map((item) => (
              <p key={item}>
                <CheckCircle2 aria-hidden="true" /> {item}
              </p>
            ))}
          </section>
        </div>
      </section>

      <section className="shell interactive-overview-content">
        <div className="guide-step-list">
          <div className="guide-step-list__heading">
            <div>
              <p className="eyebrow">Eight focused steps</p>
              <h2>Build the server progressively</h2>
            </div>
          </div>
          <ol>
            {guide.steps.map((step, index) => {
              const complete = progress.completed.includes(step.id);
              const current = !complete && progress.currentId === step.id;
              return (
                <li
                  className={
                    complete
                      ? 'is-complete'
                      : current
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
                    <span className="guide-step-time">
                      {step.estimatedMinutes} min
                    </span>
                    <span className="guide-step-status">
                      {complete ? (
                        <CheckCircle2 aria-label="Completed" />
                      ) : (
                        <ArrowRight aria-hidden="true" />
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
        <aside className="interactive-overview-aside">
          <section>
            <Code2 aria-hidden="true" />
            <h2>About this Guide</h2>
            <p>{guide.outcome}</p>
          </section>
          <section>
            <h2>Requirements</h2>
            <ul>
              {guide.prerequisites.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2>References</h2>
            {guide.resources.map((resource) => (
              <a href={resource.url} key={resource.url}>
                {resource.title}
                <ExternalLink aria-hidden="true" />
              </a>
            ))}
          </section>
          <section className="interactive-simulation-note">
            <MonitorPlay aria-hidden="true" />
            <p>
              The workspace is a labelled browser simulation. The exported
              project is real TypeScript code.
            </p>
          </section>
        </aside>
      </section>
    </div>
  );
}
