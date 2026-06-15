// MemWal Studio - Zod Schemas
// Validation schemas for all external and persisted data

import { z } from "zod";

export const storageModeSchema = z.enum(["WALRUS", "MEMWAL"]);

export const memoryTypeSchema = z.enum([
  "observation",
  "tool_call",
  "tool_result",
  "plan",
  "reasoning",
  "decision",
  "summary",
  "warning",
  "error",
]);

export const permissionSchema = z.enum(["read", "write", "admin"]);

export const grantStatusSchema = z.enum(["active", "revoked"]);

export const runStatusSchema = z.enum(["running", "completed", "failed"]);

export const runEventKindSchema = z.enum([
  "prompt",
  "plan",
  "tool_call",
  "tool_result",
  "memory_write",
  "artifact_create",
  "decision",
  "recall",
  "output",
  "warning",
  "error",
]);

export const memorySpaceSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(128),
  description: z.string().max(1024),
  owner: z.string().min(1),
  tags: z.array(z.string()),
  storageMode: storageModeSchema,
  indexBlobId: z.string().nullable(),
  suiObjectId: z.string().nullable(),
  suiTxDigest: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const agentProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(64),
  role: z.string().min(1).max(128),
  model: z.string(),
  suiAddress: z.string().nullable(),
  createdAt: z.string(),
});

export const storageReceiptSchema = z.object({
  blobId: z.string(),
  storageMode: storageModeSchema,
  contentHash: z.string(),
  storedAt: z.string(),
  aggregatorUrl: z.string().nullable(),
});

export const recallTraceSchema = z.object({
  id: z.string(),
  sourceMemoryId: z.string(),
  sourceAgentId: z.string(),
  recalledByAgentId: z.string(),
  recalledAtRunId: z.string(),
  similarityScore: z.number().nullable(),
  retrievedVia: z.enum(["semantic", "keyword", "id-lookup"]),
  createdAt: z.string(),
});

export const memoryItemSchema = z.object({
  id: z.string(),
  spaceId: z.string(),
  runId: z.string(),
  agentId: z.string(),
  type: memoryTypeSchema,
  title: z.string().min(1).max(256),
  content: z.string(),
  parents: z.array(z.string()),
  artifactIds: z.array(z.string()),
  tags: z.array(z.string()),
  importance: z.number().min(0).max(5),
  visibility: z.enum(["private", "shared"]),
  contentHash: z.string(),
  storageReceipt: storageReceiptSchema.nullable(),
  recallTraces: z.array(recallTraceSchema),
  createdAt: z.string(),
});

export const artifactSchema = z.object({
  id: z.string(),
  spaceId: z.string(),
  runId: z.string(),
  agentId: z.string(),
  filename: z.string().min(1),
  mimeType: z.string(),
  sizeBytes: z.number(),
  content: z.string(),
  contentHash: z.string(),
  derivedFromMemoryIds: z.array(z.string()),
  storageReceipt: storageReceiptSchema.nullable(),
  createdAt: z.string(),
});

export const runEventSchema = z.object({
  id: z.string(),
  runId: z.string(),
  kind: runEventKindSchema,
  timestamp: z.string(),
  data: z.string(),
  linkedMemoryIds: z.array(z.string()),
  linkedArtifactIds: z.array(z.string()),
});

export const agentRunSchema = z.object({
  id: z.string(),
  spaceId: z.string(),
  agentId: z.string(),
  agentName: z.string(),
  status: runStatusSchema,
  prompt: z.string(),
  events: z.array(runEventSchema),
  memoryIds: z.array(z.string()),
  artifactIds: z.array(z.string()),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  error: z.string().nullable(),
});

export const accessGrantSchema = z.object({
  id: z.string(),
  spaceId: z.string(),
  agentId: z.string(),
  agentName: z.string(),
  permission: permissionSchema,
  status: grantStatusSchema,
  granterAgentId: z.string(),
  grantedAt: z.string(),
  revokedAt: z.string().nullable(),
  expiresAtMs: z.number().nullable(),
  suiTxDigest: z.string().nullable(),
  grantTxDigest: z.string().nullable(),
  revokeTxDigest: z.string().nullable(),
});

export const memoryEnvelopeSchema = z.object({
  version: z.literal("1"),
  kind: z.literal("memwal_studio_memory"),
  spaceId: z.string(),
  runId: z.string(),
  agentId: z.string(),
  type: memoryTypeSchema,
  title: z.string(),
  content: z.string(),
  parents: z.array(z.string()),
  artifactIds: z.array(z.string()),
  tags: z.array(z.string()),
  importance: z.number(),
  visibility: z.enum(["private", "shared"]),
  createdAt: z.string(),
});

export type MemoryEnvelope = z.infer<typeof memoryEnvelopeSchema>;

// Create input schemas (for new records)
export const createMemorySpaceInputSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(1024).default(""),
  owner: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

export const createAgentInputSchema = z.object({
  name: z.string().min(1).max(64),
  role: z.string().min(1).max(128),
  model: z.string().default("gpt-4"),
  suiAddress: z.string().nullable().default(null),
});

export const createMemoryInputSchema = z.object({
  spaceId: z.string(),
  runId: z.string(),
  agentId: z.string(),
  type: memoryTypeSchema,
  title: z.string().min(1).max(256),
  content: z.string(),
  parents: z.array(z.string()).default([]),
  artifactIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  importance: z.number().min(0).max(5).default(3),
  visibility: z.enum(["private", "shared"]).default("shared"),
});

export const createArtifactInputSchema = z.object({
  spaceId: z.string(),
  runId: z.string(),
  agentId: z.string(),
  filename: z.string().min(1),
  mimeType: z.string(),
  content: z.string(),
  derivedFromMemoryIds: z.array(z.string()).default([]),
});

export const createAccessGrantInputSchema = z.object({
  spaceId: z.string(),
  agentId: z.string(),
  agentName: z.string(),
  permission: permissionSchema,
  granterAgentId: z.string(),
  expiresAtMs: z.number().nullable().default(null),
});
