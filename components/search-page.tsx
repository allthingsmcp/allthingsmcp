'use client';

import Link from 'next/link';
import { ArrowRight, Search, SlidersHorizontal } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { trackPrivacySafeEvent } from '@/components/privacy-analytics';

type SearchHit = {
  id?: string;
  url: string;
  type?: string;
  content?: string;
  title?: string;
};

function cleanSearchText(value: string | undefined) {
  if (!value) return '';
  return value
    .replace(/<\/?mark>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function SearchPage() {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!term.trim()) return;
    trackPrivacySafeEvent('search_used');
    setLoading(true);
    const response = await fetch(
      `/api/search?query=${encodeURIComponent(term.trim())}`,
    );
    const data = (await response.json()) as
      SearchHit[] | { results?: SearchHit[] };
    setResults(Array.isArray(data) ? data : (data.results ?? []));
    setLoading(false);
  }

  return (
    <main id="main-content" className="search-page">
      <div className="shell">
        <p className="eyebrow">Search</p>
        <h1>Search All Things MCP</h1>
        <form onSubmit={submit} className="search-form">
          <Search />
          <label className="sr-only" htmlFor="global-search">
            Search guides, terms, and projects
          </label>
          <input
            id="global-search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search guides, terms, and projects"
            autoFocus
          />
          <button type="submit">Search</button>
        </form>
        <div className="search-filters">
          <button>
            <SlidersHorizontal /> Filters
          </button>
          {[
            'All',
            'Learn',
            'Build',
            'Operate',
            'Security',
            'Ecosystem',
            'Spec Watch',
            'Tools',
            'Glossary',
          ].map((item, index) => (
            <button className={index === 0 ? 'is-selected' : ''} key={item}>
              {item}
            </button>
          ))}
          <select aria-label="Difficulty">
            <option>All difficulties</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
          <select aria-label="Specification version">
            <option>All specification versions</option>
          </select>
        </div>
        <section aria-live="polite" className="search-results">
          {loading && <p>Searching…</p>}
          {!loading && results.length === 0 && (
            <div className="search-empty">
              <h2>Search the field guide</h2>
              <p>
                Results include headings, article content, glossary terms,
                content types, sections, difficulty, and specification metadata.
              </p>
            </div>
          )}
          {results.map((result, index) => (
            <Link
              href={result.url}
              className="search-result"
              key={result.id ?? `${result.url}-${index}`}
            >
              <span>{result.type ?? 'Page'}</span>
              <h2>
                {cleanSearchText(result.title ?? result.content) ||
                  'Search result'}
              </h2>
              {result.content && result.title && (
                <p>{cleanSearchText(result.content).slice(0, 180)}</p>
              )}
              <ArrowRight />
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
