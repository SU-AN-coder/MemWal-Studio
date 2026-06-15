import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { MemWal } from "@mysten-incubation/memwal";
import { loadEnv, repoRoot, requireEnv } from "./env.mjs";

const env = loadEnv();
requireEnv(env, ["MEMWAL_PRIVATE_KEY", "MEMWAL_ACCOUNT_ID", "MEMWAL_SERVER_URL"]);
if (env.MEMWAL_PRIVATE_KEY.trim() === "<private key>") {
  throw new Error("MEMWAL_PRIVATE_KEY contains a placeholder, not a real key.");
}

const namespace = "memwal-studio-live";
const memwal = MemWal.create({
  key: env.MEMWAL_PRIVATE_KEY,
  accountId: env.MEMWAL_ACCOUNT_ID,
  serverUrl: env.MEMWAL_SERVER_URL,
  namespace,
});

const health = await memwal.health();
const text = `MemWal Studio live proof ${new Date().toISOString()}`;
const remembered = await memwal.rememberAndWait(text, namespace, {
  timeoutMs: 120_000,
  pollIntervalMs: 2_000,
});

const recalled = await memwal.recall({
  query: "MemWal Studio live proof",
  namespace,
  topK: 3,
  maxDistance: 0.9,
});

const matched = recalled.results.some((item) => item.text.includes("MemWal Studio live proof"));
const proof = {
  serverUrl: env.MEMWAL_SERVER_URL,
  accountId: env.MEMWAL_ACCOUNT_ID,
  namespace,
  health,
  remember: remembered,
  recallTotal: recalled.total,
  matched,
  verifiedAt: new Date().toISOString(),
};

writeFileSync(resolve(repoRoot, "docs", "memwal-live-proof.json"), `${JSON.stringify(proof, null, 2)}\n`);
console.log(JSON.stringify(proof, null, 2));

if (!matched) {
  throw new Error("MemWal recall did not return the live proof text.");
}
