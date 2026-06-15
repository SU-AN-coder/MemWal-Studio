import {
  SealClient,
  SessionKey,
  type KeyServerConfig,
  type SealCompatibleClient,
} from "@mysten/seal";
import type { Signer } from "@mysten/sui/cryptography";
import { Transaction } from "@mysten/sui/transactions";

export interface SealConfig {
  packageId: string;
  policyObjectId: string;
  keyServerObjectId: string;
  aggregatorUrl: string;
  threshold: number;
}

export interface SealApprovalResult {
  approved: boolean;
  reason?: string;
  txBytes?: Uint8Array;
  checkedAt?: string;
}

export interface EncryptedEnvelope {
  version: "seal-v1";
  encryptedPayload: string;
  encryptionKeyId: string;
  policyId: string;
  spaceId: string;
  contentHash: string;
  createdAt: string;
}

function readRuntimeConfig(key: string): string {
  const localValue =
    typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
  if (localValue) return localValue;

  const viteEnv = import.meta.env as Record<string, string | undefined>;
  return viteEnv[`VITE_${key}`] ?? viteEnv[key] ?? "";
}

export function getSealConfig(): SealConfig {
  return {
    packageId: readRuntimeConfig("SEAL_POLICY_PACKAGE_ID"),
    policyObjectId: readRuntimeConfig("SEAL_POLICY_OBJECT_ID"),
    keyServerObjectId:
      readRuntimeConfig("SEAL_KEY_SERVER_OBJECT_ID") ||
      "0xb012378c9f3799fb5b1a7083da74a4069e3c3f1c93de0b27212a5799ce1e1e98",
    aggregatorUrl:
      readRuntimeConfig("SEAL_AGGREGATOR_URL") ||
      "https://seal-aggregator-testnet.mystenlabs.com",
    threshold: Number(readRuntimeConfig("SEAL_THRESHOLD") || "1"),
  };
}

export function isSealEnabled(config = getSealConfig()): boolean {
  return !!(config.packageId && config.keyServerObjectId && config.aggregatorUrl);
}

export function createSealClient(
  suiClient: SealCompatibleClient,
  config = getSealConfig(),
): SealClient {
  if (!isSealEnabled(config)) {
    throw new Error("Seal is not configured. Missing package/key-server settings.");
  }

  const serverConfigs: KeyServerConfig[] = [
    {
      objectId: config.keyServerObjectId,
      weight: 1,
      aggregatorUrl: config.aggregatorUrl,
    },
  ];

  return new SealClient({
    suiClient,
    serverConfigs,
    verifyKeyServers: false,
    timeout: 15000,
  });
}

export async function encryptWithSeal(input: {
  client: SealClient;
  config?: SealConfig;
  data: Uint8Array;
  identity?: string;
  aad?: Uint8Array;
}): Promise<{ encryptedObject: Uint8Array; key: Uint8Array; identity: string }> {
  const config = input.config ?? getSealConfig();
  const identity = input.identity || config.policyObjectId || config.packageId;
  if (!identity) throw new Error("Seal encryption identity is missing.");

  const result = await input.client.encrypt({
    threshold: config.threshold,
    packageId: config.packageId,
    id: identity,
    data: input.data,
    aad: input.aad,
  });

  return { ...result, identity };
}

export async function buildSealApprovalTxBytes(input: {
  suiClient: SealCompatibleClient;
  packageId: string;
  identity: string;
  grantObjectId: string;
  permission: number;
  requester: string;
}): Promise<Uint8Array> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${input.packageId}::memory_space::seal_approve`,
    arguments: [
      tx.pure.vector("u8", hexToBytes(input.identity)),
      tx.object(input.grantObjectId),
      tx.pure.u8(input.permission),
      tx.object.clock(),
    ],
  });

  tx.setSender(input.requester);
  return tx.build({ client: input.suiClient, onlyTransactionKind: true });
}

export async function decryptWithSeal(input: {
  client: SealClient;
  suiClient: SealCompatibleClient;
  signer: Signer;
  encryptedObject: Uint8Array;
  packageId: string;
  identity: string;
  grantObjectId: string;
  requester: string;
  permission: number;
  ttlMin?: number;
}): Promise<Uint8Array> {
  const sessionKey = await SessionKey.create({
    address: input.requester,
    packageId: input.packageId,
    ttlMin: input.ttlMin ?? 30,
    signer: input.signer,
    suiClient: input.suiClient,
  });

  const txBytes = await buildSealApprovalTxBytes({
    suiClient: input.suiClient,
    packageId: input.packageId,
    identity: input.identity,
    grantObjectId: input.grantObjectId,
    requester: input.requester,
    permission: input.permission,
  });

  await input.client.fetchKeys({
    ids: [input.identity],
    txBytes,
    sessionKey,
    threshold: 1,
  });

  return input.client.decrypt({
    data: input.encryptedObject,
    sessionKey,
    txBytes,
  });
}

export async function checkSealApproval(input: {
  suiClient?: SealCompatibleClient;
  packageId?: string;
  spaceObjectId?: string;
  grantObjectId?: string;
  requester?: string;
  permission?: number;
}): Promise<SealApprovalResult> {
  const config = getSealConfig();
  if (!isSealEnabled(config)) {
    return {
      approved: false,
      reason: "Seal package/key-server settings are missing.",
    };
  }

  if (
    !input.suiClient ||
    !input.spaceObjectId ||
    !input.grantObjectId ||
    !input.requester
  ) {
    return {
      approved: false,
      reason: "Seal runtime requires live Sui client, MemorySpace, AccessGrant, and requester.",
    };
  }

  const txBytes = await buildSealApprovalTxBytes({
    suiClient: input.suiClient,
    packageId: input.packageId ?? config.packageId,
    identity: input.spaceObjectId,
    grantObjectId: input.grantObjectId,
    requester: input.requester,
    permission: input.permission ?? 1,
  });

  return {
    approved: true,
    txBytes,
    checkedAt: new Date().toISOString(),
  };
}

function hexToBytes(value: string): number[] {
  const hex = value.startsWith("0x") ? value.slice(2) : value;
  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) {
    return Array.from(new TextEncoder().encode(value));
  }

  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(Number.parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}
