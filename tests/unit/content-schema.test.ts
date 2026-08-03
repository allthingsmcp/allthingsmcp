import { describe, expect, it } from 'vitest';
import { contentSchema, isStale } from '@/lib/content-schema';

const base = {
  title: 'A useful page',
  description: 'A description long enough for the editorial content contract.',
  contentType: 'guide' as const,
  section: 'learn' as const,
  authors: ['All Things MCP Editors'],
  status: 'published' as const,
  tags: ['test'],
  publishedAt: '2026-08-03',
  updatedAt: '2026-08-03',
  difficulty: 'beginner' as const,
  estimatedMinutes: 10,
  specVersion: '2025-11-25',
  lastVerified: '2026-08-03',
};

describe('content contract', () => {
  it('accepts complete technical content', () =>
    expect(contentSchema.safeParse(base).success).toBe(true));

  it('requires publication date for published content', () => {
    const invalid = { ...base, publishedAt: undefined };
    expect(contentSchema.safeParse(invalid).success).toBe(false);
  });

  it('requires technical metadata for a guide', () => {
    const invalid = { ...base, lastVerified: undefined };
    expect(contentSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects impossible calendar dates', () => {
    expect(
      contentSchema.safeParse({ ...base, updatedAt: '2026-02-31' }).success,
    ).toBe(false);
  });
});

describe('stale content', () => {
  it('warns after 180 days', () =>
    expect(isStale('2025-01-01', new Date('2025-07-02T00:00:01Z'))).toBe(true));
  it('does not warn inside the window', () =>
    expect(isStale('2025-01-01', new Date('2025-06-30T00:00:00Z'))).toBe(
      false,
    ));
});
