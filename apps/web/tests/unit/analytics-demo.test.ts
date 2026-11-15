import { describe, expect, it } from 'vitest';
import { demoDashboard } from '@/lib/analytics/demo';
import { resolveRange } from '@/lib/analytics/queries';

const now = new Date('2026-11-15T13:45:00Z');

describe('dashboard sample data', () => {
  it.each(['today', '7d', '30d', '90d', '12m', 'all'])(
    'fills the %s range with a series that matches its interval',
    (key) => {
      const range = resolveRange({ range: key }, now);
      const data = demoDashboard(range, {});
      expect(data.series.length).toBeGreaterThan(0);
      expect(data.series.length).toBeLessThanOrEqual(400);
      expect(data.summary.pageviews).toBeGreaterThan(0);
      expect(data.summary.visitors).toBeLessThanOrEqual(data.summary.pageviews);
      for (const rows of Object.values(data.breakdowns))
        expect(rows.length).toBeGreaterThan(0);
    },
  );

  it('keeps event visitors at or below event totals', () => {
    const data = demoDashboard(resolveRange({}, now), {});
    for (const row of data.breakdowns.event)
      expect(row.visitors).toBeLessThanOrEqual(row.events);
    for (const point of data.series)
      expect(point.bounces).toBeLessThanOrEqual(point.visits);
  });

  it('is deterministic for a range', () => {
    const range = resolveRange({}, now);
    expect(demoDashboard(range, {})).toEqual(demoDashboard(range, {}));
  });

  it('shrinks when filters are applied and lists event properties', () => {
    const range = resolveRange({}, now);
    const all = demoDashboard(range, {});
    const narrowed = demoDashboard(range, { country: 'NG' });
    expect(narrowed.summary.pageviews).toBeLessThan(all.summary.pageviews);
    expect(
      demoDashboard(range, { event: 'newsletter_cta' }).props,
    ).toHaveLength(1);
    expect(all.props).toHaveLength(0);
  });
});
