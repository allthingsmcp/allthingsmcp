'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { GuideCard, type GuideCardItem } from '@/components/guide-card';

export type GuideCategory = GuideCardItem['category'];

export type GuideDirectoryItem = GuideCardItem & { contentType: string };

const filters: Array<{ label: string; value: 'all' | GuideCategory }> = [
  { label: 'All', value: 'all' },
  { label: 'Learn', value: 'learn' },
  { label: 'Build', value: 'build' },
  { label: 'Operate', value: 'operate' },
  { label: 'Security', value: 'security' },
];

function categoryFromHash(): 'all' | GuideCategory {
  if (typeof window === 'undefined') return 'all';
  const value = window.location.hash.slice(1);
  return filters.some((filter) => filter.value === value)
    ? (value as 'all' | GuideCategory)
    : 'all';
}

function formatLabel(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function GuidesExplorer({ guides }: { guides: GuideDirectoryItem[] }) {
  const [activeCategory, setActiveCategory] = useState<'all' | GuideCategory>(
    'all',
  );

  useEffect(() => {
    const syncHash = () => setActiveCategory(categoryFromHash());
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  const visibleGuides =
    activeCategory === 'all'
      ? guides
      : guides.filter((guide) => guide.category === activeCategory);

  return (
    <>
      <nav className="guide-filters shell" aria-label="Filter guides">
        {filters.map((filter) => (
          <a
            href={`#${filter.value}`}
            className={activeCategory === filter.value ? 'is-active' : ''}
            aria-current={activeCategory === filter.value ? 'page' : undefined}
            onClick={() => setActiveCategory(filter.value)}
            key={filter.value}
          >
            {filter.label}
          </a>
        ))}
      </nav>

      <section
        className="section-block section-block--subtle guides-catalog-section"
        id="all-guides"
      >
        <div className="shell guides-catalog-grid">
          <div>
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  {visibleGuides.length}{' '}
                  {visibleGuides.length === 1 ? 'guide' : 'guides'}
                </p>
                <h2>
                  {activeCategory === 'all'
                    ? 'All guides'
                    : `${formatLabel(activeCategory)} guides`}
                </h2>
              </div>
              {activeCategory !== 'all' && (
                <a href="#all" onClick={() => setActiveCategory('all')}>
                  Clear filter
                </a>
              )}
            </div>
            {visibleGuides.length ? (
              <div className="guide-card-grid" aria-live="polite">
                {visibleGuides.map((guide) => (
                  <GuideCard guide={guide} key={guide.href} />
                ))}
              </div>
            ) : (
              <div className="guide-empty-state" aria-live="polite">
                <h3>No published {formatLabel(activeCategory)} guides yet</h3>
                <p>
                  This path is being developed. Browse all guides or contribute
                  the first one.
                </p>
                <div>
                  <a href="#all" onClick={() => setActiveCategory('all')}>
                    Browse all guides
                  </a>
                  <Link href="/contribute">Contribute a guide</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
