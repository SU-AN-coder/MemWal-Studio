# MemWal Studio Current Status And Scoring

Generated: 2026-06-15 15:25 Asia/Shanghai

## Requested Gap Closure

| Item | Current Status | Evidence | Notes |
|------|----------------|----------|-------|
| MemWal credentials | Awaiting private key/account value in `.env` | `npm run memwal:provision`, `npm run verify:memwal` | Public key, package ID, registry ID, staging relayer, provision script, and live verification script are wired. The original private key was lost during context compaction and is not present in `.env`. |
| Walrus endpoints | Complete | `docs/walrus-live-proof.json` | Testnet publisher and aggregator are configured. Latest live roundtrip blob: `KZuyL_YTHU1fN6zGL3JbANjL1ZlCi0Jg2TQGS56oSWw`. |
| Sui testnet deployment | Complete | `docs/sui-publish-proof.json`, `docs/sui-live-objects-proof.json` | Move package is published on testnet. MemorySpace and shared AccessGrant are live. |
| Full Seal e2e | Complete for key release | `docs/seal-live-proof.json` | Seal encryption, key release, decrypt, and mismatched-identity denial pass against the testnet key server. |

## What Improved

- Removed product runtime paths that generated local simulated storage receipts.
- MemWal writes now fail loudly when credentials/account/relayer config are absent.
- Walrus writes now fail loudly when publisher/aggregator endpoints are absent.
- Added `npm run memwal:provision`, `npm run verify:memwal`, and `npm run verify:live`.
- Fixed Seal certificate timing by creating a stable session key with a 30-second clock-skew buffer.
- Added Seal negative proof: a mismatched identity is denied by key release.

## Readiness Score

| Area | Score | Reason |
|------|-------|--------|
| Product/spec depth | 9/10 | Strong differentiated product direction: AI-agent memory observability, replay, storage proof, access control, and audit evidence. |
| Frontend demo | 8/10 | Usable app shell and workflows; build passes. Bundle warning should be reduced before final submission. |
| Walrus proof | 9/10 | Live publisher/aggregator roundtrip verified. |
| Sui proof | 9/10 | Live package publish and object creation verified. |
| MemWal proof | 5/10 | SDK and scripts are ready, but live account proof requires the missing private key/account value. |
| Seal proof | 9/10 | Live encryption, key release, decrypt, and mismatched-identity denial are verified. |
| Championship readiness today | 8.2/10 | Strong for Walrus/Sui/Seal judging; MemWal-specific prize competitiveness depends on adding the missing credential and producing `docs/memwal-live-proof.json`. |

## Highest Leverage Next Actions

1. Re-add `MEMWAL_PRIVATE_KEY` to `.env`, then run `npm run memwal:provision` and `npm run verify:memwal`.
2. Code-split heavy SDK imports to reduce the current Vite bundle-size warning.
3. Record a short demo showing the live Walrus blob, Sui objects, Seal decrypt proof, and MemWal proof once the credential is restored.
