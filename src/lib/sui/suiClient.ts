// MemWal Studio - Sui Client
// Real Sui transaction builders using @mysten/sui v2.x

import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import type {
  SuiTransactionBlockResponse,
  SuiObjectResponse,
} from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey, type Signer } from "@mysten/sui/cryptography";

export interface SuiConfig {
  client: SuiJsonRpcClient;
  packageId: string;
  network: "testnet" | "mainnet";
}

// Initialize with environment or defaults
export function createSuiClient(): SuiJsonRpcClient {
  const network =
    (localStorage.getItem("SUI_NETWORK") as "testnet" | "mainnet") ?? "testnet";
  const rpcUrl =
    localStorage.getItem("SUI_RPC_URL") ?? getJsonRpcFullnodeUrl(network);
  return new SuiJsonRpcClient({ url: rpcUrl, network });
}

export function getPackageId(): string {
  return localStorage.getItem("SUI_PACKAGE_ID") ?? "";
}

// Build create_space transaction
export function buildCreateSpaceTx(
  name: string,
  walrusIndexBlobId: string,
  packageId: string,
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::memory_space::create_space`,
    arguments: [tx.pure.string(name), tx.pure.string(walrusIndexBlobId)],
  });
  return tx;
}

// Build grant_access transaction
export function buildGrantAccessTx(
  spaceObjectId: string,
  agentAddress: string,
  permission: number, // 1=read, 2=write, 3=admin
  packageId: string,
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::memory_space::grant_access`,
    arguments: [
      tx.object(spaceObjectId),
      tx.pure.address(agentAddress),
      tx.pure.u8(permission),
      tx.pure.u64(0), // no expiry
    ],
  });
  return tx;
}

// Build revoke_access transaction
export function buildRevokeAccessTx(
  grantObjectId: string,
  packageId: string,
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::memory_space::revoke_access`,
    arguments: [tx.object(grantObjectId)],
  });
  return tx;
}

// Execute a transaction with a keypair
export async function executeTx(
  tx: Transaction,
  keypair: Ed25519Keypair,
  client: SuiJsonRpcClient,
): Promise<{ digest: string; objectIds: string[] }> {
  const result: SuiTransactionBlockResponse =
    await client.signAndExecuteTransaction({
      signer: keypair as unknown as Signer,
      transaction: tx,
      options: { showObjectChanges: true, showEffects: true },
    });

  const objectIds: string[] = [];
  if (result.objectChanges) {
    for (const change of result.objectChanges) {
      if (change.type === "created") {
        objectIds.push(change.objectId);
      }
    }
  }

  return { digest: result.digest, objectIds };
}

// Get keypair from localStorage private key
export function getKeypair(): Ed25519Keypair | null {
  const privateKey = localStorage.getItem("SUI_PRIVATE_KEY");
  if (!privateKey) return null;
  try {
    const parsed = decodeSuiPrivateKey(privateKey);
    if (parsed.scheme !== "ED25519") return null;
    return Ed25519Keypair.fromSecretKey(parsed.secretKey);
  } catch {
    return null;
  }
}

// Placeholder addresses for demo display
export const DEMO_ADDRESSES = {
  owner: "0xowner_demo_abc123def456",
  researchAgent: "0xagent_research_789ghi012jkl",
  strategyAgent: "0xagent_strategy_345mno678pqr",
  package: "0xmemwal_studio_package_placeholder",
};
