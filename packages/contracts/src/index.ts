import { z } from "zod";

export const runtimePrincipalSchema = z.object({
  sub: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  image: z.url().nullable().optional(),
});

export type RuntimePrincipal = z.infer<typeof runtimePrincipalSchema>;

export const runtimeSessionResponseSchema = z.object({
  authenticated: z.literal(true),
  principal: runtimePrincipalSchema,
});

export type RuntimeSessionResponse = z.infer<
  typeof runtimeSessionResponseSchema
>;

export const guideProgressSchema = z.object({
  version: z.literal(1),
  completedStepIds: z.array(z.string().min(1)),
  activeStepId: z.string().min(1).nullable().optional(),
  percent: z.number().int().min(0).max(100),
  updatedAt: z.iso.datetime(),
});

export type GuideProgress = z.infer<typeof guideProgressSchema>;

export const guideRunSchema = z.object({
  id: z.uuid(),
  userId: z.string().min(1),
  guideSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  progress: guideProgressSchema,
  simulatorState: z.json().nullable(),
  revision: z.number().int().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type GuideRun = z.infer<typeof guideRunSchema>;

export const upsertGuideRunRequestSchema = z.object({
  progress: guideProgressSchema,
  simulatorState: z.json().nullable().optional(),
  expectedRevision: z.number().int().positive().optional(),
});

export type UpsertGuideRunRequest = z.infer<typeof upsertGuideRunRequestSchema>;
