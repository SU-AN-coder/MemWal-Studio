// MemWal Studio - Walrus Storage Adapter
// Connects to Walrus publisher/aggregator for blob storage
// Falls back to mock when endpoints are unavailable

import type { StorageReceipt } from "../domain/types";
import { computeHash } from "./hash";
import type { MemoryStorageAdapter } from "./types";

export class WalrusStorageAdapter implements MemoryStorageAdapter {
  readonly mode = "WALRUS" as const;

  private publisherUrl: string;
  private aggregatorUrl: string;
  private enabled: boolean;

  constructor(publisherUrl?: string, aggregatorUrl?: string) {
    this.publisherUrl = publisherUrl ?? "";
    this.aggregatorUrl = aggregatorUrl ?? "";
    this.enabled = !!publisherUrl && !!aggregatorUrl;
  }

  isAvailable(): boolean {
    return this.enabled;
  }

  async writeJson(key: string, data: unknown): Promise<StorageReceipt> {
    const content = JSON.stringify(data);
    const contentHash = await computeHash(content);

    if (!this.enabled) {
      return {
        blobId: `walrus_pending_${contentHash.slice(0, 16)}`,
        storageMode: "WALRUS",
        contentHash,
        storedAt: new Date().toISOString(),
        aggregatorUrl: this.aggregatorUrl || null,
      };
    }

    try {
      const response = await fetch(`${this.publisherUrl}/v1/store`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: content,
      });

      if (!response.ok) {
        throw new Error(
          `Walrus publish failed: ${response.status} ${response.statusText}`,
        );
      }

      const result = (await response.json()) as {
        blobId?: string;
        newlyCreated?: { blobObject?: { blobId?: string } };
      };
      const blobId =
        result.blobId ??
        result.newlyCreated?.blobObject?.blobId ??
        `walrus_${contentHash.slice(0, 16)}`;

      return {
        blobId,
        storageMode: "WALRUS",
        contentHash,
        storedAt: new Date().toISOString(),
        aggregatorUrl: this.aggregatorUrl || null,
      };
    } catch (err) {
      throw new Error(
        `WALRUS_UNAVAILABLE: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  async readJson<T = unknown>(
    key: string,
    expectedHash?: string,
  ): Promise<{ data: T; receipt: StorageReceipt }> {
    if (!this.enabled) {
      throw new Error("WALRUS_UNAVAILABLE: Walrus endpoints not configured");
    }

    try {
      const response = await fetch(`${this.aggregatorUrl}/v1/${key}`);
      if (!response.ok) {
        throw new Error(
          `Walrus read failed: ${response.status} ${response.statusText}`,
        );
      }

      const content = await response.text();
      const contentHash = await computeHash(content);

      if (expectedHash && contentHash !== expectedHash) {
        throw new Error(
          `HASH_MISMATCH: expected ${expectedHash}, got ${contentHash}`,
        );
      }

      return {
        data: JSON.parse(content) as T,
        receipt: {
          blobId: key,
          storageMode: "WALRUS",
          contentHash,
          storedAt: new Date().toISOString(),
          aggregatorUrl: this.aggregatorUrl,
        },
      };
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("HASH_MISMATCH"))
        throw err;
      throw new Error(
        `WALRUS_UNAVAILABLE: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  async writeBytes(
    key: string,
    bytes: Uint8Array<ArrayBuffer>,
    mimeType?: string,
  ): Promise<StorageReceipt> {
    const contentHash = await computeHash(new TextDecoder().decode(bytes));

    if (!this.enabled) {
      return {
        blobId: `walrus_pending_${contentHash.slice(0, 16)}`,
        storageMode: "WALRUS",
        contentHash,
        storedAt: new Date().toISOString(),
        aggregatorUrl: this.aggregatorUrl || null,
      };
    }

    try {
      const response = await fetch(`${this.publisherUrl}/v1/store`, {
        method: "PUT",
        headers: { "Content-Type": mimeType ?? "application/octet-stream" },
        body: bytes,
      });

      if (!response.ok) {
        throw new Error(`Walrus publish failed: ${response.status}`);
      }

      const result = (await response.json()) as {
        blobId?: string;
        newlyCreated?: { blobObject?: { blobId?: string } };
      };
      const blobId =
        result.blobId ??
        result.newlyCreated?.blobObject?.blobId ??
        `walrus_${contentHash.slice(0, 16)}`;

      return {
        blobId,
        storageMode: "WALRUS",
        contentHash,
        storedAt: new Date().toISOString(),
        aggregatorUrl: this.aggregatorUrl || null,
      };
    } catch (err) {
      throw new Error(
        `WALRUS_UNAVAILABLE: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  async readBytes(
    key: string,
    expectedHash?: string,
  ): Promise<{ bytes: Uint8Array<ArrayBuffer>; receipt: StorageReceipt }> {
    if (!this.enabled) {
      throw new Error("WALRUS_UNAVAILABLE: Walrus endpoints not configured");
    }

    try {
      const response = await fetch(`${this.aggregatorUrl}/v1/${key}`);
      if (!response.ok) {
        throw new Error(`Walrus read failed: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer) as Uint8Array<ArrayBuffer>;
      const contentHash = await computeHash(new TextDecoder().decode(bytes));

      if (expectedHash && contentHash !== expectedHash) {
        throw new Error(`HASH_MISMATCH`);
      }

      return {
        bytes,
        receipt: {
          blobId: key,
          storageMode: "WALRUS",
          contentHash,
          storedAt: new Date().toISOString(),
          aggregatorUrl: this.aggregatorUrl,
        },
      };
    } catch (err) {
      if (err instanceof Error && err.message === "HASH_MISMATCH") throw err;
      throw new Error(
        `WALRUS_UNAVAILABLE: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  async getBlobId(key: string): Promise<string | null> {
    if (!this.enabled) return null;
    return key;
  }

  // Independent verification: read through aggregator and verify hash outside app path
  async verifyIndependently(
    blobId: string,
    expectedHash: string,
  ): Promise<{ verified: boolean; actualHash: string; details: string }> {
    if (!this.enabled) {
      return {
        verified: false,
        actualHash: "",
        details: "Walrus endpoints not configured",
      };
    }

    try {
      const response = await fetch(`${this.aggregatorUrl}/v1/${blobId}`);
      if (!response.ok) {
        return {
          verified: false,
          actualHash: "",
          details: `Aggregator returned ${response.status}`,
        };
      }

      const content = await response.text();
      const actualHash = await computeHash(content);
      const verified = actualHash === expectedHash;

      return {
        verified,
        actualHash,
        details: verified
          ? `Independently verified: hash matches (${actualHash.slice(0, 16)}...)`
          : `Hash mismatch: expected ${expectedHash.slice(0, 16)}..., got ${actualHash.slice(0, 16)}...`,
      };
    } catch (err) {
      return {
        verified: false,
        actualHash: "",
        details: `Verification error: ${err instanceof Error ? err.message : "Unknown"}`,
      };
    }
  }
}
