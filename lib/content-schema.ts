import { pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';

const isoDate = z
  .union([
    z.string(),
    z.date().transform((value) => value.toISOString().slice(0, 10)),
  ])
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'))
  .refine(
    (value) =>
      !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
      new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value,
    'Use a real calendar date',
  );

export const guideCategories = [
  'learn',
  'build',
  'operate',
  'security',
] as const;
export type GuideCategory = (typeof guideCategories)[number];

export const blogTopics = [
  'concepts',
  'architecture',
  'security',
  'production',
  'ecosystem',
  'opinion',
] as const;
export type BlogTopic = (typeof blogTopics)[number];

export const guideStepSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(3),
  estimatedMinutes: z.number().int().positive().optional(),
});
export type GuideStep = z.infer<typeof guideStepSchema>;

export const officialReferenceSchema = z.object({
  label: z.string().min(2),
  url: z.string().url(),
});

export const contentTypes = [
  'guide',
  'article',
  'tutorial',
  'learning-path',
  'lesson',
  'glossary',
  'spec-release',
  'spec-proposal',
  'ecosystem',
  'tool',
] as const;

export const contentSchema = pageSchema
  .extend({
    description: z.string().min(24),
    contentType: z.enum(contentTypes),
    section: z.enum([
      'guides',
      'blog',
      'learn',
      'build',
      'operate',
      'security',
      'ecosystem',
      'spec-watch',
      'tools',
    ]),
    authors: z.array(z.string().min(1)).min(1),
    status: z.enum(['draft', 'published']),
    tags: z.array(z.string()).min(1),
    publishedAt: isoDate.optional(),
    updatedAt: isoDate,
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    estimatedMinutes: z.number().int().positive().optional(),
    specVersion: isoDate.optional(),
    lastVerified: isoDate.optional(),
    prerequisites: z.array(z.string()).optional(),
    guideCategory: z.enum(guideCategories).optional(),
    outcome: z.string().min(20).optional(),
    steps: z.array(guideStepSchema).min(1).optional(),
    blogTopic: z.enum(blogTopics).optional(),
    substackUrl: z.string().url().optional(),
    language: z.string().optional(),
    sdk: z.string().optional(),
    sdkVersion: z.string().optional(),
    transport: z.string().optional(),
    authenticationModel: z.string().optional(),
    repository: z.string().url().optional(),
    lastTested: isoDate.optional(),
    glossaryCategory: z
      .enum([
        'protocol',
        'primitives',
        'transport',
        'security',
        'lifecycle',
        'ecosystem',
      ])
      .optional(),
    relatedTerms: z.array(z.string()).optional(),
    lessonOrder: z.number().int().positive().optional(),
    officialSource: z.string().url().optional(),
    releaseDate: isoDate.optional(),
    releaseStatus: z.enum(['stable', 'draft', 'proposed']).optional(),
    changes: z.array(z.string().min(8)).min(1).optional(),
    clientImpact: z.array(z.string().min(8)).min(1).optional(),
    serverImpact: z.array(z.string().min(8)).min(1).optional(),
    productionImpact: z.array(z.string().min(8)).min(1).optional(),
    recommendedActions: z.array(z.string().min(8)).min(1).optional(),
    references: z.array(officialReferenceSchema).min(1).optional(),
    projectType: z
      .enum([
        'server',
        'client',
        'sdk',
        'gateway',
        'registry',
        'developer-tool',
      ])
      .optional(),
    reviewStatus: z.enum(['not-reviewed', 'in-review', 'reviewed']).optional(),
    toolStatus: z.enum(['planned', 'prototype', 'available']).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === 'published' && !value.publishedAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['publishedAt'],
        message: 'Published content requires publishedAt',
      });
    }

    if (value.contentType === 'guide') {
      for (const field of [
        'guideCategory',
        'outcome',
        'difficulty',
        'estimatedMinutes',
        'specVersion',
        'lastVerified',
        'steps',
      ] as const) {
        if (value[field] === undefined) {
          ctx.addIssue({
            code: 'custom',
            path: [field],
            message: `Guides require ${field}`,
          });
        }
      }
      const ids = value.steps?.map((step) => step.id) ?? [];
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['steps'],
          message: 'Guide step IDs must be unique',
        });
      }
    }

    if (value.contentType === 'article') {
      for (const field of [
        'blogTopic',
        'difficulty',
        'estimatedMinutes',
        'specVersion',
        'lastVerified',
      ] as const) {
        if (value[field] === undefined) {
          ctx.addIssue({
            code: 'custom',
            path: [field],
            message: `Technical Blog posts require ${field}`,
          });
        }
      }
    }

    if (['tutorial', 'lesson'].includes(value.contentType)) {
      for (const field of [
        'difficulty',
        'estimatedMinutes',
        'specVersion',
        'lastVerified',
      ] as const) {
        if (value[field] === undefined) {
          ctx.addIssue({
            code: 'custom',
            path: [field],
            message: `Technical content requires ${field}`,
          });
        }
      }
    }

    if (value.contentType === 'glossary' && !value.glossaryCategory) {
      ctx.addIssue({
        code: 'custom',
        path: ['glossaryCategory'],
        message: 'Glossary terms require a category',
      });
    }

    if (value.contentType.startsWith('spec-')) {
      for (const field of [
        'officialSource',
        'releaseDate',
        'releaseStatus',
        'changes',
        'clientImpact',
        'serverImpact',
        'productionImpact',
        'recommendedActions',
        'references',
      ] as const) {
        if (value[field] === undefined) {
          ctx.addIssue({
            code: 'custom',
            path: [field],
            message: `Spec Watch entries require ${field}`,
          });
        }
      }
    }

    if (
      value.contentType === 'ecosystem' &&
      (!value.projectType || !value.reviewStatus)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['reviewStatus'],
        message: 'Ecosystem entries require type and review status',
      });
    }
    if (value.contentType === 'tool' && !value.toolStatus) {
      ctx.addIssue({
        code: 'custom',
        path: ['toolStatus'],
        message: 'Tools require a lifecycle status',
      });
    }
  });

export type ContentFrontmatter = z.infer<typeof contentSchema>;
export type GuideFrontmatter = ContentFrontmatter & {
  contentType: 'guide';
  guideCategory: GuideCategory;
  outcome: string;
  steps: GuideStep[];
};
export type BlogPostFrontmatter = ContentFrontmatter & {
  contentType: 'article';
  blogTopic: BlogTopic;
};
export type SpecWatchFrontmatter = ContentFrontmatter & {
  contentType: 'spec-release' | 'spec-proposal';
  changes: string[];
  clientImpact: string[];
  serverImpact: string[];
  productionImpact: string[];
  recommendedActions: string[];
  references: Array<{ label: string; url: string }>;
};

export function isStale(lastVerified: string | undefined, now = new Date()) {
  if (!lastVerified) return false;
  const verified = new Date(`${lastVerified}T00:00:00Z`);
  return now.getTime() - verified.getTime() > 180 * 24 * 60 * 60 * 1000;
}
