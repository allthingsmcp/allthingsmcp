'use client';

import Link from 'next/link';
import { Check, Copy, Trash2 } from 'lucide-react';
import { useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  buildCampaignLink,
  campaignResultsHref,
  mediumPresets,
  sourcePresets,
} from '@/lib/analytics/utm';

type SavedLink = {
  url: string;
  page: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  createdAt: string;
};

// Recent links live in this browser only; they are a convenience, not a record.
const storageKey = 'atm-campaign-links';
const changeEvent = 'atm-campaign-links-change';

function subscribe(onChange: () => void) {
  window.addEventListener(changeEvent, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(changeEvent, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function readStored() {
  try {
    return window.localStorage.getItem(storageKey) ?? '[]';
  } catch {
    return '[]';
  }
}

function writeStored(links: SavedLink[]) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(links.slice(0, 20)));
  } catch {
    // Storage can be unavailable; the link is still copied.
  }
  window.dispatchEvent(new Event(changeEvent));
}

function parseStored(raw: string): SavedLink[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? (value as SavedLink[]) : [];
  } catch {
    return [];
  }
}

/** Copies text; when the clipboard is blocked, selects `fallback` instead. */
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  return {
    copied,
    failed,
    async copy(text: string, fallback?: HTMLElement | null) {
      try {
        await navigator.clipboard.writeText(text);
        setFailed(null);
        setCopied(text);
        window.setTimeout(
          () => setCopied((value) => (value === text ? null : value)),
          1800,
        );
      } catch {
        setFailed(text);
        if (fallback) {
          const range = document.createRange();
          range.selectNodeContents(fallback);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    },
  };
}

function Presets({
  values,
  current,
  onPick,
  label,
}: {
  values: string[];
  current: string;
  onPick: (value: string) => void;
  label: string;
}) {
  return (
    <div className="link-builder__presets" role="group" aria-label={label}>
      {values.map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={current === value}
          onClick={() => onPick(value)}
        >
          {value}
        </button>
      ))}
    </div>
  );
}

