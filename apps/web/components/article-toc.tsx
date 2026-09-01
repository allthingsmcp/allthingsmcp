'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

type TocItem = {
  title: ReactNode;
  url: string;
  depth: number;
};

function headingId(url: string) {
  return decodeURIComponent(url.replace(/^#/, ''));
}

export function ArticleToc({ items }: { items: TocItem[] }) {
  const ids = useMemo(() => items.map((item) => headingId(item.url)), [items]);
  const [activeId, setActiveId] = useState(ids[0] ?? '');
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const headings = ids
        .map((id) => document.getElementById(id))
        .filter((heading): heading is HTMLElement => Boolean(heading));
      const article = document.getElementById('article-content');

      if (headings.length) {
        const atPageEnd =
          window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 8;
        const activationLine = Math.min(window.innerHeight * 0.35, 220);
        const current = atPageEnd
          ? headings.at(-1)!
          : headings.reduce((closest, heading) => {
              return heading.getBoundingClientRect().top <= activationLine
                ? heading
                : closest;
            }, headings[0]);
        setActiveId(current.id);
      }

      if (article) {
        const bounds = article.getBoundingClientRect();
        const readableDistance = Math.max(
          article.offsetHeight - window.innerHeight * 0.6,
          1,
        );
        const distanceRead = Math.max(
          -bounds.top + window.innerHeight * 0.2,
          0,
        );
        setProgress(
          Math.round(Math.min(distanceRead / readableDistance, 1) * 100),
        );
      }
    };

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    window.addEventListener('hashchange', requestUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      window.removeEventListener('hashchange', requestUpdate);
    };
  }, [ids]);

  if (!items.length) return null;

  const activeItem = items.find((item) => headingId(item.url) === activeId);

  return (
    <aside className="article-toc">
      <div className="article-toc__summary">
        <span>
          <b>In this article</b>
          <small>{progress}% read</small>
        </span>
        <span className="article-toc__meter" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </span>
        {activeItem && (
          <span className="article-toc__current">{activeItem.title}</span>
        )}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="article-toc-links"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">Toggle article sections</span>
          <span aria-hidden="true">{open ? '–' : '+'}</span>
        </button>
      </div>
      <nav
        className={`article-toc__links${open ? 'is-open' : ''}`}
        id="article-toc-links"
        aria-label="In this article"
      >
        {items.map((item) => {
          const id = headingId(item.url);
          const active = id === activeId;
          return (
            <a
              className={active ? 'is-active' : undefined}
              href={item.url}
              aria-current={active ? 'location' : undefined}
              key={item.url}
              onClick={() => setOpen(false)}
              style={{ '--toc-depth': item.depth } as CSSProperties}
            >
              {item.title}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
