import Link from 'next/link';
import { IgnoreThisBrowser } from '@/components/admin-analytics/client-controls';
import {
  MetricChart,
  type MetricCard,
} from '@/components/admin-analytics/metric-chart';
import { RangeMenu } from '@/components/admin-analytics/range-menu';
import {
  TabbedPanel,
  type PanelRow,
  type PanelTab,
} from '@/components/admin-analytics/tabbed-panel';
import {
  change,
  countryFlag,
  countryName,
  integer,
} from '@/lib/analytics/format';
import {
  dashboardHref,
  rangeOptions,
  type BreakdownRow,
  type DashboardData,
  type Dimension,
  type FilterKey,
  type Filters,
  type ResolvedRange,
} from '@/lib/analytics/queries';

const filterLabels: Record<FilterKey, string> = {
  hostname: 'Hostname',
  path: 'Page',
  entry_path: 'Entry page',
  event: 'Event',
  referrer_host: 'Referrer',
  utm_source: 'UTM source',
  utm_medium: 'UTM medium',
  utm_campaign: 'UTM campaign',
  utm_term: 'UTM term',
  utm_content: 'UTM content',
  country: 'Country',
  device: 'Device',
  browser: 'Browser',
  os: 'OS',
};

function displayValue(key: FilterKey | Dimension, value: string) {
  if (value === '(none)') return key === 'referrer_host' ? 'Direct' : 'None';
  if (key === 'country') return countryName(value);
  if (key === 'device') return value[0]!.toUpperCase() + value.slice(1);
  return value;
}

type Context = { range: ResolvedRange; filters: Filters };

/** Count rows: bar and number follow visitors. */
function countRows(
  rows: BreakdownRow[],
  dimension: FilterKey | null,
  context: Context,
  labelDimension: FilterKey | Dimension = dimension ?? 'path',
): PanelRow[] {
  return rows.map((row) => ({
    key: row.value,
    label: displayValue(labelDimension, row.value),
    href: dimension
      ? dashboardHref(context.range, context.filters, {
          [dimension]: row.value,
        })
      : undefined,
    value: row.visitors,
    display: integer.format(row.visitors),
  }));
}

/** Share rows: each row as a percentage of the list's visitors. */
function shareRows(
  rows: BreakdownRow[],
  dimension: FilterKey,
  context: Context,
): PanelRow[] {
  const total = rows.reduce((sum, row) => sum + row.visitors, 0) || 1;
  return rows.map((row) => ({
    key: row.value,
    label: displayValue(dimension, row.value),
    icon: dimension === 'country' ? countryFlag(row.value) : undefined,
    href: dashboardHref(context.range, context.filters, {
      [dimension]: row.value,
    }),
    value: row.visitors,
    display: `${Math.round((row.visitors / total) * 100)}%`,
  }));
}

function utmRows(data: DashboardData, context: Context): PanelRow[] {
  const keys = ['utm_source', 'utm_medium', 'utm_campaign'] as const;
  return keys
    .flatMap((key) =>
      data.breakdowns[key]
        .filter((row) => row.value !== '(none)')
        .map((row) => ({ key, row })),
    )
    .sort((a, b) => b.row.visitors - a.row.visitors)
    .map(({ key, row }) => ({
      key: `${key}=${row.value}`,
      label: `${key}=${row.value}`,
      href: dashboardHref(context.range, context.filters, {
        [key]: row.value,
      }),
      value: row.visitors,
      display: integer.format(row.visitors),
    }));
}

function eventRows(
  rows: BreakdownRow[],
  context: Context,
  filter: boolean,
): PanelRow[] {
  return rows.map((row) => ({
    key: row.value,
    label: row.value,
    href: filter
      ? dashboardHref(context.range, context.filters, { event: row.value })
      : undefined,
    value: row.visitors,
    display: integer.format(row.visitors),
    secondary: integer.format(row.events),
  }));
}

function metricCards(data: DashboardData): MetricCard[] {
  const bounce = (summary: DashboardData['summary']) =>
    summary.visits ? (summary.bounces / summary.visits) * 100 : 0;
  return [
    {
      key: 'visitors',
      label: 'Visitors',
      value: integer.format(data.summary.visitors),
      change: change(data.summary.visitors, data.previous.visitors),
    },
    {
      key: 'pageviews',
      label: 'Page views',
      value: integer.format(data.summary.pageviews),
      change: change(data.summary.pageviews, data.previous.pageviews),
    },
    {
      key: 'bounce',
      label: 'Bounce rate',
      value: `${Math.round(bounce(data.summary))}%`,
      change: change(bounce(data.summary), bounce(data.previous), true),
    },
  ];
}

