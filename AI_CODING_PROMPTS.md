# MemWal Studio AI Coding Prompts

Use these prompts to build the project module by module. Do not ask AI to generate the entire app in one response.

## 1. Global Coding Instruction

```text
You are a senior TypeScript engineer building MemWal Studio for Sui Overflow 2026 Walrus track.

Project thesis:
MemWal Studio is a developer-facing Walrus/MemWal-backed memory, artifact, replay, and audit workspace for AI agents.

Hard requirements:
1. Strict TypeScript.
2. Use small modules with clear boundaries.
3. Do not use `any` unless unavoidable and justified.
4. Validate external data with Zod.
5. Every async UI action must handle loading, success, and error states.
6. Preserve a mock mode so the demo works without external services.
7. Real Walrus/MemWal mode is the target demo path; mock mode must be visibly degraded and excluded from persistence claims.
8. Do not make a marketing landing page. Build the actual studio UI.
9. Do not build a competing memory SDK. Build an observability, replay, governance, and audit layer on top of MemWal/Walrus.
10. If a feature claims Seal revocation, it must use a Move `seal_approve` policy or be clearly labeled prototype.

When implementing, only edit the files required for the requested module.
Return a file list, commands to run, and testing notes.
```

## 2. App Bootstrap Prompt

```text
Create the initial Next.js + TypeScript app structure for MemWal Studio.

Implement:
- Studio shell layout with top bar and side navigation.
- Routes or tab views: Dashboard, Spaces, Runs, Memory, Artifacts, Graph, Access, Demo.
- Storage mode badge.
- Empty state for each page.
- Basic design system using Tailwind.

Do not implement business logic yet.
```

## 3. Domain Types Prompt

```text
Implement the domain type layer for MemWal Studio.

Create:
- MemorySpace
- AgentProfile
- MemoryItem
- Artifact
- AgentRun
- RunEvent
- AccessGrant
- StorageReceipt
- MemoryStorageAdapter

Also create Zod schemas for all external or persisted data.

Requirements:
- Types must match the SPEC.md data model.
- Include helper functions for stable IDs and ISO timestamps.
- Include unit tests for schema validation.
```

## 4. Mock Storage Prompt

```text
Implement MockStorageAdapter for MemWal Studio.

Requirements:
- Implements MemoryStorageAdapter.
- Supports writeJson, readJson, writeBytes, readBytes.
- Computes SHA-256 content hashes.
- Returns deterministic mock receipts with mock blob IDs.
- Stores data in IndexedDB or localStorage for browser persistence.
- Include tests for read-after-write and hash stability.
```

## 5. Memory Space Prompt

```text
Implement memory space creation and listing.

Requirements:
- Create MemorySpace form.
- List existing spaces.
- Select active space.
- Show owner, storage mode, created time, tags, and index blob ID.
- Use mock storage adapter for now.
- Persist state after refresh.
- Include loading/error/success states.
```

## 6. Demo Agents Prompt

```text
Implement deterministic demo agents for MemWal Studio.

Agents:
1. Research Agent
2. Strategy Agent

Research Agent flow:
- Start run.
- Record prompt.
- Record a plan event.
- Record at least 3 observation memories.
- Record one tool_call event.
- Record one tool_result event.
- Create a markdown report artifact.
- Write final decision memory.
- Finish run.

Strategy Agent flow:
- Requires read access to the memory space.
- Reads memories created by Research Agent.
- Records which memories it reused.
- Creates a launch plan artifact.
- Finishes run.

No live LLM required. Make output deterministic and polished for demo.
```

## 7. Memory Inspector Prompt

```text
Build the Memory Inspector screen.

Requirements:
- Table or list of memory items.
- Search by text.
- Filter by type, agent, run, and tag.
- Detail drawer with:
  - content
  - raw JSON
  - content hash
  - walrusBlobId or memWalMemoryId
  - parent memory IDs
  - linked artifacts
- Copy buttons for IDs.
- Empty state and error state.
```

## 8. Replay Timeline Prompt

```text
Build the Run Replay screen.

Requirements:
- List runs by memory space.
- Select a run.
- Show ordered timeline events.
- Event kinds need distinct icons or badges.
- Expand event payload.
- Show linked memory and artifact IDs.
- Add step forward/back controls.
- Add a compact run summary panel.
```

## 9. Artifact Vault Prompt

```text
Build the Artifact Vault screen.

Requirements:
- List artifacts.
- Preview markdown, JSON, CSV, and text.
- Show filename, mimeType, size, hash, blob ID.
- Show derivedFromMemoryIds.
- Download button.
- Link back to related memory items and run.
```

## 10. Access Control Prompt

```text
Implement local access grant/revoke flow.

Requirements:
- Show owner.
- Show agents.
- Grant read/write/admin access.
- Revoke access.
- Enforce access in Strategy Agent.
- Show access history.
- Prepare fields for grantTxDigest and revokeTxDigest, even if not connected to Sui yet.
```

## 11. Memory Graph Prompt

```text
Implement Memory Graph.

Requirements:
- Build graph data from spaces, agents, runs, memory items, artifacts, and access grants.
- Node types: space, agent, run, memory, artifact, access.
- Edge types: created_by, belongs_to_run, derived_from, attached_to, shared_with, revoked_from.
- Render graph with clickable nodes and detail panel.
- Include filters for agent, run, and memory type.
```

## 12. Walrus Adapter Prompt

```text
Implement WalrusStorageAdapter behind the existing MemoryStorageAdapter interface.

Requirements:
- Do not change UI code.
- Use environment variables for publisher and aggregator endpoints.
- Implement writeJson/readJson/writeBytes/readBytes.
- Return StorageReceipt with real Walrus blob ID when available.
- Verify content hash after read.
- Add an independent aggregator verification helper that bypasses the app read path and checks the returned bytes against the stored SHA-256 hash.
- If Walrus call fails, return typed error and allow retry.
- Keep mock mode intact.

Add clear README instructions for configuring Walrus endpoints.
```

## 13. Sui Move And Seal Policy Prompt

```text
Create a minimal Sui Move package for MemWal Studio memory ownership and Seal-compatible access approval.

Objects:
- MemorySpace
- AccessGrant

Functions:
- create_space(name, walrus_index_blob_id)
- grant_access(space, agent, permission, expires_at_ms)
- revoke_access(grant)
- seal_approve(space, grant, requester, permission, now_ms)

Events:
- MemorySpaceCreated
- AccessGranted
- AccessRevoked
- SealApprovalChecked

Requirements:
- Keep contract small and auditable.
- seal_approve must return approval only when the grant belongs to the space, requester matches the agent, permission is sufficient, grant is not revoked, and expiry has not passed.
- Add Move tests.
- Add TypeScript transaction builder stubs for frontend integration.
- Do not claim real cryptographic revocation until the frontend read path actually asks Seal and receives/denies key capability based on this policy.
```

## 14. Audit Report Prompt

```text
Implement exportable audit report.

The report should include:
- Memory space summary.
- Agents.
- Access grants and revocations.
- Runs.
- Timeline events.
- Memory items with hashes and storage IDs.
- Artifacts with hashes and storage IDs.
- Safety warnings.

Output format:
- Markdown export first.
- Optional JSON export.
```

## 15. Polish Prompt

```text
Perform final product polish for MemWal Studio.

Check:
- No text overflow.
- All buttons have clear loading/disabled states.
- Empty states are useful.
- Long IDs are truncated and copyable.
- Demo runner can reset and rerun.
- UI clearly labels mock vs real storage.
- No console errors.
- Full demo fits in 5 minutes.

Do not add unrelated features.
```
