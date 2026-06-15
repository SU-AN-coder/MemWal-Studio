import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { SealClient, SessionKey } from "@mysten/seal";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Transaction } from "@mysten/sui/transactions";
import { loadEnv, repoRoot, requireEnv } from "./env.mjs";

const env = loadEnv();
requireEnv(env, [
  "SUI_NETWORK",
  "SUI_RPC_URL",
  "SUI_PRIVATE_KEY",
  "SEAL_POLICY_PACKAGE_ID",
  "SEAL_POLICY_OBJECT_ID",
  "SEAL_GRANT_OBJECT_ID",
  "SEAL_KEY_SERVER_OBJECT_ID",
  "SEAL_AGGREGATOR_URL",
]);

const suiClient = new SuiGrpcClient({
  baseUrl: env.SUI_RPC_URL,
  network: env.SUI_NETWORK,
});

const sealClient = new SealClient({
  suiClient,
  serverConfigs: [
    {
      objectId: env.SEAL_KEY_SERVER_OBJECT_ID,
      weight: 1,
      aggregatorUrl: env.SEAL_AGGREGATOR_URL,
    },
  ],
  verifyKeyServers: false,
  timeout: 15000,
});

const parsedKey = decodeSuiPrivateKey(env.SUI_PRIVATE_KEY);
if (parsedKey.scheme !== "ED25519") {
  throw new Error(`Expected ED25519 Sui private key, got ${parsedKey.scheme}`);
}

const keypair = Ed25519Keypair.fromSecretKey(parsedKey.secretKey);
const address = keypair.getPublicKey().toSuiAddress();
const identity = env.SEAL_POLICY_OBJECT_ID;
const plaintext = new TextEncoder().encode("memwal-studio-seal-encrypt-proof");
const encrypted = await sealClient.encrypt({
  threshold: 1,
  packageId: env.SEAL_POLICY_PACKAGE_ID,
  id: identity,
  data: plaintext,
});

const txBytes = await buildApprovalTxBytes(address, identity);

const sessionSkewMs = 30_000;
const sessionKey = await createStableSessionKey(address, keypair, sessionSkewMs);

const expectedText = new TextDecoder().decode(plaintext);
let decryptedText = "";
let decryptionError = null;

try {
  await sealClient.fetchKeys({
    ids: [identity],
    txBytes,
    sessionKey,
    threshold: 1,
  });

  const decrypted = await sealClient.decrypt({
    data: encrypted.encryptedObject,
    sessionKey,
    txBytes,
  });
  decryptedText = new TextDecoder().decode(decrypted);
} catch (error) {
  decryptionError = {
    name: error?.name ?? "Error",
    message: error?.message ?? String(error),
    requestId: error?.requestId ?? null,
  };
}

const deniedIdentity = `0x${"11".repeat(32)}`;
const deniedTxBytes = await buildApprovalTxBytes(address, deniedIdentity);
let mismatchedIdentityDenied = false;
let mismatchedIdentityError = null;

try {
  await sealClient.fetchKeys({
    ids: [deniedIdentity],
    txBytes: deniedTxBytes,
    sessionKey,
    threshold: 1,
  });
} catch (error) {
  mismatchedIdentityDenied = true;
  mismatchedIdentityError = {
    name: error?.name ?? "Error",
    message: error?.message ?? String(error),
    requestId: error?.requestId ?? null,
  };
}

const proof = {
  network: env.SUI_NETWORK,
  packageId: env.SEAL_POLICY_PACKAGE_ID,
  identity,
  requester: address,
  memorySpaceObjectId: env.SEAL_POLICY_OBJECT_ID,
  accessGrantObjectId: env.SEAL_GRANT_OBJECT_ID,
  keyServerObjectId: env.SEAL_KEY_SERVER_OBJECT_ID,
  aggregatorUrl: env.SEAL_AGGREGATOR_URL,
  encryptedBytes: encrypted.encryptedObject.length,
  symmetricKeyBytes: encrypted.key.length,
  sessionClockSkewMs: sessionSkewMs,
  encryptionVerified: encrypted.encryptedObject.length > plaintext.length,
  decryptionKeyReleaseStatus: decryptedText === expectedText ? "passed" : "failed",
  decryptedMatchesPlaintext: decryptedText === expectedText,
  decryptionError,
  mismatchedIdentity: deniedIdentity,
  mismatchedIdentityKeyReleaseStatus: mismatchedIdentityDenied
    ? "denied"
    : "unexpectedly_allowed",
  mismatchedIdentityError,
  verifiedAt: new Date().toISOString(),
};

writeFileSync(resolve(repoRoot, "docs", "seal-live-proof.json"), `${JSON.stringify(proof, null, 2)}\n`);
console.log(JSON.stringify(proof, null, 2));

if (
  !proof.encryptionVerified ||
  !proof.decryptedMatchesPlaintext ||
  !mismatchedIdentityDenied
) {
  throw new Error("Seal full decrypt proof failed. See docs/seal-live-proof.json.");
}

async function createStableSessionKey(address, signer, skewMs) {
  const freshSessionKey = await SessionKey.create({
    address,
    packageId: env.SEAL_POLICY_PACKAGE_ID,
    ttlMin: 10,
    signer,
    suiClient,
  });
  const exportedSessionKey = freshSessionKey.export();
  exportedSessionKey.creationTimeMs = Date.now() - skewMs;
  delete exportedSessionKey.personalMessageSignature;
  const sessionKey = SessionKey.import(exportedSessionKey, suiClient, signer);
  const { signature } = await signer.signPersonalMessage(
    sessionKey.getPersonalMessage(),
  );
  await sessionKey.setPersonalMessageSignature(signature);
  return sessionKey;
}

async function buildApprovalTxBytes(sender, approvalIdentity) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${env.SEAL_POLICY_PACKAGE_ID}::memory_space::seal_approve`,
    arguments: [
      tx.pure.vector("u8", hexToBytes(approvalIdentity)),
      tx.object(env.SEAL_GRANT_OBJECT_ID),
      tx.pure.u8(1),
      tx.object.clock(),
    ],
  });
  tx.setSender(sender);
  return tx.build({
    client: suiClient,
    onlyTransactionKind: true,
  });
}

function hexToBytes(value) {
  const hex = value.startsWith("0x") ? value.slice(2) : value;
  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) {
    return Array.from(new TextEncoder().encode(value));
  }

  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(Number.parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}
