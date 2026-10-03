import { pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';
import { interactiveGuideIds } from '@/lib/interactive-guides';

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

export const contentTypes = [
  'guide',
  'guide-step',
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

export const guideStepSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase hyphenated ID'),
  title: z.string().min(3),
  description: z.string().min(16),
  estimatedMinutes: z.number().int().positive().optional(),
});

const guideStepsSchema = z
  .array(guideStepSchema)
  .min(2)
  .superRefine((steps, ctx) => {
    const seen = new Set<string>();
    for (const [index, step] of steps.entries()) {
      if (seen.has(step.id)) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'id'],
          message: 'Guide step IDs must be unique',
        });
      }
      seen.add(step.id);
    }
  });

export const guideResourceSchema = z.object({
  title: z.string().min(2),
  url: z.string().url(),
});

export const contentSchema = pageSchema
  .extend({
    description: z.string().min(24),
    contentType: z.enum(contentTypes),
    section: z.enum([
      'learn',
      'build',
      'operate',
      'security',
      'blog',
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
    blogTopic: z
      .enum([
        'concepts',
        'architecture',
        'security',
        'production',
        'ecosystem',
        'opinion',
      ])
      .optional(),
    substackUrl: z.string().url().optional(),
    outcome: z.string().min(24).optional(),
    interactiveGuideId: z.enum(interactiveGuideIds).optional(),
    guideSteps: guideStepsSchema.optional(),
    guideResources: z.array(guideResourceSchema).optional(),
    guideSlug: z.string().min(1).optional(),
    guideStepId: z.string().min(1).optional(),
    guideStepOrder: z.number().int().positive().optional(),
    prerequisites: z.array(z.string()).optional(),
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
    releaseStatus: z.enum(['stable', 'draft', 'proposed']).optional(),
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

    if (
      ['guide', 'guide-step', 'article', 'tutorial', 'lesson'].includes(
        value.contentType,
      )
    ) {
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

    if (
      value.contentType === 'guide' &&
      (!value.outcome || !value.guideSteps)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['guideSteps'],
        message: 'Guides require an outcome and at least two ordered steps',
      });
    }

    if (value.interactiveGuideId && value.contentType !== 'guide') {
      ctx.addIssue({
        code: 'custom',
        path: ['interactiveGuideId'],
        message: 'Only Guide overviews may declare interactiveGuideId',
      });
    }

    if (
      value.contentType === 'guide-step' &&
      (!value.guideSlug || !value.guideStepId || !value.guideStepOrder)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['guideStepId'],
        message: 'Guide steps require a guide slug, step ID, and step order',
      });
    }

    if (value.contentType === 'article' && !value.blogTopic) {
      ctx.addIssue({
        code: 'custom',
        path: ['blogTopic'],
        message: 'Blog posts require blogTopic',
      });
    }

    if (value.contentType === 'glossary' && !value.glossaryCategory) {
      ctx.addIssue({
        code: 'custom',
        path: ['glossaryCategory'],
        message: 'Glossary terms require a category',
      });
    }
    if (
      value.contentType.startsWith('spec-') &&
      (!value.officialSource || !value.releaseStatus)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['officialSource'],
        message: 'Spec Watch entries require source and status',
      });
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
export type GuideStep = z.infer<typeof guideStepSchema>;
export type GuideResource = z.infer<typeof guideResourceSchema>;

export function isStale(lastVerified: string | undefined, now = new Date()) {
  if (!lastVerified) return false;
  const verified = new Date(`${lastVerified}T00:00:00Z`);
  return now.getTime() - verified.getTime() > 180 * 24 * 60 * 60 * 1000;
}
