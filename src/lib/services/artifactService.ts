// MemWal Studio - Artifact Service
// CRUD for artifacts with hashing and storage integration

import type { Artifact, StorageReceipt } from "../domain/types";
import type { MemoryStorageAdapter } from "../storage/types";
import type { LocalIndex } from "../index/localIndex";
import type { StorageMode } from "../domain/types";
import { generateId, isoNow } from "../domain/helpers";
import { computeHash } from "../storage/hash";
import { createArtifactInputSchema } from "../domain/schemas";
import { AppError } from "../domain/types";

export interface ArtifactServiceDeps {
  index: LocalIndex;
  storageMode: StorageMode;
}

export function createArtifactService(deps: ArtifactServiceDeps) {
  const { index } = deps;

  async function createArtifact(
    input: unknown,
    storageAdapter: MemoryStorageAdapter,
  ): Promise<Artifact> {
    const parsed = createArtifactInputSchema.parse(input);

    const sizeBytes = new TextEncoder().encode(parsed.content).length;
    const contentHash = await computeHash(parsed.content);

    const envelope = {
      version: "1" as const,
      kind: "memwal_studio_artifact" as const,
      ...parsed,
      sizeBytes,
      contentHash,
      createdAt: isoNow(),
    };

    const key = `artifact/${parsed.spaceId}/${contentHash}`;
    let storageReceipt: StorageReceipt | null = null;
    try {
      storageReceipt = await storageAdapter.writeJson(key, envelope);
    } catch (err) {
      throw new AppError(
        "STORAGE_WRITE_FAILED",
        `Failed to persist artifact to ${storageAdapter.mode} storage`,
        err,
      );
    }

    const artifact: Artifact = {
      id: generateId("art"),
      spaceId: parsed.spaceId,
      runId: parsed.runId,
      agentId: parsed.agentId,
      filename: parsed.filename,
      mimeType: parsed.mimeType,
      sizeBytes,
      content: parsed.content,
      contentHash,
      derivedFromMemoryIds: parsed.derivedFromMemoryIds,
      storageReceipt,
      createdAt: envelope.createdAt,
    };

    index.addArtifact(artifact);
    return artifact;
  }

  function getArtifacts(spaceId?: string): Artifact[] {
    return index.getArtifacts(spaceId);
  }

  function getArtifact(id: string): Artifact | undefined {
    return index.getArtifact(id);
  }

  return {
    createArtifact,
    getArtifacts,
    getArtifact,
  };
}

export type ArtifactService = ReturnType<typeof createArtifactService>;
