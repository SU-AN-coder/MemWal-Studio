// MemWal Studio - Storage Adapter Interface

import type { StorageMode, StorageReceipt } from "../domain/types";

export interface MemoryStorageAdapter {
  readonly mode: StorageMode;
  writeJson(key: string, data: unknown): Promise<StorageReceipt>;
  readJson<T = unknown>(
    key: string,
    expectedHash?: string,
  ): Promise<{ data: T; receipt: StorageReceipt }>;
  writeBytes(
    key: string,
    bytes: Uint8Array<ArrayBuffer>,
    mimeType?: string,
  ): Promise<StorageReceipt>;
  readBytes(
    key: string,
    expectedHash?: string,
  ): Promise<{ bytes: Uint8Array<ArrayBuffer>; receipt: StorageReceipt }>;
  getBlobId(key: string): Promise<string | null>;
}
