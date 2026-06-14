# MemWal Studio Implementation Plan

## 1. Build Philosophy

Build the demo path first, then deepen the infrastructure.

The winning version is not the one with the most screens. It is the one that can reliably show:

1. A real agent writes memory and artifacts.
2. The data is persisted with Walrus / MemWal receipts.
3. Another agent can reuse it.
4. Developers can inspect, replay, and audit the workflow.
5. Sui objects provide ownership and access proof.
6. Seal policy proves that revocation is not just a frontend block.
7. At least one Walrus/MemWal object can be independently read and hash-verified outside the app.

## 2. Milestones

### Milestone 0: Repo Setup

Deliverables:

- Next.js + TypeScript app.
- Tailwind or equivalent styling.
- Basic layout.
- Strict TypeScript.
- Lint script.
- Test script.
- `README.md`.

Definition of done:

- `npm run dev` works.
- Empty studio UI loads.
- No console errors.

### Milestone 1: Domain Types and Mock Storage

Deliverables:

- TypeScript domain types.
- Zod schemas.
- SHA-256 hashing utility.
- Mock storage adapter.
- Local index store.

Files:

```text
src/lib/domain/types.ts
src/lib/domain/schemas.ts
src/lib/storage/types.ts
src/lib/storage/hash.ts
src/lib/storage/mockStorageAdapter.ts
src/lib/index/localIndex.ts
```

Definition of done:

- Can write and read JSON through mock adapter.
- Can write and read bytes through mock adapter.
- Hash is stable across runs.
- Unit tests pass.

### Milestone 2: Memory Space and Agent Registry

Deliverables:

- Create/list memory spaces.
- Add/list agents.
- Active memory space selector.
- Storage mode badge.

Screens:

- Dashboard.
- Spaces.
- Agents/access panel.

Definition of done:

- User can create `overflow-research`.
- User can create Research Agent and Strategy Agent.
- State persists after refresh.

### Milestone 3: Run Recorder and Demo Agents

Deliverables:

- Run recorder service.
- Demo Research Agent.
- Demo Strategy Agent.
- Timeline events.

Files:

```text
src/lib/agent-sdk/runRecorder.ts
src/lib/agent-sdk/demoAgents.ts
src/lib/services/runService.ts
src/features/demo/DemoRunner.tsx
src/features/replay/ReplayTimeline.tsx
```

Definition of done:

- One click runs Research Agent.
- At least 8 events are created.
- Timeline shows prompt, plan, tool call, memory write, artifact, decision, final output.

### Milestone 4: Memory Inspector

Deliverables:

- Memory write API.
- Memory search API.
- Memory list.
- Memory details drawer.
- Raw JSON view.
- Storage receipt display.

Definition of done:

- Research Agent writes at least 5 memories.
- User can filter by type and agent.
- User can inspect blob/hash metadata.

### Milestone 5: Artifact Vault

Deliverables:

- Artifact create API.
- Artifact preview.
- Artifact metadata.
- Link artifacts to memories.

Definition of done:

- Research Agent creates markdown report.
- Research Agent creates JSON dataset.
- Both artifacts appear in artifact vault.
- Artifact lineage links back to memory.

### Milestone 6: Multi-Agent Sharing

Deliverables:

- Access grants.
- Local policy enforcement.
- Grant/revoke UI.
- Strategy Agent reads Research Agent memory.

Definition of done:

- Owner grants Strategy Agent read access.
- Strategy Agent produces a launch plan using Research Agent memory.
- Owner revokes access.
- Strategy Agent read is blocked after revoke.

### Milestone 7: Memory Graph

Deliverables:

- Graph data builder.
- Node-link graph UI.
- Inspector panel.
- Filters.

Definition of done:

- Graph shows memory space, agents, runs, memories, artifacts.
- Graph clearly shows Agent A memory reused by Agent B.
- Clicking a node opens details.

### Milestone 8: Walrus / MemWal Integration

Deliverables:

- Walrus storage adapter.
- MemWal adapter using the real SDK path where available, including Vercel AI SDK integration.
- Configurable storage mode.
- Real receipt display.
- Independent aggregator verification command.

Definition of done:

- At least one memory envelope is written to Walrus / MemWal.
- At least one artifact is written to Walrus.
- UI displays real blob or memory IDs.
- Read-after-write works.
- A verifier bypasses the app, reads through the Walrus aggregator or equivalent independent path, and checks the content hash.

### Milestone 9: Sui Move Ownership, Access, and Seal Policy

Deliverables:

