import { describe, expect, it } from 'vitest';
import { contentSchema, isStale } from '@/lib/content-schema';
import { canonicalPathFor } from '@/lib/content-routing';

const common = {
  title: 'A useful page',
  description: 'A description long enough for the editorial content contract.',
  authors: ['All Things MCP Editors'],
  status: 'published' as const,
  tags: ['test'],
  publishedAt: '2026-08-30',
  updatedAt: '2026-08-30',
};

const guide = {
  ...common,
  contentType: 'guide' as const,
  section: 'guides' as const,
  guideCategory: 'learn' as const,
  outcome: 'Trace a complete MCP request through the core participants.',
  difficulty: 'beginner' as const,
  estimatedMinutes: 10,
  specVersion: '2026-07-28',
  lastVerified: '2026-08-30',
  steps: [{ id: 'trace-request', title: 'Trace the request' }],
};

const blog = {
  ...common,
  contentType: 'article' as const,
  section: 'blog' as const,
  blogTopic: 'architecture' as const,
  difficulty: 'intermediate' as const,
  estimatedMinutes: 12,
  specVersion: '2026-07-28',
  lastVerified: '2026-08-30',
};

const spec = {
  ...common,
  contentType: 'spec-release' as const,
  section: 'spec-watch' as const,
  officialSource: 'https://modelcontextprotocol.io/specification/2026-07-28',
  releaseDate: '2026-07-28',
  releaseStatus: 'stable' as const,
  changes: ['Makes protocol requests self-contained.'],
  clientImpact: ['Clients send metadata on each request.'],
  serverImpact: ['Servers implement discovery and stateless handling.'],
  productionImpact: ['Requests can reach any compatible server instance.'],
  recommendedActions: ['Test every supported client and server pairing.'],
  references: [
    {
      label: 'Specification',
      url: 'https://modelcontextprotocol.io/specification/2026-07-28',
    },
  ],
};

describe('principal content contracts', () => {
  it.each([guide, blog, spec])(
    'accepts complete $contentType content',
    (value) => {
      expect(contentSchema.safeParse(value).success).toBe(true);
    },
  );

  it('requires publication date for published content', () => {
    expect(
      contentSchema.safeParse({ ...guide, publishedAt: undefined }).success,
    ).toBe(false);
  });

  it('requires unique guide step IDs', () => {
    const steps = [guide.steps[0], guide.steps[0]];
    expect(contentSchema.safeParse({ ...guide, steps }).success).toBe(false);
  });

  it('rejects invalid guide categories', () => {
    expect(
      contentSchema.safeParse({ ...guide, guideCategory: 'ecosystem' }).success,
    ).toBe(false);
  });

  it('requires structured Spec Watch impacts', () => {
    expect(
      contentSchema.safeParse({ ...spec, clientImpact: undefined }).success,
    ).toBe(false);
  });

  it('rejects impossible calendar dates', () => {
    expect(
      contentSchema.safeParse({ ...blog, updatedAt: '2026-02-31' }).success,
    ).toBe(false);
  });
});

describe('canonical content paths', () => {
  it('maps principal and glossary content to public routes', () => {
    expect(canonicalPathFor('guide', 'start')).toBe('/guides/start');
    expect(canonicalPathFor('article', 'analysis')).toBe('/blog/analysis');
    expect(canonicalPathFor('spec-release', 'release')).toBe(
      '/spec-watch/release',
    );
    expect(canonicalPathFor('glossary', 'client')).toBe('/glossary/client');
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
