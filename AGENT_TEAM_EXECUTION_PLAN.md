# MemWal Studio Agent Team Execution Plan

This plan is for fast AI-assisted implementation after the spec phase. Agents may work in parallel only when their file boundaries do not conflict.

## Prime Directive

Build MemWal Studio as a MemWal/Walrus observability, replay, governance, and audit product. Do not rebuild MemWal. Do not let a mock-only path look like real Walrus persistence.

## Agent 1: Product Shell And UX

Scope:

- Studio shell, navigation, responsive layout.
- Dashboard, Memory, Artifacts, Replay, Graph, Access, Demo views.
- Storage-mode and proof-status banners.

Done when:

- App opens directly into the usable Studio, not a landing page.
- Mock/real/prototype states are visually clear.
- No page-level horizontal overflow on desktop, tablet, or phone.

## Agent 2: Domain And Storage

Scope:

- Domain types and Zod schemas.
- Content hashing.
- Storage adapter interface.
- MockStorageAdapter.
- WalrusStorageAdapter.
- MemWalStorageAdapter wrapper.

Done when:

- Mock adapter has deterministic tests.
- Real adapter returns receipts or typed errors.
- Aggregator verification can independently read and hash-check one stored payload.

## Agent 3: Agent Runtime And Replay

Scope:

- Deterministic Research Agent.
- Deterministic Strategy Agent.
- Run recorder.
- Timeline event model.
- Cross-agent memory reuse proof.

Done when:

- Research Agent writes at least 5 memory items and 2 artifacts.
- Strategy Agent recalls Research Agent memory without local re-ingestion.
- Replay timeline reconstructs prompt, plan, tool call, memory write, artifact, decision, and output events.

## Agent 4: Sui Move And Seal Policy

Scope:

- Move package.
- MemorySpace and AccessGrant objects.
- `create_space`, `grant_access`, `revoke_access`.
- `seal_approve` policy function.
- Move tests.
- TypeScript transaction builders.

Done when:

- Sui testnet object and tx digest can be displayed.
- `seal_approve` approves a valid grant.
- Revoke changes policy outcome.
- UI does not claim cryptographic revocation unless the read path actually uses Seal.

## Agent 5: Evidence And Submission

Scope:

- Proof report generation.
- Storage proof verifier.
- Aggregator proof verifier.
- Seal proof verifier.
- Submission readiness report.
- README, demo script, and judging packet.

Done when:

- `docs/storage-proof.json`, `docs/aggregator-proof.json`, and `docs/seal-policy-proof.json` are generated.
- README can reproduce the proof commands.
- Manual and external-state gaps are listed separately from completed proof.

## Integration Loop

Use this loop after each meaningful implementation slice:

```bash
npm run lint
npm run test
npm run build
npm run verify:demo
```

Add these gates as soon as their modules exist:

```bash
npm run verify:storage
npm run verify:aggregator
npm run move:test
npm run verify:seal
```

## Non-Negotiable Submission Gates

- No private key in committed files.
- Real proof path uses MemWal/Walrus, not local mock.
- Mock mode is visibly degraded.
- At least one independent aggregator hash proof.
- Multi-agent semantic recall proof.
- Sui ownership object proof.
- Seal policy proof if claiming cryptographic revocation.
- Exported audit report links memory, artifacts, runs, access grants, warnings, and proof receipts.

