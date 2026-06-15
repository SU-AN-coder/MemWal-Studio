// MemWal Studio - MemWal Storage Adapter
// Uses the real @mysten-incubation/memwal SDK for agent memory operations.

import { MemWal } from "@mysten-incubation/memwal";
import type { StorageReceipt } from "../domain/types";
import { computeHash } from "./hash";
import type { MemoryStorageAdapter } from "./types";

export class MemWalStorageAdapter implements MemoryStorageAdapter {
  readonly mode = "MEMWAL" as const;

  private memwal: MemWal | null = null;
  private namespace: string;
  private serverUrl: string;

  constructor() {
    this.namespace = "memwal_studio";
    this.serverUrl =
      localStorage.getItem("MEMWAL_SERVER_URL") ??
      "https://relayer-staging.memory.walrus.xyz";
    this.initFromStorage();
  }

  private initFromStorage(): void {
    const key = localStorage.getItem("MEMWAL_PRIVATE_KEY");
    const accountId = localStorage.getItem("MEMWAL_ACCOUNT_ID");
    if (key && accountId) {
      try {
        this.memwal = MemWal.create({
          key,
          accountId,
          serverUrl: this.serverUrl,
          namespace: this.namespace,
        });
      } catch (err) {
        console.warn("MemWal SDK initialization failed:", err);
        this.memwal = null;
      }
    }
  }

  /** Re-initialize after credentials change (call after saving new creds to localStorage) */
  reconnect(): void {
    this.initFromStorage();
  }

  isAvailable(): boolean {
    return this.memwal !== null;
  }

  getAvailabilityLabel(): string {
    if (this.memwal) return "MemWal Connected";
    const hasKey = !!localStorage.getItem("MEMWAL_PRIVATE_KEY");
    const hasAccount = !!localStorage.getItem("MEMWAL_ACCOUNT_ID");
    if (!hasKey && !hasAccount) return "No MemWal credentials";
    if (!hasKey) return "Missing private key";
    if (!hasAccount) return "Missing account ID";
    return "MemWal init failed";
  }

  private requireClient(): MemWal {
    if (!this.memwal) {
      throw new Error(`MEMWAL_UNAVAILABLE: ${this.getAvailabilityLabel()}`);
    }
    if (!this.serverUrl) {
      throw new Error("MEMWAL_UNAVAILABLE: MemWal server URL not configured");
    }
    return this.memwal;
  }

