'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import clsx from 'clsx';
import {
  ChevronDown,
  Copy,
  ExternalLink,
  FileCode2,
  Link2,
  Share2,
} from 'lucide-react';
import { siteConfig } from '@/lib/config';

const subscribeNever = () => () => {};

function asPlainText(markdown: string) {
  return markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/^```[^\n]*\n?/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^[-*]\s+/gm, '• ');
}

export function ContentShareMenu({
  pathname,
  markdown,
  title,
  description,
  variant = 'button',
}: {
  pathname: string;
  markdown: string;
  title: string;
  description: string;
  variant?: 'button' | 'inline';
}) {
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const shareMenuId = useId();
  // Phones get the native sheet; desktop keeps explicit network links.
  const canNativeShare = useSyncExternalStore(
    subscribeNever,
    () =>
      typeof navigator.share === 'function' &&
      window.matchMedia('(pointer: coarse)').matches,
    () => false,
  );
  const markdownUrl = `/markdown${pathname}`;
  const shareUrl = new URL(pathname, siteConfig.siteUrl).toString();
  const hook = (max: number) => {
    const body = `${title}\n\n${description}`;
    if (body.length <= max) return body;
    const cut = body.slice(0, max - 1);
    return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
  };
  // X counts links as 23 characters; Bluesky counts the URL text itself.
  const shareText = `${hook(200)}\n\n#MCP`;
  const shareTargets = [
    {
      name: 'X',
      note: 'Opens a draft post',
      href: `https://x.com/intent/post?${new URLSearchParams({ text: shareText, url: shareUrl })}`,
    },
    {
      name: 'LinkedIn',
      note: 'Copies the post text, then opens LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url: shareUrl })}`,
      // LinkedIn ignores any prefilled text, so hand it over via the clipboard.
      clipboard: `${hook(600)}\n\n#MCP\n\n${shareUrl}`,
    },
    {
      name: 'Bluesky',
      note: 'Opens a draft post',
      href: `https://bsky.app/intent/compose?${new URLSearchParams({ text: `${hook(200)}\n\n${shareUrl}` })}`,
    },
  ];
  async function nativeShare() {
    setOpen(false);
    setShareOpen(false);
    try {
      await navigator.share({ title, text: hook(200), url: shareUrl });
    } catch {
      // The reader dismissed the share sheet.
    }
  }
  const aiPrompt = `Read ${new URL(markdownUrl, siteConfig.siteUrl)} so I can ask questions about it.`;
  const chatGptUrl = `https://chatgpt.com/?hints=search&q=${encodeURIComponent(aiPrompt)}`;
  const claudeUrl = `https://claude.ai/new?q=${encodeURIComponent(aiPrompt)}`;

  useEffect(() => {
    if (!open && !shareOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false);
        setShareOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        setShareOpen(false);
        toggle.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, shareOpen]);

  async function copy(value: string, success: string) {
    setOpen(false);
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(success);
    } catch {
      setFeedback('Could not copy. Use View as Markdown instead.');
    }
  }

  return (
    <div
      className={clsx(
        'content-share-menu',
        variant === 'inline' && 'content-share-menu--inline',
      )}
      ref={root}
    >
      <div className="content-share-menu__row">
        <div className="content-share-menu__controls">
          <button
            className="content-share-menu__copy"
            onClick={() =>
              void copy(asPlainText(markdown), 'Page text copied.')
            }
            type="button"
          >
            <Copy aria-hidden="true" />
            Copy page
          </button>
          <button
            aria-controls={menuId}
            aria-expanded={open}
            aria-haspopup="true"
            aria-label="More page options"
            className="content-share-menu__toggle"
            onClick={() => {
              setOpen((value) => !value);
              setShareOpen(false);
              setFeedback('');
            }}
            ref={toggle}
            type="button"
          >
            <ChevronDown aria-hidden="true" />
          </button>
        </div>
        <div className="content-share-menu__share">
          <div className="content-share-menu__controls">
            <button
              aria-controls={canNativeShare ? undefined : shareMenuId}
              aria-expanded={canNativeShare ? undefined : shareOpen}
              aria-haspopup={canNativeShare ? undefined : 'true'}
              className="content-share-menu__copy"
              onClick={() => {
                setFeedback('');
                if (canNativeShare) {
                  void nativeShare();
                } else {
                  setOpen(false);
                  setShareOpen((value) => !value);
                }
              }}
              type="button"
            >
              <Share2 aria-hidden="true" />
              Share
            </button>
          </div>
          {shareOpen && !canNativeShare && (
            <div
              className="content-share-menu__panel"
              role="group"
              aria-label="Share this page"
              id={shareMenuId}
            >
              {shareTargets.map((target) => (
                <a
                  href={target.href}
                  key={target.name}
                  onClick={() => {
                    setShareOpen(false);
                    if (target.clipboard) {
                      void copy(
                        target.clipboard,
                        'Post text copied. Paste it into your LinkedIn post.',
                      );
                    }
                  }}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Share2 aria-hidden="true" />
                  <span>
                    <strong>Share on {target.name}</strong>
                    <small>{target.note}</small>
                  </span>
                  <ExternalLink aria-hidden="true" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      {open && (
        <div
          className="content-share-menu__panel"
          role="group"
          aria-label="More page options"
          id={menuId}
        >
          <button
            onClick={() =>
              void copy(
                new URL(pathname, window.location.origin).toString(),
                'Page link copied.',
              )
            }
            type="button"
          >
            <Link2 aria-hidden="true" />
            <span>
              <strong>Copy link</strong>
              <small>Copy this page’s URL</small>
            </span>
          </button>
          <button
            onClick={() => void copy(markdown, 'Page Markdown copied.')}
            type="button"
          >
            <Copy aria-hidden="true" />
            <span>
              <strong>Copy as Markdown</strong>
              <small>Include source and version details</small>
            </span>
          </button>
          <a href={markdownUrl} rel="noopener noreferrer" target="_blank">
            <FileCode2 aria-hidden="true" />
            <span>
              <strong>View as Markdown</strong>
              <small>Open the plain-text version</small>
            </span>
            <ExternalLink aria-hidden="true" />
          </a>
          <a
            href={chatGptUrl}
            onClick={() => setOpen(false)}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink aria-hidden="true" />
            <span>
              <strong>Open in ChatGPT</strong>
              <small>Ask about this page</small>
            </span>
          </a>
          <a
            href={claudeUrl}
            onClick={() => setOpen(false)}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink aria-hidden="true" />
            <span>
              <strong>Open in Claude</strong>
              <small>Ask about this page</small>
            </span>
          </a>
        </div>
      )}
      <span className="content-share-menu__feedback" role="status">
        {feedback}
      </span>
    </div>
  );
}
