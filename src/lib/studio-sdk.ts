// MemWal Studio SDK - Copy this file into your agent project
// to send memory, artifacts, and run data to MemWal Studio

import { MemWal } from "@mysten-incubation/memwal";

export interface StudioConfig {
  spaceId: string;
  memwalPrivateKey: string;
  memwalAccountId: string;
  serverUrl?: string;  // default: https://relayer.memwal.ai
  namespace?: string;  // default: memwal_studio
}

export interface MemoryInput {
  type: "observation" | "tool_call" | "tool_result" | "plan" | "reasoning" | "decision" | "summary" | "warning" | "error";
  title: string;
  content: string;
  tags?: string[];
  importance?: number; // 0-5
  parents?: string[];
}

export interface ArtifactInput {
  filename: string;
  mimeType: string;
  content: string; // text content or base64
  derivedFromMemoryIds?: string[];
}

export class StudioClient {
  private memwal: MemWal;
  private spaceId: string;
  private runId: string | null = null;

  constructor(config: StudioConfig) {
    this.spaceId = config.spaceId;
    this.memwal = MemWal.create({
      key: config.memwalPrivateKey,
      accountId: config.memwalAccountId,
      serverUrl: config.serverUrl ?? "https://relayer.memwal.ai",
      namespace: config.namespace ?? "memwal_studio",
    });
  }

  static connect(config: StudioConfig): StudioClient {
    return new StudioClient(config);
  }

  async startRun(agentId: string, agentName: string, prompt: string): Promise<string> {
    this.runId = `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const runEnvelope = {
      type: "run_start",
      spaceId: this.spaceId,
      runId: this.runId,
      agentId,
      agentName,
      prompt,
      startedAt: new Date().toISOString(),
    };
    await this.memwal.rememberAndWait(JSON.stringify(runEnvelope));
    return this.runId;
  }

  async recordMemory(input: MemoryInput): Promise<{ contentHash: string; blobId: string }> {
    if (!this.runId) throw new Error("Call startRun() first");
    const envelope = {
      version: "1",
      kind: "memwal_studio_memory",
      spaceId: this.spaceId,
      runId: this.runId,
      agentId: "external",
      ...input,
      parents: input.parents ?? [],
      tags: input.tags ?? [],
      importance: input.importance ?? 3,
      visibility: "shared" as const,
      createdAt: new Date().toISOString(),
    };
    const result = await this.memwal.rememberAndWait(JSON.stringify(envelope));
    return { contentHash: result.blob_id, blobId: result.blob_id };
  }

  async createArtifact(input: ArtifactInput): Promise<{ contentHash: string; blobId: string }> {
    if (!this.runId) throw new Error("Call startRun() first");
    const envelope = {
      version: "1",
      kind: "memwal_studio_artifact",
      spaceId: this.spaceId,
      runId: this.runId,
      agentId: "external",
      ...input,
      derivedFromMemoryIds: input.derivedFromMemoryIds ?? [],
      createdAt: new Date().toISOString(),
    };
    const result = await this.memwal.rememberAndWait(JSON.stringify(envelope));
    return { contentHash: result.blob_id, blobId: result.blob_id };
  }

  async finishRun(): Promise<void> {
    if (!this.runId) return;
    const envelope = {
      type: "run_finish",
      spaceId: this.spaceId,
      runId: this.runId,
      status: "completed",
      finishedAt: new Date().toISOString(),
    };
    await this.memwal.rememberAndWait(JSON.stringify(envelope));
    this.runId = null;
  }

  async semanticRecall(query: string, topK = 10): Promise<Array<{ content: string; distance: number }>> {
    const result = await this.memwal.recall({ query, topK });
    return result.results.map(r => ({
      content: r.text,
      distance: r.distance,
    }));
  }
}
