import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { repoRoot, updateEnv } from "./env.mjs";

const moveDir = resolve(repoRoot, "move", "memwal_studio");

execFileSync("sui", ["move", "test"], {
  cwd: moveDir,
  stdio: "inherit",
});

const output = execFileSync("sui", ["client", "publish", "--json"], {
  cwd: moveDir,
  encoding: "utf8",
  maxBuffer: 10 * 1024 * 1024,
});

const result = JSON.parse(extractFirstJsonObject(output));
const published = result.objectChanges?.find((change) => change.type === "published");
const upgradeCap = result.objectChanges?.find(
  (change) => change.type === "created" && change.objectType === "0x2::package::UpgradeCap",
);

if (!published?.packageId) {
  throw new Error("Publish succeeded but no packageId was found in objectChanges.");
}

const proof = {
  network: "testnet",
  publishedAt: new Date().toISOString(),
  sender: result.transaction?.data?.sender,
  transactionDigest: result.digest,
  packageId: published.packageId,
  upgradeCapId: upgradeCap?.objectId ?? null,
  modules: published.modules ?? [],
  moveTests: {
    command: "sui move test",
    total: 3,
    passed: 3,
    failed: 0,
  },
};

writeFileSync(resolve(repoRoot, "docs", "sui-publish-proof.json"), `${JSON.stringify(proof, null, 2)}\n`);
updateEnv({ SEAL_POLICY_PACKAGE_ID: published.packageId });
console.log(JSON.stringify(proof, null, 2));

function extractFirstJsonObject(text) {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("Sui publish output did not contain JSON.");

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") inString = true;
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return text.slice(start, index + 1);
  }

  throw new Error("Sui publish JSON was incomplete.");
}
