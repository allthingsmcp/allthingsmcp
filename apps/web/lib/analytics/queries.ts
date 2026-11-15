import type { SupabaseClient } from '@supabase/supabase-js';

export type SearchParams = Record<string, string | string[] | undefined>;

export const rangeOptions = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
  { key: '12m', label: '12 months' },
  { key: 'all', label: 'All time' },
] as const;

export type RangeKey = (typeof rangeOptions)[number]['key'] | 'custom';
export type Interval = 'hour' | 'day' | 'week' | 'month';

export type ResolvedRange = {
  key: RangeKey;
  from: Date;
  to: Date;
  previousFrom: Date;
  interval: Interval;
  /** Inclusive dates for the custom range inputs (YYYY-MM-DD). */
  fromDate: string;
  toDate: string;
  /** The last bucket is still in progress (the range ends after now). */
  partial: boolean;
  /** Development-only sample data; kept in every dashboard link. */
  demo?: boolean;
};

/** Filter keys accepted in the URL, matching analytics_scope in SQL. */
export const filterKeys = [
  'hostname',
  'path',
  'entry_path',
  'event',
  'referrer_host',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'country',
  'device',
  'browser',
  'os',
] as const;

export type FilterKey = (typeof filterKeys)[number];
export type Filters = Partial<Record<FilterKey, string>>;

const day = 86_400_000;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function intervalFor(spanMs: number): Interval {
  if (spanMs <= 2 * day) return 'hour';
  if (spanMs <= 92 * day) return 'day';
  if (spanMs <= 400 * day) return 'week';
  return 'month';
}

function finish(
  key: RangeKey,
  from: Date,
  to: Date,
  interval?: Interval,
): Omit<ResolvedRange, 'partial'> {
  const span = to.getTime() - from.getTime();
  return {
    key,
    from,
    to,
    previousFrom: new Date(from.getTime() - span),
    interval: interval ?? intervalFor(span),
    fromDate: isoDate(from),
    toDate: isoDate(new Date(to.getTime() - 1)),
  };
}

/**
 * Resolve the dashboard range from the URL. All boundaries are UTC.
 * `earliest` is the first stored event, used for "All time".
 */
export function resolveRange(
  params: SearchParams,
  now: Date,
  earliest?: Date | null,
): ResolvedRange {
  const range = baseRange(params, now, earliest);
  return { ...range, partial: range.to.getTime() > now.getTime() };
}

function baseRange(
  params: SearchParams,
  now: Date,
  earliest?: Date | null,
): Omit<ResolvedRange, 'partial'> {
  const key = (first(params.range) ?? '30d') as RangeKey;
  const today = startOfUtcDay(now);
  const tomorrow = new Date(today.getTime() + day);

  if (key === 'custom') {
    const fromValue = first(params.from);
    const toValue = first(params.to);
    if (
      fromValue &&
      toValue &&
      datePattern.test(fromValue) &&
      datePattern.test(toValue)
    ) {
      const from = new Date(`${fromValue}T00:00:00Z`);
      const to = new Date(new Date(`${toValue}T00:00:00Z`).getTime() + day);
      if (!Number.isNaN(from.getTime()) && to > from)
        return finish('custom', from, to);
    }
  }
  switch (key) {
    case 'today':
      return finish('today', today, tomorrow, 'hour');
    case '7d':
      return finish('7d', new Date(tomorrow.getTime() - 7 * day), tomorrow);
    case '90d':
      return finish('90d', new Date(tomorrow.getTime() - 90 * day), tomorrow);
    case '12m': {
      const from = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1),
      );
      const to = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
      );
      return finish('12m', from, to, 'month');
    }
    case 'all': {
      const from = startOfUtcDay(earliest ?? today);
      return finish('all', from, tomorrow);
    }
    default:
      return finish('30d', new Date(tomorrow.getTime() - 30 * day), tomorrow);
  }
}

export function parseFilters(params: SearchParams): Filters {
  const filters: Filters = {};
  for (const key of filterKeys) {
    const value = first(params[key])?.trim();
    if (value && value.length <= 1024) filters[key] = value;
  }
  return filters;
}

/** Build a dashboard URL from the current state with some changes applied. */
export function dashboardHref(
  range: ResolvedRange,
  filters: Filters,
  changes: Partial<Record<FilterKey, string | null>> = {},
  rangeChange?: RangeKey,
) {
  const params = new URLSearchParams();
  if (range.demo) params.set('demo', '1');
  const key = rangeChange ?? range.key;
  if (key !== '30d') params.set('range', key);
  if (key === 'custom') {
    params.set('from', range.fromDate);
    params.set('to', range.toDate);
  }
  const next: Filters = { ...filters };
  for (const [name, value] of Object.entries(changes) as Array<
    [FilterKey, string | null]
  >) {
    if (value === null) delete next[name];
    else next[name] = value;
  }
  for (const name of filterKeys) {
    const value = next[name];
    if (value) params.set(name, value);
  }
  const query = params.toString();
  return query ? `/admin/analytics?${query}` : '/admin/analytics';
}

