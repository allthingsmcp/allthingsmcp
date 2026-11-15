import { describe, expect, it } from 'vitest';
import {
  dashboardHref,
  parseFilters,
  resolveRange,
} from '@/lib/analytics/queries';

const now = new Date('2026-11-15T13:45:00Z');

describe('dashboard ranges', () => {
  it('defaults to the last 30 days, including today', () => {
    const range = resolveRange({}, now);
    expect(range.key).toBe('30d');
    expect(range.from.toISOString()).toBe('2026-10-17T00:00:00.000Z');
    expect(range.to.toISOString()).toBe('2026-11-16T00:00:00.000Z');
    expect(range.previousFrom.toISOString()).toBe('2026-09-17T00:00:00.000Z');
    expect(range.interval).toBe('day');
    expect(range.partial).toBe(true);
    expect([range.fromDate, range.toDate]).toEqual([
      '2026-10-17',
      '2026-11-15',
    ]);
  });

  it('uses hours for today and months for 12 months', () => {
    expect(resolveRange({ range: 'today' }, now)).toMatchObject({
      interval: 'hour',
      fromDate: '2026-11-15',
      toDate: '2026-11-15',
    });
    const year = resolveRange({ range: '12m' }, now);
    expect(year.interval).toBe('month');
    expect(year.from.toISOString()).toBe('2025-12-01T00:00:00.000Z');
    expect(year.to.toISOString()).toBe('2026-12-01T00:00:00.000Z');
  });

  it('starts all time at the first event', () => {
    const range = resolveRange(
      { range: 'all' },
      now,
      new Date('2026-01-20T09:00:00Z'),
    );
    expect(range.fromDate).toBe('2026-01-20');
    expect(range.interval).toBe('week');
  });

  it('accepts a valid custom range and falls back otherwise', () => {
    const custom = resolveRange(
      { range: 'custom', from: '2026-11-01', to: '2026-11-07' },
      now,
    );
    expect(custom.key).toBe('custom');
    expect(custom.partial).toBe(false);
    expect(custom.to.toISOString()).toBe('2026-11-08T00:00:00.000Z');
    expect(
      resolveRange(
        { range: 'custom', from: '2026-11-07', to: '2026-11-01' },
        now,
      ).key,
    ).toBe('30d');
    expect(resolveRange({ range: 'custom', from: 'nope' }, now).key).toBe(
      '30d',
    );
  });
});

describe('dashboard filters and links', () => {
  it('keeps only known filter keys', () => {
    expect(
      parseFilters({ path: '/guides', country: ['NG', 'US'], evil: 'x' }),
    ).toEqual({ path: '/guides', country: 'NG' });
  });

  it('builds links that add, replace and remove filters', () => {
    const range = resolveRange({ range: '7d' }, now);
    expect(dashboardHref(range, {}, { path: '/blog' })).toBe(
      '/admin/analytics?range=7d&path=%2Fblog',
    );
    expect(dashboardHref(range, { path: '/blog' }, { path: null })).toBe(
      '/admin/analytics?range=7d',
    );
    expect(dashboardHref(resolveRange({}, now), {})).toBe('/admin/analytics');
    const custom = resolveRange(
      { range: 'custom', from: '2026-11-01', to: '2026-11-07' },
      now,
    );
    expect(dashboardHref(custom, { country: 'NG' })).toBe(
      '/admin/analytics?range=custom&from=2026-11-01&to=2026-11-07&country=NG',
    );
  });
});
