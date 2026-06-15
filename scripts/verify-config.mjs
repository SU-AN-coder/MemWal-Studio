import { loadEnv, redacted } from "./env.mjs";

const env = loadEnv();

const groups = {
  sui: ["SUI_PRIVATE_KEY", "SUI_NETWORK", "SUI_RPC_URL"],
  walrus: ["WALRUS_PUBLISHER_URL", "WALRUS_AGGREGATOR_URL", "WALRUS_UPLOAD_RELAY_URL"],
  memwal: ["MEMWAL_PRIVATE_KEY", "MEMWAL_ACCOUNT_ID", "MEMWAL_SERVER_URL"],
  seal: ["SEAL_POLICY_PACKAGE_ID", "SEAL_KEY_SERVER_OBJECT_ID", "SEAL_AGGREGATOR_URL"],
};

const report = {};
let hardFailures = 0;
for (const [group, keys] of Object.entries(groups)) {
  report[group] = {};
  for (const key of keys) {
    const value = env[key] ?? "";
    report[group][key] = key.includes("KEY") ? redacted(value) : value;
    if (!value) hardFailures += group === "memwal" ? 0 : 1;
  }
}

console.log(JSON.stringify(report, null, 2));

if (!env.MEMWAL_PRIVATE_KEY || !env.MEMWAL_ACCOUNT_ID) {
  console.warn(
    "MemWal credentials are missing. Run: npx -y @mysten-incubation/memwal-mcp login --staging",
  );
}

if (hardFailures > 0) {
  throw new Error("Required non-MemWal config is incomplete.");
}
