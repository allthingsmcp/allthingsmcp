'use client';

import { useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  ChevronDown,
  Copy,
  ExternalLink,
  FileCode2,
  Link2,
} from 'lucide-react';

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
  variant = 'button',
}: {
  pathname: string;
  markdown: string;
  variant?: 'button' | 'inline';
}) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const markdownUrl = `/markdown${pathname}`;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

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
      <div className="content-share-menu__controls">
        <button
          className="content-share-menu__copy"
          onClick={() => void copy(asPlainText(markdown), 'Page text copied.')}
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
            setFeedback('');
          }}
          ref={toggle}
          type="button"
        >
          <ChevronDown aria-hidden="true" />
        </button>
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
            href="https://chatgpt.com/"
            onClick={() =>
              void copy(markdown, 'Markdown copied. Paste it in ChatGPT.')
            }
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink aria-hidden="true" />
            <span>
              <strong>Open in ChatGPT</strong>
              <small>Copies Markdown for you to paste</small>
            </span>
          </a>
          <a
            href="https://claude.ai/new"
            onClick={() =>
              void copy(markdown, 'Markdown copied. Paste it in Claude.')
            }
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink aria-hidden="true" />
            <span>
              <strong>Open in Claude</strong>
              <small>Copies Markdown for you to paste</small>
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