- Move package.
- `create_space`.
- `grant_access`.
- `revoke_access`.
- `seal_approve`.
- TypeScript transaction builders.
- UI displays object IDs and tx digests.
- Seal-compatible encrypted memory envelope.

Definition of done:

- Create MemorySpace object on Sui testnet.
- Grant Agent B access.
- Revoke Agent B access.
- Tx digests visible in UI.
- Before revocation, the policy approves Agent B.
- After revocation, the same policy denies Agent B.
- If full Seal SDK integration is incomplete, the UI labels the feature as prototype and does not claim cryptographic revocation.

### Milestone 10: Safety and Polish

Deliverables:

- Prompt injection detector.
- Stale memory warning.
- Missing source warning.
- Exportable audit report.
- Loading/error states.
- Demo reset.

Definition of done:

- Demo includes one warning memory.
- Export report includes memory IDs, artifact IDs, and timeline summary.
- Full 5-minute demo can be recorded without manual edits.

## 3. Priority Order

Absolute must-have:

1. Demo runner.
2. Memory write/read.
3. Artifact storage.
4. Replay timeline.
5. Multi-agent sharing.
6. Real Walrus/MemWal receipt.

Strong differentiators:

1. Sui ownership object.
2. Seal-backed access revocation proof.
3. Memory graph.
4. Safety warnings.
5. Export report.

Nice-to-have:

1. Framework adapters for LangChain/CrewAI/Eliza.
2. Advanced semantic search.
3. Team workspaces.

## 4. Suggested Development Schedule

### Day 1

- Create app.
- Add layout.
- Add types and schemas.
- Add mock storage.
- Add local index.

### Day 2

- Build memory spaces.
- Build agent registry.
- Build demo runner.
- Record timeline events.

### Day 3

- Build memory inspector.
- Build artifact vault.
- Generate report artifact.
- Add replay timeline.

### Day 4

- Add multi-agent sharing.
- Add graph.
- Add safety warnings.
- Make demo path reliable.

### Day 5

- Integrate Walrus / MemWal.
- Add storage receipts.
- Fix read-after-write.
- Add environment config.

### Day 6

- Add Sui Move package.
- Add transaction builders.
- Add object ID and tx digest display.
- Add access grant/revoke demo.
- Add `seal_approve` policy tests.
- Add encrypted envelope metadata and Seal integration boundary.

### Day 7

- Polish UI.
- Write README, architecture, demo instructions.
- Record dry-run demo.
- Fix errors and edge cases.

## 5. Task Breakdown

### Frontend Tasks

- Studio shell layout.
- Space selector.
- Dashboard metrics.
- Memory table.
- Memory detail drawer.
- Artifact grid/table.
- Artifact preview.
- Replay timeline.
- Graph visualization.
- Access control panel.
- Demo runner panel.
- Toasts and error states.

### Service Tasks

- `createMemorySpace`.
- `writeMemory`.
- `searchMemory`.
- `createArtifact`.
- `startRun`.
- `recordEvent`.
- `finishRun`.
- `grantAccess`.
- `revokeAccess`.
- `buildGraph`.
- `exportAuditReport`.

### Storage Tasks

- Mock adapter.
- Walrus adapter.
- MemWal adapter.
- Content hash.
- Receipt verification.
- Retry failed write.

### Move Tasks

- `MemorySpace` object.
- `AccessGrant` object.
- Create space.
- Grant access.
- Revoke access.
- Seal approval policy.
- Events.
- Tests.

### Demo Agent Tasks

- Research Agent deterministic script.
- Strategy Agent deterministic script.
- Optional LLM mode.
- Tool call simulation.
- Artifact generation.
- Memory reuse proof.

## 6. Definition of Done

The project is complete enough for submission when:

- `npm run dev` works from clean install.
- Full demo can run from empty state.
- At least one real Walrus/MemWal write is shown.
- At least one Sui testnet object/tx is shown.
- Two agents share memory.
- Revocation is demonstrated.
- Replay timeline works.
- Memory graph works.
- README explains setup and demo.
- Demo video can be recorded in under 5 minutes.

## 7. Known Tradeoffs

If time is short:

- Prefer deterministic demo agents over unreliable live LLM agents.
- Prefer one perfect Walrus write/read flow over many partial integrations.
- Prefer simple Move ownership object over complex on-chain policy.
- Prefer clear visual replay over advanced vector search.

Do not sacrifice:

- Real persistence evidence.
- Multi-agent memory reuse.
- Memory inspector.
- Seal policy honesty: do not claim real cryptographic revocation unless the policy path proves it.
- Demo reliability.
