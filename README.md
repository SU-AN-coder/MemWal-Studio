# MemWal Studio

MemWal Studio is a Walrus-backed memory, artifact, replay, and audit workspace for AI agents.

Agents can write long-term memory, attach generated artifacts, share memory spaces with other agents, and replay completed runs. Developers can inspect storage receipts, content hashes, memory lineage, and access history.

The project demonstrates how MemWal and Walrus can become the persistent memory layer for long-running, collaborative agentic systems, with Sui + Seal policy for auditable access.

## Primary Track

Walrus (Sui Overflow 2026)

## One-Line Pitch

MemWal Studio turns fragile AI agent memory into a persistent, inspectable, shareable, and verifiable Walrus-backed workspace for long-running and multi-agent workflows.

## Why This Project Exists

AI agents are becoming long-running systems, but most agent memory is still trapped in local databases, vendor-specific vector stores, or app-specific logs. That makes memory hard to trust, hard to share across tools, and hard to audit after an agent makes a decision.

MemWal Studio solves this by providing:

- **Walrus-backed long-term memory** via MemWal SDK
- **Durable artifact storage** for reports, datasets, logs, prompts, and generated files
- **A memory inspector** for developers
- **Replay timelines** for completed agent runs
- **Cross-agent memory spaces** with semantic recall
- **Interactive memory graph** for lineage visualization
- **Access control and revocation** built around Sui ownership objects
- **Seal-compatible encrypted memory** governed by Move `seal_approve` policy
- **Independent Walrus aggregator verification** for storage proof
- **Studio SDK** for external agent instrumentation

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### First Run

On first visit, a Demo Space is automatically created with pre-populated demo data (Research Agent memories, artifacts, and run). Explore all views to see the full workflow.

### Real MemWal Integration

To use real persistent storage on Walrus/MemWal:

1. Get credentials from https://staging.memory.walrus.xyz
2. Open MemWal Studio → click storage mode toggle to "MEMWAL"
3. Enter your MEMWAL_PRIVATE_KEY and MEMWAL_ACCOUNT_ID in the config panel
4. Click "Test Connection" to verify
5. Run the demo agents to see real blob_ids

### Sui Wallet Connection

Click the wallet button in the top bar to connect your Sui wallet. This enables:
- Real Sui addresses for agent identity
- Transaction signing for on-chain access grants
- Move contract interaction (after testnet deployment)

## Project Structure

```
src/
├── lib/
│   ├── domain/          # TypeScript types, Zod schemas, ID helpers
│   ├── storage/         # Storage adapters (Mock, Walrus, MemWal)
│   ├── index/           # Local index cache with localStorage persistence
│   ├── services/        # Business logic (memory, artifact, run, access, graph, audit)
│   ├── agent-sdk/       # Run recorder and deterministic demo agents
│   ├── sui/             # Sui transaction builders (@mysten/sui)
│   ├── seal/            # Seal SDK client for encrypted memory
│   └── studio-sdk.ts    # External agent instrumentation SDK
├── components/          # Shared UI components
├── features/            # View components (Dashboard, Spaces, Memory, etc.)
└── App.tsx              # Main app shell with navigation
move/
└── memwal_studio/       # Sui Move package (MemorySpace, AccessGrant, seal_approve)
docs/                    # Proof artifacts and submission reports
```

## Verification Commands

```bash
npm run lint          # TypeScript type check
npm run test          # Run all tests (19 tests)
npm run build         # Production build
npm run verify:demo   # Full verification (lint + test + build)
npm run move:test     # Move contract tests (requires Sui CLI)
```

## Proof Artifacts

| File | Status | Description |
|------|--------|-------------|
| `docs/storage-proof.json` | SDK Ready | MemWal SDK integrated, requires credentials |
| `docs/aggregator-proof.json` | Code Ready | Independent verification path implemented |
| `docs/seal-policy-proof.json` | Move Tested | seal_approve flow verified in Move tests |
| `docs/demo-run-report.json` | Complete | Full submission readiness report |

## Demos

### 5-Minute Demo Flow

1. **Create Space** → "overflow-agent-research"
2. **Run Research Agent** → 7 memories + 2 artifacts
3. **Inspect Memory** → Content hashes, storage receipts, raw JSON
4. **Run Strategy Agent** → Cross-agent semantic recall
5. **Replay Timeline** → Step through 11 events
6. **View Graph** → Interactive node-link diagram
7. **Grant/Revoke Access** → Policy enforcement
8. **Export Audit Report** → Markdown/JSON download

### Studio SDK Usage

Copy `src/lib/studio-sdk.ts` into your agent project:

```ts
import { StudioClient } from "./studio-sdk";

const studio = StudioClient.connect({
  spaceId: "my-space",
  memwalPrivateKey: "ed25519:...",
  memwalAccountId: "...",
});

await studio.startRun("agent-1", "Research Agent", "Research prompt");
await studio.recordMemory({
  type: "observation",
  title: "Memory fragmentation",
  content: "Agent memory is fragmented across vendor stores.",
});
await studio.createArtifact({
  filename: "report.md",
  mimeType: "text/markdown",
  content: "# Research Report\n\nFindings...",
});
await studio.finishRun();

// Semantic recall
const results = await studio.semanticRecall("memory problems");
```

## Sui Move Package

The Move package (`move/memwal_studio/`) provides:

- **MemorySpace** object: namespace ownership proof
- **AccessGrant** object: permission proof for agent access
- **seal_approve()**: Seal-compatible policy function for cryptographic access control
- **Events**: MemorySpaceCreated, AccessGranted, AccessRevoked, SealApprovalChecked

Deploy to testnet:
```bash
cd move/memwal_studio
sui client publish --gas-budget 100000000
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Storage**: MemWal SDK (`@mysten-incubation/memwal`), Walrus HTTP API
- **Blockchain**: Sui SDK (`@mysten/sui`), dApp Kit wallet connection
- **Encryption**: Seal SDK (`@mysten/seal`)
- **Graph**: @xyflow/react with dagre auto-layout
- **Icons**: lucide-react
- **Validation**: Zod
- **Testing**: Vitest

## Competition Strategy

The project should not be presented as a generic file uploader or vector database UI. It must be presented as an **agent memory operating layer**:

1. Agents write memory through MemWal where available and artifacts to Walrus
2. Developers inspect exactly what was remembered, reused, shared, and produced
3. Another agent with a different runtime profile can continue from the same persistent memory space
4. The full workflow can be replayed and audited
5. Sui objects plus Seal policy prove ownership, access, and revocation
6. At least one memory or artifact is independently read through a Walrus aggregator and hash-verified

## Document Map

- [SPEC.md](./SPEC.md): Complete product, feature, data, API, and acceptance specification
- [ARCHITECTURE.md](./ARCHITECTURE.md): System architecture, modules, data flow, storage model
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md): Milestone plan, tasks, build order
- [DEMO_AND_JUDGING.md](./DEMO_AND_JUDGING.md): Demo script, judging alignment, winning narrative
- [DEVELOPMENT_RUNBOOK.md](./DEVELOPMENT_RUNBOOK.md): Environment, Git, verification commands
- [AGENT_TEAM_EXECUTION_PLAN.md](./AGENT_TEAM_EXECUTION_PLAN.md): Agent-team work split
