import type { Interval } from '@/lib/analytics/queries';

/** Formatting shared by the server dashboard and its client components. */
export const integer = new Intl.NumberFormat('en');

function utc(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' });
}

const dayMonth = utc({ day: 'numeric', month: 'short' });
const monthYear = utc({ month: 'short', year: 'numeric' });
const weekday = utc({ weekday: 'short' });
const hourMinute = utc({ hour: '2-digit', minute: '2-digit', hour12: false });

/** Axis label for a bucket: "14:00", "10 Nov", "Nov 2026". */
export function axisLabel(bucket: string, interval: Interval) {
  const date = new Date(bucket);
  if (interval === 'hour') return hourMinute.format(date);
  if (interval === 'month') return monthYear.format(date);
  return dayMonth.format(date);
}

/** Tooltip date: "10 Nov · Tue", "15 Nov · 14:00", "Week of 3 Nov". */
export function tooltipLabel(bucket: string, interval: Interval) {
  const date = new Date(bucket);
  switch (interval) {
    case 'hour':
      return `${dayMonth.format(date)} · ${hourMinute.format(date)}`;
    case 'week':
      return `Week of ${dayMonth.format(date)}`;
    case 'month':
      return monthYear.format(date);
    default:
      return `${dayMonth.format(date)} · ${weekday.format(date)}`;
  }
}

/** "Today", "Yesterday" or "5 days ago" for daily buckets; null otherwise. */
export function relativeDay(bucket: string, interval: Interval, now: Date) {
  if (interval !== 'day') return null;
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const days = Math.round((today - new Date(bucket).getTime()) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days > 1) return `${days} days ago`;
  return null;
}

/** Signed percentage change, or null when there is no earlier data. */
export function change(
  current: number,
  previous: number,
  lowerIsBetter = false,
) {
  if (!previous) return null;
  const percent = ((current - previous) / previous) * 100;
  if (!Number.isFinite(percent)) return null;
  if (Math.abs(percent) < 0.5) return { text: '0%', tone: 'flat' as const };
  const better = lowerIsBetter ? percent < 0 : percent > 0;
  return {
    text: `${percent > 0 ? '+' : ''}${Math.round(percent)}%`,
    tone: better ? ('up' as const) : ('down' as const),
  };
}

export type Change = ReturnType<typeof change>;

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

export function countryName(code: string) {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Flag emoji from a two-letter country code. */
export function countryFlag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return '';
  return String.fromCodePoint(
    ...[...code].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65),
  );
}
