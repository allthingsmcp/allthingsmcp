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

export const mcpCapabilityKindSchema = z.enum(['tool', 'resource', 'prompt']);
export const mcpFieldSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_]*$/),
  type: z.enum(['string', 'number', 'boolean']),
  description: z.string().min(1),
  required: z.boolean(),
  enumValues: z.array(z.string().min(1)).optional(),
});

export const mcpCapabilityManifestSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  executorId: z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/),
  kind: mcpCapabilityKindSchema,
  name: z.string().regex(/^[a-z][a-z0-9_]*$/),
  title: z.string().min(1),
  description: z.string().min(1),
  fields: z.array(mcpFieldSchema),
  uri: z.string().optional(),
  mimeType: z.string().optional(),
  template: z.string().optional(),
});

export const mcpTemplateManifestSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  version: z.number().int().positive(),
  guideSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  description: z.string().min(1),
  serverVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  attribution: z.object({ label: z.string().min(1), url: z.url() }).optional(),
  capabilities: z.array(mcpCapabilityManifestSchema),
});

export type McpTemplateManifest = z.infer<typeof mcpTemplateManifestSchema>;
export type McpCapabilityManifest = z.infer<typeof mcpCapabilityManifestSchema>;

export const mcpWorkspaceConfigurationSchema = z.object({
  serverName: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  enabledCapabilityIds: z.array(z.string()).max(32),
});

export const mcpWorkspaceStatusSchema = z.enum(['active', 'paused']);
export const mcpWorkspaceSchema = z.object({
  id: z.uuid(),
  publicId: z.uuid(),
  guideSlug: z.string(),
  templateId: z.string(),
  templateVersion: z.number().int().positive(),
  configuration: mcpWorkspaceConfigurationSchema,
  status: mcpWorkspaceStatusSchema,
  revision: z.number().int().positive(),
  anonymous: z.boolean(),
  expiresAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const mcpProtocolEventSchema = z.object({
  id: z.string().min(1),
  sequence: z.number().int().positive(),
  method: z.string().min(1),
  status: z.enum(['request', 'response', 'error']),
  request: z.record(z.string(), z.unknown()),
  response: z.record(z.string(), z.unknown()),
  durationMs: z.number().nonnegative(),
  createdAt: z.iso.datetime(),
});

export const mcpWorkspaceCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('discover') }),
  z.object({ type: z.literal('call-tool'), name: z.string().min(1), arguments: z.record(z.string(), z.unknown()) }),
  z.object({ type: z.literal('read-resource'), uri: z.string().min(1) }),
  z.object({ type: z.literal('get-prompt'), name: z.string().min(1), arguments: z.record(z.string(), z.unknown()).default({}) }),
]);

export const mcpCommandResponseSchema = z.object({
  result: z.unknown(),
  events: z.array(mcpProtocolEventSchema),
});

export const createMcpWorkspaceRequestSchema = z.object({
  guideSlug: z.string(),
  templateId: z.string(),
  configuration: mcpWorkspaceConfigurationSchema,
});
export const updateMcpWorkspaceRequestSchema = z.object({
  configuration: mcpWorkspaceConfigurationSchema,
  expectedRevision: z.number().int().positive(),
});
export const mcpWorkspaceSessionSchema = z.object({
  workspace: mcpWorkspaceSchema,
  temporaryCredential: z.string().min(32).optional(),
});
export const mcpAccessTokenResponseSchema = z.object({
  token: z.string().min(32),
  tokenPrefix: z.string().min(4),
  endpoint: z.url(),
});

export type McpWorkspace = z.infer<typeof mcpWorkspaceSchema>;
export type McpWorkspaceConfiguration = z.infer<typeof mcpWorkspaceConfigurationSchema>;
export type McpWorkspaceCommand = z.infer<typeof mcpWorkspaceCommandSchema>;
export type McpProtocolEvent = z.infer<typeof mcpProtocolEventSchema>;
