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
  outcome: 'Complete a practical outcome by following the ordered guide steps.',
  guideSteps: [
    {
      id: 'prepare',
      title: 'Prepare',
      description: 'Prepare the environment and required dependencies.',
      estimatedMinutes: 5,
    },
    {
      id: 'build',
      title: 'Build',
      description: 'Build and inspect the smallest working implementation.',
      estimatedMinutes: 10,
    },
  ],
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

  it('requires ordered, uniquely identified guide steps', () => {
    const missing = { ...base, guideSteps: undefined };
    const duplicate = {
      ...base,
      guideSteps: [base.guideSteps[0], base.guideSteps[0]],
    };
    expect(contentSchema.safeParse(missing).success).toBe(false);
    expect(contentSchema.safeParse(duplicate).success).toBe(false);
  });

  it('allows a registered interactive Guide only on a Guide overview', () => {
    const interactive = {
      ...base,
      interactiveGuideId: 'building-your-first-mcp-server' as const,
    };
    expect(contentSchema.safeParse(interactive).success).toBe(true);
    expect(
      contentSchema.safeParse({
        ...interactive,
        contentType: 'guide-step' as const,
        guideSlug: 'example',
        guideStepId: 'prepare',
        guideStepOrder: 1,
      }).success,
    ).toBe(false);
  });

  it('requires parent and ordering metadata for guide steps', () => {
    const step = {
      ...base,
      contentType: 'guide-step' as const,
      outcome: undefined,
      guideSteps: undefined,
      guideSlug: 'build-a-server',
      guideStepId: 'prepare',
      guideStepOrder: 1,
    };
    expect(contentSchema.safeParse(step).success).toBe(true);
    expect(
      contentSchema.safeParse({ ...step, guideStepId: undefined }).success,
    ).toBe(false);
  });

  it('requires a topic for blog posts', () => {
    const invalid = {
      ...base,
      contentType: 'article' as const,
      section: 'blog' as const,
    };
    const valid = { ...invalid, blogTopic: 'architecture' as const };
    expect(contentSchema.safeParse(invalid).success).toBe(false);
    expect(contentSchema.safeParse(valid).success).toBe(true);
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
