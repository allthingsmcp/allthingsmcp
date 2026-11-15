import {
  dashboardDimensions,
  type BreakdownRow,
  type DashboardData,
  type Dimension,
  type Filters,
  type ResolvedRange,
  type SeriesPoint,
} from '@/lib/analytics/queries';

/**
 * Generated sample data for previewing the dashboard in development
 * (`/admin/analytics?demo=1`). Deterministic for a given range, and never
 * used in production.
 */
function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const step: Record<ResolvedRange['interval'], number> = {
  hour: 3_600_000,
  day: 86_400_000,
  week: 7 * 86_400_000,
  month: 30.44 * 86_400_000,
};

const catalogue: Record<Dimension, Array<[string, number]>> = {
  route: [
    ['/', 30],
    ['/guides/[slug]/[step]', 22],
    ['/blog/[slug]', 21],
    ['/guides', 18],
    ['/guides/[slug]', 8],
    ['/blog', 6],
    ['/contribute', 3],
  ],
  path: [
    ['/', 30],
    ['/guides', 18],
    ['/blog/what-is-mcp', 14],
    ['/guides/build-mcp-tasks-with-sharp/understand-mcp-tasks', 11],
    ['/blog/how-mcp-tasks-work', 9],
    ['/guides/building-your-first-mcp-server', 8],
    ['/blog', 6],
    ['/contribute', 3],
    ['/about', 1],
  ],
  entry_path: [
    ['/', 34],
    ['/blog/what-is-mcp', 22],
    ['/guides', 14],
    ['/blog/how-mcp-tasks-work', 13],
    ['/guides/building-your-first-mcp-server', 9],
  ],
  referrer_host: [
    ['(none)', 41],
    ['google.com', 24],
    ['news.ycombinator.com', 11],
    ['linkedin.com', 9],
    ['x.com', 6],
    ['github.com', 5],
    ['modelcontextprotocol.io', 3],
  ],
  utm_source: [
    ['(none)', 78],
    ['newsletter', 12],
    ['linkedin', 7],
    ['x', 3],
  ],
  utm_medium: [
    ['(none)', 78],
    ['email', 12],
    ['social', 10],
  ],
  utm_campaign: [
    ['(none)', 80],
    ['tasks-launch', 14],
    ['weekly-digest', 6],
  ],
  country: [
    ['NG', 21],
    ['US', 19],
    ['GB', 11],
    ['DE', 8],
    ['IN', 8],
    ['CA', 5],
    ['FR', 4],
    ['NL', 3],
  ],
  device: [
    ['desktop', 62],
    ['mobile', 34],
    ['tablet', 4],
  ],
  browser: [
    ['Chrome', 52],
    ['Safari', 24],
    ['Firefox', 9],
    ['Edge', 8],
    ['Samsung Internet', 3],
  ],
  os: [
    ['macOS', 33],
    ['Windows', 27],
    ['iOS', 20],
    ['Android', 13],
    ['Linux', 7],
  ],
  hostname: [
    ['www.allthingsmcp.com', 91],
    ['allthingsmcp.com', 9],
  ],
  event: [
    ['search_used', 46],
    ['newsletter_cta', 24],
    ['repository_outbound', 18],
    ['contribution_cta', 8],
    ['page_edit', 4],
  ],
};

const sampleProps: Record<string, Array<[string, Array<[string, number]>]>> = {
  newsletter_cta: [
    [
      'surface',
      [
        ['footer', 55],
        ['homepage', 30],
        ['article', 15],
      ],
    ],
  ],
  repository_outbound: [
    [
      'target',
      [
        ['examples', 48],
        ['issues', 27],
        ['source', 25],
      ],
    ],
  ],
};

function rows(
  list: Array<[string, number]>,
  totals: { visitors: number; pageviews: number; events: number },
  eventsOnly = false,
): BreakdownRow[] {
  const sum = list.reduce((all, [, weight]) => all + weight, 0);
  return list.map(([value, weight]) => {
    const events = Math.round((totals.events * weight) / sum);
    return {
      value,
      // Each event is fired by fewer visitors than it is fired times.
      visitors: eventsOnly
        ? Math.max(1, Math.round(events * 0.7))
        : Math.max(1, Math.round((totals.visitors * weight) / sum)),
      pageviews: eventsOnly ? 0 : Math.round((totals.pageviews * weight) / sum),
      events,
    };
  });
}

export function demoDashboard(
  range: ResolvedRange,
  filters: Filters,
): DashboardData {
  const rand = random(
    Math.floor(range.from.getTime() / 3_600_000) ^ range.interval.length,
  );
  const length = Math.min(
    400,
    Math.max(
      1,
      Math.round(
        (range.to.getTime() - range.from.getTime()) / step[range.interval],
      ),
    ),
  );
  // Every active filter narrows the data, so clicking a row visibly changes it.
  const narrow = 0.38 ** Object.keys(filters).length;
  const perBucket = { hour: 7, day: 120, week: 650, month: 2600 }[
    range.interval
  ];

  const series: SeriesPoint[] = Array.from({ length }, (_, index) => {
    const at = new Date(range.from.getTime() + index * step[range.interval]);
    const weekday = at.getUTCDay();
    const weekly =
      range.interval === 'day'
        ? weekday === 0 || weekday === 6
          ? 0.7
          : 1.1
        : 1;
    const daytime =
      range.interval === 'hour'
        ? 0.45 +
          0.9 * Math.sin(((at.getUTCHours() - 6) / 24) * Math.PI * 2) ** 2
        : 1;
    const trend = 0.75 + (index / length) * 0.6;
    const visitors = Math.max(
      0,
      Math.round(
        perBucket * narrow * weekly * daytime * trend * (0.75 + rand() * 0.5),
      ),
    );
    const visits = Math.round(visitors * 1.15);
    return {
      bucket: at.toISOString(),
      visitors,
      pageviews: Math.round(visitors * (2.1 + rand() * 0.7)),
      visits,
      bounces: Math.round(visits * (0.38 + rand() * 0.16)),
    };
  });

  const pageviews = series.reduce((all, point) => all + point.pageviews, 0);
  const visitors = Math.round(
    series.reduce((all, point) => all + point.visitors, 0) * 0.72,
  );
  const visits = Math.round(visitors * 1.18);
  const events = Math.round(pageviews * 0.06);
  const previousScale = 0.86 + rand() * 0.1;
  const totals = { visitors, pageviews, events };

  const breakdowns = Object.fromEntries(
    dashboardDimensions.map((dimension) => [
      dimension,
      rows(catalogue[dimension], totals, dimension === 'event'),
    ]),
  ) as Record<Dimension, BreakdownRow[]>;

  return {
    summary: {
      visitors,
      visits,
      pageviews,
      events,
      bounces: Math.round(visits * 0.46),
    },
    previous: {
      visitors: Math.round(visitors * previousScale),
      visits: Math.round(visits * previousScale),
      pageviews: Math.round(pageviews * previousScale),
      events: Math.round(events * previousScale),
      bounces: Math.round(visits * previousScale * 0.5),
    },
    series,
    breakdowns,
    online: Math.floor(rand() * 5),
    props: (filters.event ? (sampleProps[filters.event] ?? []) : []).map(
      ([key, values]) => ({
        key,
        rows: rows(values, { ...totals, events: totals.events * 0.24 }, true),
      }),
    ),
  };
}
