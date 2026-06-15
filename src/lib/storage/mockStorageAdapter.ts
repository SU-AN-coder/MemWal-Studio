// MemWal Studio - Mock Storage Adapter
// In-memory/browser localStorage adapter with deterministic receipts

import type { StorageReceipt } from "../domain/types";
import { computeHash, computeHashSync } from "./hash";
import type { MemoryStorageAdapter } from "./types";
import { mockBlobId } from "./types";

export class MockStorageAdapter implements MemoryStorageAdapter {
  readonly mode = "MOCK" as const;

  private store: Map<string, { data: string; mimeType: string; hash: string }>;

  constructor() {
    // Initialize from localStorage for persistence
    this.store = new Map();
    try {
      const saved = localStorage.getItem("memwal_studio_mock_store");
      if (saved) {
        const entries: Array<
          [string, { data: string; mimeType: string; hash: string }]
        > = JSON.parse(saved);
        for (const [key, value] of entries) {
          this.store.set(key, value);
        }
      }
    } catch {
      // localStorage unavailable, use in-memory only
    }
  }

  private persist(): void {
    try {
      const entries = Array.from(this.store.entries());
      localStorage.setItem("memwal_studio_mock_store", JSON.stringify(entries));
    } catch {
      // Silently fail if localStorage is full
    }
  }

  async writeJson(key: string, data: unknown): Promise<StorageReceipt> {
    const content = JSON.stringify(data);
    const contentHash = await computeHash(content);
    const blobId = mockBlobId(key, contentHash);

    this.store.set(key, {
      data: content,
      mimeType: "application/json",
      hash: contentHash,
    });
    this.persist();

    return {
      blobId,
      storageMode: "MOCK",
      contentHash,
      storedAt: new Date().toISOString(),
      aggregatorUrl: null,
    };
  }

  async readJson<T = unknown>(
    key: string,
    expectedHash?: string,
  ): Promise<{ data: T; receipt: StorageReceipt }> {
    const entry = this.store.get(key);
    if (!entry) {
      throw new Error(`Key not found in mock store: ${key}`);
    }

    if (expectedHash && entry.hash !== expectedHash) {
      throw new Error(
        `Hash mismatch for key ${key}: expected ${expectedHash}, got ${entry.hash}`,
      );
    }

    const blobId = mockBlobId(key, entry.hash);

    return {
      data: JSON.parse(entry.data) as T,
      receipt: {
        blobId,
        storageMode: "MOCK",
        contentHash: entry.hash,
        storedAt: new Date().toISOString(),
        aggregatorUrl: null,
      },
    };
  }

  async writeBytes(
    key: string,
    bytes: Uint8Array<ArrayBuffer>,
    _mimeType?: string,
  ): Promise<StorageReceipt> {
    const content = new TextDecoder().decode(bytes);
    const contentHash = await computeHash(content);
    const blobId = mockBlobId(key, contentHash);

    this.store.set(key, {
      data: content,
      mimeType: _mimeType ?? "application/octet-stream",
      hash: contentHash,
    });
    this.persist();

    return {
      blobId,
      storageMode: "MOCK",
      contentHash,
      storedAt: new Date().toISOString(),
      aggregatorUrl: null,
    };
  }

  async readBytes(
    key: string,
    expectedHash?: string,
  ): Promise<{ bytes: Uint8Array<ArrayBuffer>; receipt: StorageReceipt }> {
    const entry = this.store.get(key);
    if (!entry) {
      throw new Error(`Key not found in mock store: ${key}`);
    }

    if (expectedHash && entry.hash !== expectedHash) {
      throw new Error(`Hash mismatch for key ${key}`);
    }

    const blobId = mockBlobId(key, entry.hash);
    const bytes = new TextEncoder().encode(
      entry.data,
    ) as Uint8Array<ArrayBuffer>;

    return {
      bytes,
      receipt: {
        blobId,
        storageMode: "MOCK",
        contentHash: entry.hash,
        storedAt: new Date().toISOString(),
        aggregatorUrl: null,
      },
    };
  }

  async getBlobId(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    return mockBlobId(key, entry.hash);
  }

  // Utility: clear all mock storage
  clear(): void {
    this.store.clear();
    try {
      localStorage.removeItem("memwal_studio_mock_store");
    } catch {
      // ignore
    }
  }

  // Utility: get all keys
  getKeys(): string[] {
    return Array.from(this.store.keys());
  }

  // Utility: for verification - compute hash sync from stored data
  getContentHash(key: string): string | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    return entry.hash;
  }
}
