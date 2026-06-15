# MemWal Studio Current Status And Scoring

Generated: 2026-06-15 14:15 Asia/Shanghai

## Requested Gap Closure

| Item | Current Status | Evidence | Notes |
|------|----------------|----------|-------|
| MemWal credentials | Blocked on external wallet authorization | `npm run memwal:configure` reports no `~/.memwal/credentials.json` | Official flow requires `npx -y @mysten-incubation/memwal-mcp login --staging` and browser wallet approval. I did not fake credentials. |
| Walrus endpoints | Complete | `docs/walrus-live-proof.json` | Testnet publisher and aggregator are configured and live roundtrip passed. |
| Sui testnet deployment | Complete | `docs/sui-publish-proof.json`, `docs/sui-live-objects-proof.json` | Move package is published on testnet. MemorySpace and shared AccessGrant were created. |
| Full Seal e2e | Partial, blocked at key release | `docs/seal-live-proof.json` | SDK encryption passes and PTB/policy shape is implemented. Key server returns `InvalidCertificate` mapped as `Session key has expired` during `fetchKeys`. |

## What Improved

- Replaced echo verification scripts with real scripts for config, Walrus, Sui publish, Move tests, and Seal proof.
- Published a Seal-compatible Move policy package on Sui testnet.
- Changed `AccessGrant` to shared-object mode so Seal key-server dry-runs can read it for the requester.
- Added live evidence files under `docs/`.
- Fixed `suiprivkey1...` parsing by using `decodeSuiPrivateKey`.
- Added a real Seal SDK wrapper with `SealClient`, `SessionKey`, `fetchKeys`, and `decrypt` path.

## Readiness Score

| Area | Score | Reason |
|------|-------|--------|
| Product/spec depth | 9/10 | Strong differentiated product direction: agent memory observability, replay, storage proof, access control. |
| Frontend demo | 8/10 | Usable app shell and workflows; build passes. Bundle warning should be reduced before final submission. |
| Walrus proof | 9/10 | Live publisher/aggregator roundtrip verified. |
| Sui proof | 9/10 | Live package publish and object creation verified. |
| MemWal proof | 4/10 | SDK integration exists, but credentials are missing due required wallet login. |
| Seal proof | 6/10 | Correct architecture and live encryption; full key release blocked by certificate validation. |
| Championship readiness today | 7/10 | Strong if pitched as Walrus/Sui-heavy DevTools project; not yet winner-grade for a Seal/MemWal-specific prize until both live proofs pass. |

## Highest Leverage Next Actions

1. Complete MemWal staging login and rerun `npm run memwal:configure`.
2. Re-run `npm run verify:seal` after resolving the key-server certificate error.
3. Add a recorded demo script that shows live Walrus blob ID, Sui package/object links, and the Seal failure proof honestly.
4. Split MemWal/Seal SDK imports behind dynamic imports to reduce the current Vite bundle warning.