export function LinkBuilder({
  siteUrl,
  siteHosts,
  pages,
}: {
  siteUrl: string;
  siteHosts: string[];
  pages: string[];
}) {
  const id = useId();
  const [page, setPage] = useState('/');
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [content, setContent] = useState('');
  const { copied, failed, copy } = useCopy();
  const output = useRef<HTMLElement>(null);
  const stored = useSyncExternalStore(subscribe, readStored, () => '[]');
  const saved = useMemo(() => parseStored(stored), [stored]);

  const touched = Boolean(source || medium || campaign);
  const link = buildCampaignLink(
    { page, source, medium, campaign, content },
    siteUrl,
    siteHosts,
  );

  async function copyAndSave() {
    if (!link.ok) return;
    const entry: SavedLink = {
      url: link.url,
      page: link.values.page,
      source: link.values.source,
      medium: link.values.medium,
      campaign: link.values.campaign,
      content: link.values.content,
      createdAt: new Date().toISOString(),
    };
    writeStored([entry, ...saved.filter((item) => item.url !== link.url)]);
    await copy(link.url, output.current);
  }

  return (
    <div className="link-builder">
      <section className="analytics-card link-builder__form">
        <div className="link-builder__fields">
          <label className="link-builder__field link-builder__field--wide">
            <span>Page</span>
            <input
              value={page}
              onChange={(event) => setPage(event.target.value)}
              list={`${id}-pages`}
              placeholder="/blog/what-is-mcp"
              spellCheck={false}
            />
            <small>A path on the site, or a full URL.</small>
            <datalist id={`${id}-pages`}>
              {pages.map((path) => (
                <option key={path} value={path} />
              ))}
            </datalist>
          </label>

          <div className="link-builder__field">
            <label htmlFor={`${id}-source`}>Source</label>
            <input
              id={`${id}-source`}
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="linkedin"
              spellCheck={false}
            />
            <small>Where the link is posted.</small>
            <Presets
              label="Common sources"
              values={sourcePresets}
              current={source}
              onPick={setSource}
            />
          </div>

          <div className="link-builder__field">
            <label htmlFor={`${id}-medium`}>Medium</label>
            <input
              id={`${id}-medium`}
              value={medium}
              onChange={(event) => setMedium(event.target.value)}
              placeholder="social"
              spellCheck={false}
            />
            <small>The kind of channel.</small>
            <Presets
              label="Common mediums"
              values={mediumPresets}
              current={medium}
              onPick={setMedium}
            />
          </div>

          <label className="link-builder__field">
            <span>Campaign</span>
            <input
              value={campaign}
              onChange={(event) => setCampaign(event.target.value)}
              placeholder="tasks-launch"
              spellCheck={false}
            />
            <small>Groups every link for one launch or post.</small>
          </label>

          <label className="link-builder__field">
            <span>
              Content <em>(optional)</em>
            </span>
            <input
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="carousel"
              spellCheck={false}
            />
            <small>Tells two links in one campaign apart.</small>
          </label>
        </div>

        <div className="link-builder__result" aria-live="polite">
          {link.ok ? (
            <>
              <code ref={output}>{link.url}</code>
              <div className="link-builder__actions">
                <button
                  type="button"
                  className="button button--primary"
                  onClick={copyAndSave}
                >
                  {copied === link.url ? (
                    <Check aria-hidden="true" size={16} />
                  ) : (
                    <Copy aria-hidden="true" size={16} />
                  )}
                  {copied === link.url ? 'Copied' : 'Copy link'}
                </button>
                <Link
                  className="button button--secondary"
                  href={campaignResultsHref(
                    link.values.campaign,
                    link.values.source,
                  )}
                >
                  View results
                </Link>
              </div>
              {failed === link.url && (
                <p className="link-builder__warning">
                  Copying was blocked by the browser. The link is selected, so
                  press ⌘C or Ctrl+C to copy it.
                </p>
              )}
              <p className="link-builder__hint">
                To test it yourself, open it in a private window. Visits from a
                browser that has opened the dashboard are not counted.
              </p>
              {link.external && (
                <p className="link-builder__warning">
                  This link points to another site, so its visits will not
                  appear in these analytics.
                </p>
              )}
            </>
          ) : (
            <p className="link-builder__hint">
              {touched
                ? link.error
                : 'Fill in a source, medium and campaign to build the link.'}
            </p>
          )}
        </div>
      </section>

      <section className="analytics-card link-builder__recent">
        <header>
          <h2>Recent links</h2>
          {saved.length > 0 && (
            <button
              type="button"
              className="link-builder__clear"
              onClick={() => writeStored([])}
            >
              Clear
            </button>
          )}
        </header>
        {saved.length ? (
          <ul>
            {saved.map((item) => (
              <li key={item.url}>
                <div className="link-builder__recent-text">
                  <strong>{item.campaign}</strong>
                  <span>
                    {item.source} / {item.medium}
                    {item.content ? ` · ${item.content}` : ''} · {item.page}
                  </span>
                </div>
                <div className="link-builder__recent-actions">
                  <button
                    type="button"
                    onClick={() => copy(item.url)}
                    aria-label={`Copy link for ${item.campaign}`}
                  >
                    {copied === item.url ? (
                      <Check aria-hidden="true" size={16} />
                    ) : (
                      <Copy aria-hidden="true" size={16} />
                    )}
                  </button>
                  <Link href={campaignResultsHref(item.campaign, item.source)}>
                    Results
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      writeStored(saved.filter((link) => link.url !== item.url))
                    }
                    aria-label={`Remove ${item.campaign}`}
                  >
                    <Trash2 aria-hidden="true" size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="link-builder__hint">
            Links you copy appear here, in this browser only.
          </p>
        )}
      </section>
    </div>
  );
}