export type Summary = {
  visitors: number;
  visits: number;
  pageviews: number;
  events: number;
  bounces: number;
};

export type SeriesPoint = {
  bucket: string;
  visitors: number;
  pageviews: number;
  /** Visits that started in this bucket, and how many of them bounced. */
  visits: number;
  bounces: number;
};
export type BreakdownRow = {
  value: string;
  visitors: number;
  pageviews: number;
  events: number;
};

export type Dimension =
  | 'path'
  | 'route'
  | 'entry_path'
  | 'hostname'
  | 'referrer_host'
  | 'utm_source'
  | 'utm_medium'
  | 'utm_campaign'
  | 'country'
  | 'device'
  | 'browser'
  | 'os'
  | 'event';

export const dashboardDimensions: Dimension[] = [
  'path',
  'route',
  'entry_path',
  'referrer_host',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'country',
  'device',
  'browser',
  'os',
  'hostname',
  'event',
];

const emptySummary: Summary = {
  visitors: 0,
  visits: 0,
  pageviews: 0,
  events: 0,
  bounces: 0,
};

function numbers<T extends Record<string, unknown>>(row: T) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value,
    ]),
  ) as T;
}

async function rpc<T>(
  client: SupabaseClient,
  name: string,
  args: Record<string, unknown>,
): Promise<T[]> {
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(`${name} failed: ${error.message}`);
  return ((data ?? []) as Record<string, unknown>[]).map(numbers) as T[];
}

export async function earliestEvent(client: SupabaseClient) {
  const { data } = await client
    .from('analytics_events')
    .select('created_at')
    .order('created_at', { ascending: true })
    .limit(1);
  const value = data?.[0]?.created_at as string | undefined;
  return value ? new Date(value) : null;
}

export type DashboardData = {
  summary: Summary;
  previous: Summary;
  series: SeriesPoint[];
  breakdowns: Record<Dimension, BreakdownRow[]>;
  props: Array<{ key: string; rows: BreakdownRow[] }>;
  /** Visitors seen in the last five minutes, across the whole site. */
  online: number;
};

/** Rows loaded per panel; panels show the first few and expand to the rest. */
export const breakdownLimit = 50;

export async function loadDashboard(
  client: SupabaseClient,
  range: ResolvedRange,
  filters: Filters,
): Promise<DashboardData> {
  const scope = {
    p_from: range.from.toISOString(),
    p_to: range.to.toISOString(),
    p_filters: filters,
  };
  const now = Date.now();
  const [summary, previous, recent, series, ...lists] = await Promise.all([
    rpc<Summary>(client, 'analytics_summary', scope),
    rpc<Summary>(client, 'analytics_summary', {
      ...scope,
      p_from: range.previousFrom.toISOString(),
      p_to: range.from.toISOString(),
    }),
    rpc<Summary>(client, 'analytics_summary', {
      p_from: new Date(now - 5 * 60_000).toISOString(),
      p_to: new Date(now + 60_000).toISOString(),
      p_filters: {},
    }),
    rpc<SeriesPoint>(client, 'analytics_timeseries', {
      ...scope,
      p_interval: range.interval,
    }),
    ...dashboardDimensions.map((dimension) =>
      rpc<BreakdownRow>(client, 'analytics_breakdown', {
        ...scope,
        p_dimension: dimension,
        p_limit: breakdownLimit,
      }),
    ),
  ]);

  const props: DashboardData['props'] = [];
  if (filters.event) {
    const { data } = await client
      .from('analytics_events')
      .select('props')
      .eq('name', filters.event)
      .gte('created_at', scope.p_from)
      .lt('created_at', scope.p_to)
      .not('props', 'is', null)
      .limit(500);
    const keys = new Set<string>();
    for (const row of data ?? []) {
      for (const key of Object.keys((row.props as object) ?? {})) keys.add(key);
    }
    for (const key of [...keys].sort().slice(0, 6)) {
      props.push({
        key,
        rows: await rpc<BreakdownRow>(client, 'analytics_breakdown', {
          ...scope,
          p_dimension: 'prop',
          p_event: filters.event,
          p_prop: key,
          p_limit: breakdownLimit,
        }),
      });
    }
  }

  return {
    summary: summary[0] ?? emptySummary,
    previous: previous[0] ?? emptySummary,
    series,
    breakdowns: Object.fromEntries(
      dashboardDimensions.map((dimension, index) => [dimension, lists[index]]),
    ) as Record<Dimension, BreakdownRow[]>,
    props,
    online: recent[0]?.visitors ?? 0,
  };
}
