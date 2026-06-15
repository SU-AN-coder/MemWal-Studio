import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv, repoRoot, requireEnv } from "./env.mjs";

const env = loadEnv();
requireEnv(env, ["WALRUS_PUBLISHER_URL", "WALRUS_AGGREGATOR_URL"]);

const payload = JSON.stringify({
  project: "MemWal Studio",
  proof: "walrus-http-roundtrip",
  createdAt: new Date().toISOString(),
});

const publishUrl = `${env.WALRUS_PUBLISHER_URL.replace(/\/$/, "")}/v1/blobs?epochs=1`;
const publishResponse = await fetch(publishUrl, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: payload,
});

if (!publishResponse.ok) {
  throw new Error(`Walrus publish failed: ${publishResponse.status} ${publishResponse.statusText}`);
}

const publishJson = await publishResponse.json();
const blobId =
  publishJson?.newlyCreated?.blobObject?.blobId ??
  publishJson?.alreadyCertified?.blobId ??
  publishJson?.blobId;

if (!blobId) {
  throw new Error(`Walrus publish response did not include a blob ID: ${JSON.stringify(publishJson)}`);
}

const readUrl = `${env.WALRUS_AGGREGATOR_URL.replace(/\/$/, "")}/v1/blobs/${blobId}`;
const readResponse = await fetch(readUrl);
if (!readResponse.ok) {
  throw new Error(`Walrus aggregator read failed: ${readResponse.status} ${readResponse.statusText}`);
}

const readText = await readResponse.text();
const verified = readText === payload;

const proof = {
  network: "testnet",
  publisherUrl: env.WALRUS_PUBLISHER_URL,
  aggregatorUrl: env.WALRUS_AGGREGATOR_URL,
  blobId,
  publishedAt: new Date().toISOString(),
  payloadBytes: payload.length,
  roundtripVerified: verified,
};

writeFileSync(resolve(repoRoot, "docs", "walrus-live-proof.json"), `${JSON.stringify(proof, null, 2)}\n`);
console.log(JSON.stringify(proof, null, 2));

if (!verified) {
  throw new Error("Walrus roundtrip payload mismatch.");
}
