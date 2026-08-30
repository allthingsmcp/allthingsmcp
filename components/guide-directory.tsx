'use client';

import Link from 'next/link';
import { ArrowRight, Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { GuideCategory } from '@/lib/content-schema';

export type GuideSummary = {
  title: string;
  description: string;
  outcome: string;
  category: GuideCategory;
  difficulty: string;
  estimatedMinutes: number;
  stepCount: number;
  href: string;
};

const filters: Array<{ label: string; value: 'all' | GuideCategory }> = [
  { label: 'All', value: 'all' },
  { label: 'Learn', value: 'learn' },
  { label: 'Build', value: 'build' },
  { label: 'Operate', value: 'operate' },
  { label: 'Security', value: 'security' },
];

function readFilter(): 'all' | GuideCategory {
  const hash = window.location.hash.slice(1);
  return filters.some((filter) => filter.value === hash)
    ? (hash as GuideCategory)
    : 'all';
}

export function GuideDirectory({ guides }: { guides: GuideSummary[] }) {
  const [filter, setFilter] = useState<'all' | GuideCategory>('all');

  useEffect(() => {
    const sync = () => setFilter(readFilter());
    sync();
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  function selectFilter(next: 'all' | GuideCategory) {
    const url = next === 'all' ? window.location.pathname : `#${next}`;
    window.history.pushState(null, '', url);
    setFilter(next);
  }

  const visible =
    filter === 'all'
      ? guides
      : guides.filter((guide) => guide.category === filter);

  return (
    <>
      <div className="guide-filters" aria-label="Filter guides by path">
        {filters.map((item) => (
          <button
            type="button"
            key={item.value}
            aria-pressed={filter === item.value}
            onClick={() => selectFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="guide-results" aria-live="polite">
        {visible.length ? (
          visible.map((guide) => (
            <Link className="guide-result" href={guide.href} key={guide.href}>
              <div>
                <span>{guide.category}</span>
                <span>{guide.difficulty}</span>
              </div>
              <h3>{guide.title}</h3>
              <p>{guide.outcome}</p>
              <div className="guide-card__meta">
                <span>
                  <Clock3 /> {guide.estimatedMinutes} min
                </span>
                <span>{guide.stepCount} steps</span>
                <b>
                  Start guide <ArrowRight />
                </b>
              </div>
            </Link>
          ))
        ) : (
          <div className="guide-empty">
            <h3>This path is being written.</h3>
            <p>
              Follow Spec Watch or subscribe while the first {filter} guide goes
              through technical review.
            </p>
            <Link href="/spec-watch">
              Explore Spec Watch <ArrowRight />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
