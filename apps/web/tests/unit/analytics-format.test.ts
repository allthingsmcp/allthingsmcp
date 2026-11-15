import { describe, expect, it } from 'vitest';
import {
  axisLabel,
  change,
  countryFlag,
  relativeDay,
  tooltipLabel,
} from '@/lib/analytics/format';

describe('analytics formatting', () => {
  it('labels buckets for each interval in UTC', () => {
    const bucket = '2026-11-10T00:00:00.000Z';
    expect(axisLabel(bucket, 'day')).toBe('10 Nov');
    expect(tooltipLabel(bucket, 'day')).toBe('10 Nov · Tue');
    expect(tooltipLabel(bucket, 'week')).toBe('Week of 10 Nov');
    expect(axisLabel(bucket, 'month')).toBe('Nov 2026');
    expect(tooltipLabel('2026-11-15T14:00:00.000Z', 'hour')).toBe(
      '15 Nov · 14:00',
    );
  });

  it('describes recent days relative to now', () => {
    const now = new Date('2026-11-15T13:00:00Z');
    expect(relativeDay('2026-11-15T00:00:00Z', 'day', now)).toBe('Today');
    expect(relativeDay('2026-11-14T00:00:00Z', 'day', now)).toBe('Yesterday');
    expect(relativeDay('2026-11-10T00:00:00Z', 'day', now)).toBe('5 days ago');
    expect(relativeDay('2026-11-10T00:00:00Z', 'week', now)).toBeNull();
  });

  it('reports change, treating lower bounce rates as better', () => {
    expect(change(150, 100)).toEqual({ text: '+50%', tone: 'up' });
    expect(change(50, 100)).toEqual({ text: '-50%', tone: 'down' });
    expect(change(40, 50, true)).toEqual({ text: '-20%', tone: 'up' });
    expect(change(10, 0)).toBeNull();
  });

  it('builds flag emoji from country codes', () => {
    expect(countryFlag('NG')).toBe('🇳🇬');
    expect(countryFlag('(none)')).toBe('');
  });
});
