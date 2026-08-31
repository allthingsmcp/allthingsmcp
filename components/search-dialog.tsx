'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  FileText,
  LoaderCircle,
  Newspaper,
  Radio,
  Search,
  X,
} from 'lucide-react';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { trackPrivacySafeEvent } from '@/components/privacy-analytics';
import { cn } from '@/lib/utils';

const categories = [
  ['all', 'All'],
  ['guides', 'Guides'],
  ['blog', 'Blog'],
  ['spec-watch', 'Spec Watch'],
  ['glossary', 'Glossary'],
  ['pages', 'Pages'],
] as const;

type SearchCategory = (typeof categories)[number][0];

type SearchResult = {
  id: string;
  url: string;
  title: string;
  description: string;
  snippet: string;
  breadcrumbs?: string[];
  category: Exclude<SearchCategory, 'all'>;
  kind: string;
};

type SearchDialogContextValue = {
  openSearch: () => void;
  closeSearch: () => void;
};

const SearchDialogContext = createContext<SearchDialogContextValue | null>(
  null,
);

function cleanSearchText(value: string) {
  return value
    .replace(/<\/?mark>/gi, '')
    .replace(/[`*_#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function ResultIcon({ category }: { category: SearchResult['category'] }) {
  const Icon = {
    guides: BookOpen,
    blog: Newspaper,
    'spec-watch': Radio,
    glossary: BookMarked,
    pages: FileText,
  }[category];
  return <Icon aria-hidden="true" />;
}

function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const trackedRef = useRef(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle',
  );
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setStatus('loading');
      if (!trackedRef.current) {
        trackPrivacySafeEvent('search_used');
        trackedRef.current = true;
      }
      try {
        const params = new URLSearchParams({ query: query.trim() });
        if (category !== 'all') params.set('category', category);
        const response = await fetch(`/api/search?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Search request failed');
        const nextResults = (await response.json()) as SearchResult[];
        setResults(nextResults);
        setStatus('ready');
        setActiveIndex(nextResults.length ? 0 : -1);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setResults([]);
          setStatus('error');
        }
      }
    }, 160);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [category, open, query]);

  function close() {
    setQuery('');
    setCategory('all');
    setResults([]);
    setStatus('idle');
    setActiveIndex(-1);
    trackedRef.current = false;
    onClose();
  }

  function chooseResult(index: number) {
    const result = results[index];
    if (!result) return;
    close();
    router.push(result.url);
  }

  return (
    <dialog
      ref={dialogRef}
      className="search-dialog"
      aria-labelledby="search-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      onClose={onClose}
    >
      <div className="search-dialog__surface">
        <header className="search-dialog__header">
          <div>
            <p className="eyebrow">Find it across ATM</p>
            <h2 id="search-dialog-title">Search All Things MCP</h2>
          </div>
          <button
            type="button"
            className="search-dialog__close"
            onClick={close}
            aria-label="Close search"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="search-command">
          <Search aria-hidden="true" />
          <label className="sr-only" htmlFor="global-search">
            Search All Things MCP
          </label>
          <input
            ref={inputRef}
            id="global-search"
            type="search"
            autoComplete="off"
            spellCheck="false"
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              if (value.trim().length < 2) {
                setResults([]);
                setStatus('idle');
                setActiveIndex(-1);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveIndex((index) =>
                  results.length ? (index + 1) % results.length : -1,
                );
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveIndex((index) =>
                  results.length
                    ? (index - 1 + results.length) % results.length
                    : -1,
                );
              }
              if (event.key === 'Enter' && activeIndex >= 0) {
                event.preventDefault();
                chooseResult(activeIndex);
              }
            }}
            aria-controls="search-results"
            aria-activedescendant={
              activeIndex >= 0 ? `search-result-${activeIndex}` : undefined
            }
            placeholder="Search guides, articles, terms, and spec updates…"
          />
          {status === 'loading' ? (
            <LoaderCircle
              className="search-command__loader"
              aria-label="Searching"
            />
          ) : query ? (
            <button
              type="button"
              className="search-command__clear"
              onClick={() => setQuery('')}
            >
              Clear
            </button>
          ) : (
            <kbd>ESC</kbd>
          )}
        </div>

        <div
          className="search-dialog__filters"
          aria-label="Filter search results"
        >
          {categories.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={cn(category === value && 'is-selected')}
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <section
          id="search-results"
          className="search-dialog__results"
          aria-live="polite"
          aria-busy={status === 'loading'}
        >
          {query.trim().length < 2 ? (
            <div className="search-dialog__start">
              <p>Search the practical layer around the protocol.</p>
              <div>
                <Link href="/guides" onClick={close}>
                  Browse Guides <ArrowRight aria-hidden="true" />
                </Link>
                <Link href="/blog" onClick={close}>
                  Read the Blog <ArrowRight aria-hidden="true" />
                </Link>
                <Link href="/spec-watch" onClick={close}>
                  Follow Spec Watch <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </div>
          ) : status === 'error' ? (
            <div className="search-dialog__message">
              <b>Search is unavailable.</b>
              <p>Close the search and try again.</p>
            </div>
          ) : status === 'ready' && results.length === 0 ? (
            <div className="search-dialog__message">
              <b>No results for “{query.trim()}”</b>
              <p>
                Try a protocol term, task, component, or specification topic.
              </p>
            </div>
          ) : (
            <div className="search-result-list">
              {results.map((result, index) => (
                <Link
                  id={`search-result-${index}`}
                  key={result.id}
                  href={result.url}
                  className={cn(
                    'search-result-item',
                    index === activeIndex && 'is-active',
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={close}
                >
                  <span
                    className={`search-result-item__icon is-${result.category}`}
                  >
                    <ResultIcon category={result.category} />
                  </span>
                  <span className="search-result-item__body">
                    <span className="search-result-item__meta">
                      {result.kind}
                      {result.breadcrumbs?.length
                        ? ` · ${result.breadcrumbs.join(' / ')}`
                        : ''}
                    </span>
                    <strong>{result.title}</strong>
                    <small>
                      {cleanSearchText(result.snippet || result.description)}
                    </small>
                  </span>
                  <ArrowRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          )}
        </section>

        <footer className="search-dialog__footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> Move
          </span>
          <span>
            <kbd>↵</kbd> Open
          </span>
          <span>
            <kbd>ESC</kbd> Close
          </span>
          {status === 'ready' && (
            <span className="search-dialog__count">
              {results.length} result{results.length === 1 ? '' : 's'}
            </span>
          )}
        </footer>
      </div>
    </dialog>
  );
}

export function SearchDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener('keydown', onKeyDown);

    const url = new URL(window.location.href);
    let openTimeout: number | undefined;
    if (url.searchParams.get('search') === '1') {
      openTimeout = window.setTimeout(() => setOpen(true), 0);
      url.searchParams.delete('search');
      window.history.replaceState(
        {},
        '',
        `${url.pathname}${url.search}${url.hash}`,
      );
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (openTimeout !== undefined) window.clearTimeout(openTimeout);
    };
  }, []);

  return (
    <SearchDialogContext.Provider
      value={{
        openSearch: () => setOpen(true),
        closeSearch: () => setOpen(false),
      }}
    >
      {children}
      <SearchDialog open={open} onClose={() => setOpen(false)} />
    </SearchDialogContext.Provider>
  );
}

export function useSearchDialog() {
  const context = useContext(SearchDialogContext);
  if (!context) {
    throw new Error('useSearchDialog must be used within SearchDialogProvider');
  }
  return context;
}

export function SearchDialogTrigger({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const { openSearch } = useSearchDialog();
  return (
    <button type="button" className={className} onClick={openSearch}>
      {children ?? 'Search'}
    </button>
  );
}
