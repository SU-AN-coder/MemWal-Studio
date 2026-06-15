import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createAccount, addDelegateKey } from "@mysten-incubation/memwal/account";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
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
if (accountId) {
  accountResult = {
    accountId,
    owner: "existing",
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
    throw new Error(
      `MemWal account creation failed. If this address already has an account, set MEMWAL_ACCOUNT_ID manually. ${message}`,
    );
  }

  if (!accountResult.accountId) {
    throw new Error("MemWal account creation did not return an accountId.");
  }
  accountId = accountResult.accountId;
}

const delegateResult = await addDelegateKey({
  packageId: env.MEMWAL_PACKAGE_ID,
  accountId,
  publicKey: env.MEMWAL_PUBLIC_KEY,
  label: "MemWal Studio delegate",
  suiPrivateKey: env.SUI_PRIVATE_KEY,
  suiNetwork: env.SUI_NETWORK,
  suiClient,
});

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
  createdAt: new Date().toISOString(),
};

writeFileSync(resolve(repoRoot, "docs", "memwal-account-proof.json"), `${JSON.stringify(proof, null, 2)}\n`);
console.log(JSON.stringify(proof, null, 2));
