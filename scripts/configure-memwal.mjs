import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { loadEnv, updateEnv } from "./env.mjs";

const env = loadEnv();
const candidates = [
  resolve(homedir(), ".memwal", "credentials.json"),
  resolve(homedir(), ".config", "memwal", "credentials.json"),
];

const existing = candidates.find((path) => existsSync(path));
if (!existing) {
  console.log("No MemWal credential file found.");
  console.log("Run this interactive login, approve it in the browser wallet, then rerun:");
  console.log("  npx -y @mysten-incubation/memwal-mcp login --staging");
  process.exit(env.MEMWAL_PRIVATE_KEY && env.MEMWAL_ACCOUNT_ID ? 0 : 1);
}

const credentials = JSON.parse(readFileSync(existing, "utf8"));
const privateKey =
  credentials.delegatePrivateKey ??
  credentials.privateKey ??
  credentials.key ??
  credentials.delegate_private_key;
const accountId =
  credentials.accountId ??
  credentials.memwalAccountId ??
  credentials.account_id ??
  credentials.accountObjectId;
const serverUrl =
  credentials.relayerUrl ??
  credentials.serverUrl ??
  "https://relayer-staging.memory.walrus.xyz";

if (!privateKey || !accountId) {
  throw new Error(`Credential file exists but lacks private key/account ID: ${existing}`);
}

updateEnv({
  MEMWAL_PRIVATE_KEY: privateKey,
  MEMWAL_ACCOUNT_ID: accountId,
  MEMWAL_SERVER_URL: serverUrl,
});

console.log(`Imported MemWal staging credentials from ${existing}`);
