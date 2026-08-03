'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import {
  trackPrivacySafeEvent,
  type AnalyticsEvent,
} from '@/components/privacy-analytics';

export function AnalyticsLink({
  eventName,
  ...props
}: ComponentProps<typeof Link> & { eventName: AnalyticsEvent }) {
  return (
    <Link
      {...props}
      onClick={() => {
        trackPrivacySafeEvent(eventName);
      }}
    />
  );
}
