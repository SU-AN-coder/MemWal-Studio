// MemWal Studio - Domain Types
// Core type definitions for the agent memory operating layer

export type StorageMode = "MOCK" | "WALRUS" | "MEMWAL";

export type MemoryType =
  | "observation"
  | "tool_call"
  | "tool_result"
  | "plan"
  | "reasoning"
  | "decision"
  | "summary"
  | "warning"
  | "error";

export type Permission = "read" | "write" | "admin";

export type GrantStatus = "active" | "revoked";

export type RunStatus = "running" | "completed" | "failed";

export type RunEventKind =
  | "prompt"
  | "plan"
  | "tool_call"
  | "tool_result"
  | "memory_write"
  | "artifact_create"
  | "decision"
  | "recall"
  | "output"
  | "warning"
  | "error";

export interface MemorySpace {
  id: string;
  name: string;
  description: string;
  owner: string;
  tags: string[];
  storageMode: StorageMode;
  indexBlobId: string | null;
  suiObjectId: string | null;
  suiTxDigest: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  model: string;
  suiAddress: string | null;
  createdAt: string;
}

export interface MemoryItem {
  id: string;
  spaceId: string;
  runId: string;
  agentId: string;
  type: MemoryType;
  title: string;
  content: string;
  parents: string[];
  artifactIds: string[];
  tags: string[];
  importance: number; // 0-5
  visibility: "private" | "shared";
  contentHash: string;
  storageReceipt: StorageReceipt | null;
  recallTraces: RecallTrace[];
  createdAt: string;
}

export interface RecallTrace {
  id: string;
  sourceMemoryId: string;
  sourceAgentId: string;
  recalledByAgentId: string;
  recalledAtRunId: string;
  similarityScore: number | null;
  retrievedVia: "semantic" | "keyword" | "id-lookup";
  createdAt: string;
}

export interface Artifact {
  id: string;
  spaceId: string;
  runId: string;
  agentId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  content: string; // Base64 or text content for preview
  contentHash: string;
  derivedFromMemoryIds: string[];
  storageReceipt: StorageReceipt | null;
  createdAt: string;
}

export interface AgentRun {
  id: string;
  spaceId: string;
  agentId: string;
  agentName: string;
  status: RunStatus;
  prompt: string;
  events: RunEvent[];
  memoryIds: string[];
  artifactIds: string[];
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
}

export interface RunEvent {
  id: string;
  runId: string;
  kind: RunEventKind;
  timestamp: string;
  data: string; // JSON-serialized payload
  linkedMemoryIds: string[];
  linkedArtifactIds: string[];
}

export interface AccessGrant {
  id: string;
  spaceId: string;
  agentId: string;
  agentName: string;
  permission: Permission;
  status: GrantStatus;
  granterAgentId: string;
  grantedAt: string;
  revokedAt: string | null;
  expiresAtMs: number | null;
  suiTxDigest: string | null;
  grantTxDigest: string | null;
  revokeTxDigest: string | null;
}

export interface StorageReceipt {
  blobId: string;
  storageMode: StorageMode;
  contentHash: string;
  storedAt: string;
  aggregatorUrl: string | null;
}

export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "ACCESS_DENIED"
  | "STORAGE_WRITE_FAILED"
  | "STORAGE_READ_FAILED"
  | "HASH_MISMATCH"
  | "SUI_TX_FAILED"
  | "WALRUS_UNAVAILABLE"
  | "DEMO_AGENT_FAILED"
  | "NOT_FOUND";

export class AppError extends Error {
  constructor(
    public code: AppErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export interface AuditReport {
  generatedAt: string;
  space: MemorySpace;
  agents: AgentProfile[];
  accessGrants: AccessGrant[];
  runs: AgentRun[];
  memoryItems: MemoryItem[];
  artifacts: Artifact[];
  warnings: AuditWarning[];
  proofReceipts: ProofReceipt[];
}

export interface AuditWarning {
  severity: "low" | "medium" | "high";
  category: string;
  message: string;
  relatedIds: string[];
}

export interface ProofReceipt {
  type: "storage" | "aggregator" | "seal-policy";
  verified: boolean;
  details: string;
  verifiedAt: string | null;
}

// Graph types for visualization
export interface GraphNode {
  id: string;
  type: "space" | "agent" | "run" | "memory" | "artifact" | "access";
  label: string;
  sublabel?: string;
  data: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type:
    | "created_by"
    | "belongs_to_run"
    | "derived_from"
    | "attached_to"
    | "shared_with"
    | "revoked_from";
  label?: string;
}
