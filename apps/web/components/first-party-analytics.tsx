'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import {
  enableFirstPartyAnalytics,
  sendAnalytics,
} from '@/lib/analytics/client';

/** Records one page view per route change. Renders nothing. */
export function FirstPartyAnalytics({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (enabled) enableFirstPartyAnalytics();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || lastPath.current === pathname) return;
    lastPath.current = pathname;
    sendAnalytics('pageview');
  }, [enabled, pathname]);

  return null;
}
