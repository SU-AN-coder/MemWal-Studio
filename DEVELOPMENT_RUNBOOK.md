# MemWal Studio Development Runbook

## 1. Repository

Remote:

```bash
git@github.com:SU-AN-coder/MemWal-Studio.git
```

Required local Git baseline:

```bash
git status
git remote -v
git branch --show-current
```

Use `main` as the default branch. Do not commit `.env`.

## 2. Environment

Local secrets and testnet settings live in `.env`. The file is intentionally ignored by Git.

Required variables:

```bash
SUI_PRIVATE_KEY=
SUI_NETWORK=testnet
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
WALRUS_PUBLISHER_URL=
WALRUS_AGGREGATOR_URL=
MEMWAL_API_URL=
MEMWAL_API_KEY=
SEAL_POLICY_PACKAGE_ID=
SEAL_POLICY_OBJECT_ID=
```

Rules:

- Browser code must not read `SUI_PRIVATE_KEY`.
- Only local scripts and server-side integration commands may read private keys.
- Public docs should reference addresses, object IDs, blob IDs, digests, and receipts, not private keys.
- If Walrus, MemWal, or Seal credentials are missing, the app may run in mock mode, but the UI must show degraded mode and the submission must not claim real persistence for that run.

## 3. Expected Project Scaffold

When implementation starts, create a real app rather than a static document bundle:

```text
package.json
src/
move/
scripts/
tests/
docs/
```

Recommended stack:

- Next.js or Vite + React + TypeScript.
- Strict TypeScript.
- Zod for persisted and external data.
- Vitest for unit tests.
- Playwright for UI smoke checks after the first interactive app exists.
- Sui Move package for memory-space ownership and Seal policy.

## 4. Verification Commands

Once the app exists, keep these scripts available:

```bash
npm run lint
npm run test
npm run build
npm run verify:storage
npm run verify:aggregator
npm run move:test
npm run verify:seal
npm run verify:demo
```

Expected proof artifacts:

```text
docs/storage-proof.json
docs/aggregator-proof.json
docs/seal-policy-proof.json
docs/demo-run-report.json
docs/submission-readiness-report.json
```

## 5. Real-Proof Gates

The project is not submission-ready unless all of these are true:

- A real MemWal or Walrus write returns a memory ID, receipt, or blob ID.
- At least one artifact or memory payload can be read outside the app through a Walrus aggregator or equivalent independent path.
- The independently read payload hash matches the Studio-recorded hash.
- A second agent with a different runtime profile recalls a first agent's memory through MemWal semantic recall.
- Sui testnet creates a MemorySpace object and AccessGrant object.
- `seal_approve` approves an active grant and denies the same requester after revoke.
- Mock mode remains available for local fallback but is visually and report-wise excluded from real proof claims.

## 6. Git Workflow

Use small, reviewable commits:

```bash
git status
git add <files>
git commit -m "docs: align MemWal Studio spec with Seal proof path"
git push origin main
```

Before pushing:

- Confirm `.env` is ignored.
- Run every available no-spend verification command.
- Check docs for accidental private-key exposure.
- Confirm README and SPEC mention only public IDs and proof artifacts.

