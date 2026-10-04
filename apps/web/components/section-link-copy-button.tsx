'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Link2 } from 'lucide-react';

export function SectionLinkCopyButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  async function copySectionLink() {
    const url = new URL(window.location.href);
    url.hash = id;

    if (window.location.hash === url.hash) {
      window.history.replaceState(null, '', url);
    } else {
      window.history.pushState(null, '', url);
    }
    document.getElementById(id)?.scrollIntoView();

    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      aria-label={
        copied ? 'Section link copied' : 'Open and copy link to this section'
      }
      className="mdx-heading-copy"
      onClick={copySectionLink}
      title={copied ? 'Copied' : 'Copy and open link to this section'}
      type="button"
    >
      {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
      <span className="sr-only" aria-live="polite">
        {copied ? 'Section link copied' : ''}
      </span>
    </button>
  );
}
