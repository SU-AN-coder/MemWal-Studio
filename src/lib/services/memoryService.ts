// MemWal Studio - Memory Service
// CRUD for memory spaces and memory items with storage integration

import type { MemorySpace, MemoryItem, StorageReceipt } from "../domain/types";
import type { MemoryStorageAdapter } from "../storage/types";
import type { LocalIndex } from "../index/localIndex";
import { generateId, isoNow } from "../domain/helpers";
import { computeHash } from "../storage/hash";
import {
  createMemorySpaceInputSchema,
  createMemoryInputSchema,
} from "../domain/schemas";
import { AppError } from "../domain/types";

export interface MemoryServiceDeps {
  index: LocalIndex;
  storageMode: "MOCK" | "WALRUS" | "MEMWAL";
}

export function createMemoryService(deps: MemoryServiceDeps) {
  const { index } = deps;

  function createMemorySpace(input: unknown): MemorySpace {
    const parsed = createMemorySpaceInputSchema.parse(input);
    const now = isoNow();
    const space: MemorySpace = {
      id: generateId("space"),
      name: parsed.name,
      description: parsed.description,
      owner: parsed.owner,
      tags: parsed.tags,
      storageMode: deps.storageMode,
      indexBlobId: null,
      suiObjectId: null,
      suiTxDigest: null,
      createdAt: now,
      updatedAt: now,
    };
    index.addSpace(space);
    return space;
  }

  function getSpaces(): MemorySpace[] {
    return index.getSpaces();
  }

  async function writeMemory(
    input: unknown,
    storageAdapter: MemoryStorageAdapter,
  ): Promise<MemoryItem> {
    const parsed = createMemoryInputSchema.parse(input);

    // Build envelope for hashing & storage
    const envelope = {
      version: "1" as const,
      kind: "memwal_studio_memory" as const,
      spaceId: parsed.spaceId,
      runId: parsed.runId,
      agentId: parsed.agentId,
      type: parsed.type,
      title: parsed.title,
      content: parsed.content,
      parents: parsed.parents,
      artifactIds: parsed.artifactIds,
      tags: parsed.tags,
      importance: parsed.importance,
      visibility: parsed.visibility,
      createdAt: isoNow(),
    };

    const contentHash = await computeHash(JSON.stringify(envelope));
    const key = `memory/${parsed.spaceId}/${contentHash}`;

    let storageReceipt: StorageReceipt | null = null;
    try {
      storageReceipt = await storageAdapter.writeJson(key, envelope);
    } catch (err) {
      throw new AppError(
        "STORAGE_WRITE_FAILED",
        `Failed to persist memory to ${storageAdapter.mode} storage`,
        err,
      );
    }

    const memory: MemoryItem = {
      id: generateId("mem"),
      spaceId: parsed.spaceId,
      runId: parsed.runId,
      agentId: parsed.agentId,
      type: parsed.type,
      title: parsed.title,
      content: parsed.content,
      parents: parsed.parents,
      artifactIds: parsed.artifactIds,
      tags: parsed.tags,
      importance: parsed.importance,
      visibility: parsed.visibility,
      contentHash,
      storageReceipt,
      recallTraces: [],
      createdAt: envelope.createdAt,
    };

    index.addMemory(memory);
    return memory;
  }

  function searchMemories(query: string, spaceId?: string): MemoryItem[] {
    return index.searchMemories(query, spaceId);
  }

  function filterMemories(filters: {
    spaceId?: string;
    type?: string;
    agentId?: string;
    runId?: string;
    tags?: string[];
  }): MemoryItem[] {
    return index.filterMemories(filters);
  }

  function getMemory(id: string): MemoryItem | undefined {
    return index.getMemory(id);
  }

  function resetAllData(storageAdapter?: MemoryStorageAdapter): void {
    index.clear();
    if (storageAdapter && "clear" in storageAdapter) {
      (storageAdapter as unknown as { clear(): void }).clear();
    }
  }

  return {
    createMemorySpace,
    getSpaces,
    writeMemory,
    searchMemories,
    filterMemories,
    getMemory,
    resetAllData,
  };
}

export type MemoryService = ReturnType<typeof createMemoryService>;