export function AnalyticsDashboard({
  data,
  range,
  filters,
  hostname,
}: {
  data: DashboardData;
  range: ResolvedRange;
  filters: Filters;
  hostname: string;
}) {
  const context = { range, filters };
  const active = Object.entries(filters) as Array<[FilterKey, string]>;
  const b = data.breakdowns;
  const rangeLabel =
    range.key === 'custom'
      ? `${range.fromDate} – ${range.toDate}`
      : (rangeOptions.find((option) => option.key === range.key)?.label ??
        '30 days');

  const pages: PanelTab[] = [
    {
      id: 'pages',
      label: 'Pages',
      column: 'Visitors',
      rows: countRows(b.path, 'path', context),
    },
    {
      id: 'routes',
      label: 'Routes',
      column: 'Visitors',
      rows: countRows(b.route, null, context, 'path'),
    },
    {
      id: 'entry',
      label: 'Entry pages',
      column: 'Visitors',
      rows: countRows(b.entry_path, 'entry_path', context),
    },
    {
      id: 'hostnames',
      label: 'Hostnames',
      column: 'Visitors',
      rows: countRows(b.hostname, 'hostname', context),
    },
  ];
  const sources: PanelTab[] = [
    {
      id: 'referrers',
      label: 'Referrers',
      column: 'Visitors',
      rows: countRows(b.referrer_host, 'referrer_host', context),
    },
    {
      id: 'utm',
      label: 'UTM parameters',
      column: 'Visitors',
      rows: utmRows(data, context),
    },
  ];
  const events: PanelTab[] = [
    {
      id: 'events',
      label: 'Events',
      column: 'Visitors',
      secondaryColumn: 'Total',
      rows: eventRows(b.event, context, true),
    },
    ...data.props.map((prop) => ({
      id: `prop-${prop.key}`,
      label: `${filters.event} · ${prop.key}`,
      column: 'Visitors',
      secondaryColumn: 'Total',
      rows: eventRows(prop.rows, context, false),
    })),
  ];
  const hidden: Array<[string, string]> = [
    ...(range.demo ? ([['demo', '1']] as Array<[string, string]>) : []),
    ...active,
  ];

  return (
    <main id="main-content" className="shell analytics-page">
      <header className="analytics-header">
        <div className="analytics-header__title">
          <h1>Analytics</h1>
          <p className="analytics-header__meta">
            <span>{hostname}</span>
            <span className="analytics-online">
              <span className="analytics-online__dot" aria-hidden="true" />
              {integer.format(data.online)} online
            </span>
          </p>
        </div>
        <div className="analytics-header__actions">
          <Link className="analytics-header__link" href="/admin/links">
            Campaign links
          </Link>
          <RangeMenu
            label={rangeLabel}
            current={range.key}
            choices={rangeOptions.map((option) => ({
              key: option.key,
              label: option.label,
              href: dashboardHref(range, filters, {}, option.key),
            }))}
            custom={{ from: range.fromDate, to: range.toDate, hidden }}
          />
        </div>
      </header>

      <div className="analytics-notes">
        {range.demo && (
          <p className="analytics-demo" role="note">
            Sample data for previewing the layout. This is not your real
            analytics.
          </p>
        )}
        <p>All times are UTC. A visit is one visitor on one day.</p>
        <IgnoreThisBrowser />
      </div>

      {active.length > 0 && (
        <div className="analytics-filters" aria-label="Active filters">
          {active.map(([key, value]) => (
            <Link
              key={key}
              className="analytics-filter"
              href={dashboardHref(range, filters, { [key]: null })}
            >
              <span className="analytics-filter__key">{filterLabels[key]}</span>
              {displayValue(key, value)}
              <span aria-hidden="true">×</span>
              <span className="sr-only"> (remove filter)</span>
            </Link>
          ))}
          <Link
            className="analytics-filters__clear"
            href={dashboardHref(range, {})}
          >
            Clear all
          </Link>
        </div>
      )}

      <MetricChart
        cards={metricCards(data)}
        series={data.series}
        interval={range.interval}
        partial={range.partial}
      />

      <div className="analytics-grid analytics-grid--two">
        <TabbedPanel tabs={pages} />
        <TabbedPanel tabs={sources} />
      </div>
      <div className="analytics-grid analytics-grid--three">
        <TabbedPanel
          tabs={[
            {
              id: 'countries',
              label: 'Countries',
              column: 'Visitors',
              rows: shareRows(b.country, 'country', context),
            },
          ]}
        />
        <TabbedPanel
          tabs={[
            {
              id: 'devices',
              label: 'Devices',
              column: 'Visitors',
              rows: shareRows(b.device, 'device', context),
            },
            {
              id: 'browsers',
              label: 'Browsers',
              column: 'Visitors',
              rows: shareRows(b.browser, 'browser', context),
            },
          ]}
        />
        <TabbedPanel
          tabs={[
            {
              id: 'os',
              label: 'Operating systems',
              column: 'Visitors',
              rows: shareRows(b.os, 'os', context),
            },
          ]}
        />
      </div>
      <TabbedPanel tabs={events} emptyText="No custom events in this period." />
    </main>
  );
}
