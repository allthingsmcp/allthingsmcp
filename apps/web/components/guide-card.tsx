'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { BlogCover, type BlogTopic } from '@/components/blog-post-card';
import type { CoverSceneId } from '@/lib/cover-scene-ids';

export type GuideCardStep = { title: string; minutes?: number };

export type GuideCardItem = {
  title: string;
  description: string;
  href: string;
  category: 'learn' | 'build' | 'operate' | 'security';
  difficulty?: string;
  estimatedMinutes?: number;
  steps?: GuideCardStep[];
  coverScene?: CoverSceneId;
  badge?: string;
};

const coverTopic: Record<GuideCardItem['category'], BlogTopic> = {
  learn: 'concepts',
  build: 'architecture',
  operate: 'production',
  security: 'security',
};

function label(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function GuideCard({
  guide,
  recommended = false,
}: {
  guide: GuideCardItem;
  recommended?: boolean;
}) {
  const [pinned, setPinned] = useState(false);
  const panelId = useId();
  const steps = guide.steps ?? [];
  const meta = [
    guide.estimatedMinutes && `${guide.estimatedMinutes} min`,
    guide.difficulty && label(guide.difficulty),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article
      className={[
        'guide-card',
        recommended && 'is-recommended',
        pinned && 'is-pinned',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Link className="guide-card__link" href={guide.href}>
        <BlogCover
          topic={coverTopic[guide.category]}
          compact={false}
          scene={guide.coverScene}
        />
        <span className="guide-card__eyebrow">
          {label(guide.category)}
          {guide.badge && <b>{guide.badge}</b>}
        </span>
        <h3>{guide.title}</h3>
        <p>{guide.description}</p>
        <span className="guide-card__meta">{meta}</span>
        <ArrowRight aria-hidden="true" className="guide-card__arrow" />
        {steps.length > 0 && (
          <div className="guide-card__steps" id={panelId}>
            <strong>{steps.length} steps in this guide</strong>
            <ol>
              {steps.map((step) => (
                <li key={step.title}>
                  <span>{step.title}</span>
                  {step.minutes && <small>{step.minutes} min</small>}
                </li>
              ))}
            </ol>
          </div>
        )}
      </Link>
      {steps.length > 0 && (
        <button
          aria-controls={panelId}
          aria-expanded={pinned}
          className="guide-card__toggle"
          onClick={() => setPinned((value) => !value)}
          type="button"
        >
          {steps.length} steps
          <ChevronDown aria-hidden="true" />
        </button>
      )}
    </article>
  );
}
