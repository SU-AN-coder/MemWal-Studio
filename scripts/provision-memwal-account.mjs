import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createAccount, addDelegateKey } from "@mysten-incubation/memwal/account";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { loadEnv, repoRoot, requireEnv, updateEnv } from "./env.mjs";

const env = loadEnv();
requireEnv(env, [
  "SUI_PRIVATE_KEY",
  "SUI_NETWORK",
  "SUI_RPC_URL",
  "MEMWAL_PRIVATE_KEY",
  "MEMWAL_PUBLIC_KEY",
  "MEMWAL_PACKAGE_ID",
  "MEMWAL_REGISTRY_ID",
]);

if (env.MEMWAL_PRIVATE_KEY.trim() === "<private key>") {
  throw new Error("MEMWAL_PRIVATE_KEY contains a placeholder, not a real key.");
}

const suiClient = new SuiJsonRpcClient({
  url: env.SUI_RPC_URL,
  network: env.SUI_NETWORK,
});

let accountResult;
let accountId = env.MEMWAL_ACCOUNT_ID;
const ownerAddress = deriveOwnerAddress(env.SUI_PRIVATE_KEY);
if (accountId) {
  accountResult = {
    accountId,
    owner: ownerAddress,
    digest: null,
  };
} else {
  try {
    accountResult = await createAccount({
      packageId: env.MEMWAL_PACKAGE_ID,
      registryId: env.MEMWAL_REGISTRY_ID,
      suiPrivateKey: env.SUI_PRIVATE_KEY,
      suiNetwork: env.SUI_NETWORK,
      suiClient,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const existingAccountId = await findExistingAccountId(
      suiClient,
      env.MEMWAL_REGISTRY_ID,
      ownerAddress,
    );
    if (!existingAccountId) {
      throw new Error(
        `MemWal account creation failed and no existing account was found. ${message}`,
      );
    }
    accountResult = {
      accountId: existingAccountId,
      owner: ownerAddress,
      digest: null,
    };
    accountId = existingAccountId;
  }

  if (!accountId && !accountResult.accountId) {
    throw new Error("MemWal account creation did not return an accountId.");
  }
  accountId = accountId || accountResult.accountId;
}

let delegateResult;
try {
  delegateResult = await addDelegateKey({
    packageId: env.MEMWAL_PACKAGE_ID,
    accountId,
    publicKey: env.MEMWAL_PUBLIC_KEY,
    label: "MemWal Studio delegate",
    suiPrivateKey: env.SUI_PRIVATE_KEY,
    suiNetwork: env.SUI_NETWORK,
    suiClient,
  });
} catch (error) {
  if (!(await isDelegateRegistered(suiClient, accountId, env.MEMWAL_PUBLIC_KEY))) {
    throw error;
  }
  delegateResult = {
    publicKey: env.MEMWAL_PUBLIC_KEY,
    suiAddress: "existing",
    digest: null,
  };
}

updateEnv({
  MEMWAL_ACCOUNT_ID: accountId,
});

const proof = {
  network: env.SUI_NETWORK,
  packageId: env.MEMWAL_PACKAGE_ID,
  registryId: env.MEMWAL_REGISTRY_ID,
  accountId,
  owner: accountResult.owner,
  createAccountDigest: accountResult.digest,
  delegatePublicKey: delegateResult.publicKey,
  delegateSuiAddress: delegateResult.suiAddress,
  addDelegateDigest: delegateResult.digest,
  delegateAlreadyRegistered: delegateResult.digest === null,
  createdAt: new Date().toISOString(),
};

writeFileSync(resolve(repoRoot, "docs", "memwal-account-proof.json"), `${JSON.stringify(proof, null, 2)}\n`);
console.log(JSON.stringify(proof, null, 2));

function deriveOwnerAddress(suiPrivateKey) {
  const { secretKey } = decodeSuiPrivateKey(suiPrivateKey);
  return Ed25519Keypair.fromSecretKey(secretKey).getPublicKey().toSuiAddress();
}

async function findExistingAccountId(client, registryId, ownerAddress) {
  const registry = await client.getObject({
    id: registryId,
    options: { showContent: true },
  });
  const tableId =
    registry.data?.content?.fields?.accounts?.fields?.id?.id ??
    registry.data?.content?.fields?.accounts?.id;
  if (!tableId) return null;

  const field = await client.getDynamicFieldObject({
    parentId: tableId,
    name: { type: "address", value: ownerAddress },
  });
  return field.data?.content?.fields?.value ?? null;
}

async function isDelegateRegistered(client, accountId, publicKeyHex) {
  const account = await client.getObject({
    id: accountId,
    options: { showContent: true },
  });
  const expected = publicKeyHex.toLowerCase();
  const delegates = account.data?.content?.fields?.delegate_keys ?? [];
  return delegates.some((delegate) => {
    const bytes = delegate.fields?.public_key ?? [];
    return Buffer.from(bytes).toString("hex").toLowerCase() === expected;
  });
}