  async writeJson(key: string, data: unknown): Promise<StorageReceipt> {
    const content = JSON.stringify(data);
    const contentHash = await computeHash(content);
    const memwal = this.requireClient();

    try {
      const result = await memwal.rememberAndWait(content, key, {
        timeoutMs: 30_000,
      });

      return {
        blobId: result.blob_id,
        storageMode: "MEMWAL",
        contentHash,
        storedAt: new Date().toISOString(),
        aggregatorUrl: null,
      };
    } catch (err) {
      throw new Error(
        `MEMWAL_UNAVAILABLE: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  async readJson<T = unknown>(
    key: string,
    expectedHash?: string,
  ): Promise<{ data: T; receipt: StorageReceipt }> {
    const memwal = this.requireClient();

    try {
      const recallResult = await memwal.recall({
        query: key,
        namespace: key,
        topK: 1,
        maxDistance: 0.7,
      });

      if (!recallResult.results || recallResult.results.length === 0) {
        throw new Error(`MEMWAL_NOT_FOUND: ${key}`);
      }

      const matched = recallResult.results[0];
      const content = matched.text;
      const contentHash = await computeHash(content);

      if (expectedHash && contentHash !== expectedHash) {
        throw new Error("HASH_MISMATCH");
      }

      return {
        data: JSON.parse(content) as T,
        receipt: {
          blobId: matched.blob_id,
          storageMode: "MEMWAL",
          contentHash,
          storedAt: new Date().toISOString(),
          aggregatorUrl: null,
        },
      };
    } catch (err) {
      if (err instanceof Error && err.message === "HASH_MISMATCH") throw err;
      throw new Error(
        `MEMWAL_UNAVAILABLE: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  async writeBytes(
    key: string,
    bytes: Uint8Array<ArrayBuffer>,
    mimeType?: string,
  ): Promise<StorageReceipt> {
    // MemWal SDK works with text; encode bytes as base64 data URI
    const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
    const content = `data:${mimeType ?? "application/octet-stream"};base64,${base64}`;
    const contentHash = await computeHash(content);
    const memwal = this.requireClient();

    try {
      const result = await memwal.rememberAndWait(content, key, {
        timeoutMs: 30_000,
      });

      return {
        blobId: result.blob_id,
        storageMode: "MEMWAL",
        contentHash,
        storedAt: new Date().toISOString(),
        aggregatorUrl: null,
      };
    } catch (err) {
      throw new Error(
        `MEMWAL_UNAVAILABLE: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  async readBytes(
    key: string,
    expectedHash?: string,
  ): Promise<{ bytes: Uint8Array<ArrayBuffer>; receipt: StorageReceipt }> {
    const memwal = this.requireClient();

    try {
      const recallResult = await memwal.recall({
        query: key,
        namespace: key,
        topK: 1,
        maxDistance: 0.7,
      });

      if (!recallResult.results || recallResult.results.length === 0) {
        throw new Error(`MEMWAL_NOT_FOUND: ${key}`);
      }

      const matched = recallResult.results[0];
      const content = matched.text;

      // Handle base64 data URIs
      let bytes: Uint8Array<ArrayBuffer>;
      if (content.startsWith("data:") && content.includes(";base64,")) {
        const base64Part = content.split(";base64,")[1];
        const binary = atob(base64Part);
        bytes = new Uint8Array(binary.length) as Uint8Array<ArrayBuffer>;
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
      } else {
        bytes = new TextEncoder().encode(content) as Uint8Array<ArrayBuffer>;
      }

      const contentHash = await computeHash(content);

      if (expectedHash && contentHash !== expectedHash) {
        throw new Error("HASH_MISMATCH");
      }

      return {
        bytes,
        receipt: {
          blobId: matched.blob_id,
          storageMode: "MEMWAL",
          contentHash,
          storedAt: new Date().toISOString(),
          aggregatorUrl: null,
        },
      };
    } catch (err) {
      if (err instanceof Error && err.message === "HASH_MISMATCH") throw err;
      throw new Error(
        `MEMWAL_UNAVAILABLE: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  async getBlobId(key: string): Promise<string | null> {
    const memwal = this.requireClient();

    try {
      const recallResult = await memwal.recall({
        query: key,
        namespace: key,
        topK: 1,
        maxDistance: 0.7,
      });

      if (!recallResult.results || recallResult.results.length === 0)
        return null;

      return recallResult.results[0].blob_id;
    } catch {
      return null;
    }
  }

  /** Semantic search via MemWal recall */
  async semanticSearch(
    query: string,
    _spaceId: string,
    limit = 10,
  ): Promise<Array<{ id: string; score: number }>> {
    if (!this.memwal) return [];

    try {
      const recallResult = await this.memwal.recall({
        query,
        topK: limit,
        maxDistance: 0.7,
      });

      if (!recallResult.results || !Array.isArray(recallResult.results))
        return [];

      return recallResult.results.map((m) => ({
        id: m.blob_id,
        score: 1 - m.distance,
      }));
    } catch {
      return [];
    }
  }

  /** Test the MemWal connection */
  async testConnection(): Promise<{
    ok: boolean;
    message: string;
    blobId?: string;
  }> {
    if (!this.memwal) {
      return {
        ok: false,
        message: this.getAvailabilityLabel(),
      };
    }

    try {
      const result = await this.memwal.rememberAndWait(
        "memwal_studio_connection_test",
        undefined,
        { timeoutMs: 15_000 },
      );
      return {
        ok: true,
        message: "Connected to MemWal successfully",
        blobId: result.blob_id,
      };
    } catch (err) {
      return {
        ok: false,
        message: `Connection test failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      };
    }
  }

  /** Restore namespace from MemWal */
  async restoreNamespace(): Promise<void> {
    if (this.memwal) {
      try {
        await this.memwal.restore(this.namespace);
      } catch (err) {
        console.warn("MemWal namespace restore failed:", err);
      }
    }
  }
}
