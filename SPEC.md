# MemWal Studio Product Specification

Version: 0.2  
Date: 2026-06-14  
Target event: Sui Overflow 2026  
Primary track: Walrus  
Working product name: MemWal Studio

## 1. Product Thesis

MemWal Studio is not another agent memory SDK. Walrus Memory / MemWal is the memory layer; MemWal Studio is the missing observability, governance, replay, and audit layer on top of it.

The product should be positioned like a database studio or DevTools console for agent memory:

- MemWal provides portable, verifiable, encrypted agent memory on Walrus.
- Seal and Sui provide policy-governed access control.
- MemWal Studio makes those memories, retrievals, artifacts, permissions, recalls, warnings, and agent runs inspectable by developers and auditors.

The core claim is:

> If MemWal is the durable memory substrate for AI agents, MemWal Studio is the control room that lets builders prove what was stored, what was recalled, who accessed it, which artifacts were derived from it, and whether access can be revoked by policy.

The project exists because advanced AI agents are no longer single-turn chatbots. They run over time, call tools, create files, delegate work, collaborate with other agents, and make decisions that need to be inspected later. Today, that memory is usually stored in local JSON files, proprietary vendor logs, short-lived vector databases, or app-specific silos. This breaks trust and composability.

MemWal Studio makes MemWal-backed agent memory:

- Persistent: stored beyond one session or one app runtime.
- Verifiable: backed by Walrus identifiers, content hashes, receipts, and independent read/hash checks.
- Available: retrievable after refresh, redeploy, or client change because memory is not trapped in local app state.
- Portable: usable by multiple agents, LLM providers, and frameworks through MemWal-backed recall.
- Inspectable: visible through a developer studio.
- Replayable: agent runs can be reconstructed step by step.
- Shareable: memory spaces can be delegated across agents.
- Governed: owners can grant, revoke, or scope access through Sui/Seal policy, not only UI state.

Strategic defense:

- This project does not compete with MemWal.
- It uses real MemWal APIs where possible, including the Vercel AI SDK integration path.
- Its value is the developer experience around MemWal: memory inspection, semantic recall visualization, artifact lineage, policy-governed sharing, Seal-based revocation, and audit export.

## 2. Competition Alignment

### 2.1 Walrus Track Fit

The project directly targets the Walrus track by implementing:

- Long-term memory using persistent, verifiable storage.
- Persistent data and file access using Walrus / Walrus Memory.
- Agentic workflows that retain context across sessions.
- Multi-agent coordination through shared memory spaces.
- Artifact-driven workflows that store datasets, logs, reports, and intermediate outputs.
- Developer tooling for inspecting, debugging, and managing agent memory.

Architecture dependency boundary:

- MemWal SDK is the primary agent memory interface.
- MemWal's relayer / service path is treated as the memory write and semantic recall substrate, not something MemWal Studio replaces.
- Walrus is used for durable memory/artifact/data persistence and independently verifiable blob reads.
- Sui and Seal are used for ownership and policy-governed access to encrypted memory.
- MemWal Studio sits above these layers as the UI, instrumentation, replay, governance, and audit product.

### 2.2 What This Is Not

This project must not look like:

- A simple file uploader.
- A generic vector search dashboard.
- A chatbot with saved history.
- A mock UI with no real Walrus writes.
- A local-only agent log viewer.
- A competing memory SDK. It builds on MemWal, not around it.
- A thin wrapper around MemWal APIs with no new developer workflow.

Every core flow must prove that Walrus / Walrus Memory is essential, and that MemWal Studio adds value that MemWal itself does not primarily provide: observability, replay, graph inspection, audit export, and policy-governed access UX.

### 2.3 Winning Criteria

The project should win by explicitly demonstrating the four MemWal/Walrus memory pillars plus a strong DevTools layer:

1. Verifiability
   - Every important memory and artifact has a content hash plus a Walrus blob ID or MemWal memory receipt.
   - The UI can verify that retrieved content still matches its recorded hash.
   - At least one demo step bypasses the app and reads the blob through a Walrus aggregator to prove the data is not fake UI state.

2. Availability
   - The same memory space can be reloaded after refresh or redeploy.
   - Memory remains accessible without relying on a single local app database.
   - The local index is treated as a cache, not the source of truth.

3. Portability
   - The same memory space is reused by agents backed by different LLM providers or runtime profiles, for example a GPT-backed Research Agent and a Claude-backed Strategy Agent.
   - The demo shows that recall is not tied to one model, chat session, or vendor memory store.

4. Shareability
   - One agent can write memories and artifacts.
   - Another authorized agent can semantically recall and reuse those memories.
   - Access can be revoked through Sui/Seal policy.

5. DevTools value
   - Developers can inspect semantic recalls, raw memory envelopes, storage receipts, replay timelines, artifact lineage, graph edges, safety warnings, access grants, and revocation history.
   - This is the part that makes the project more than "MemWal plus a UI".

## 3. Target Users

### 3.1 Primary User: Agent Developer

Profile:

- Builds AI agents using TypeScript, Python, LangChain, CrewAI, Eliza, custom scripts, or hosted LLM APIs.
- Needs to debug memory quality, hallucinated recall, tool outputs, and long-running workflows.
- Wants a portable memory layer that does not depend on one app or vendor.

Needs:

- Simple Studio adapter that can be copied into another agent project without replacing MemWal.
- MemWal write/recall instrumentation.
- Semantic recall inspection plus audit filters.
- Run timeline.
- Artifact viewer.
- Share and revoke access.

Success:

- Can integrate MemWal Studio instrumentation into an existing MemWal-enabled agent in under 30 minutes.
- Can replay a failed run and identify why the agent made a bad decision.
- Can pass memory from one agent to another without copying local files.

### 3.2 Secondary User: Team Lead / Auditor

Profile:

- Runs AI workflows for research, financial analysis, customer support, data processing, or operations.
- Needs traceability and audit.

Needs:

- Immutable-looking receipts.
- Clear ownership.
- Version history.
- Exportable report.
- Evidence that generated artifacts came from specific memories and tool calls.

Success:

- Can show a stakeholder what the agent knew, when it knew it, and what artifact it produced.

### 3.3 Tertiary User: Sui / Walrus Ecosystem Builder

Profile:

- Wants to adopt Walrus / MemWal in an agent project.

Needs:

- Reusable code.
- Clear example app.
- Copy-paste Studio adapter and event recorder.
- Docs and demo.

Success:

- Can copy the adapter and use it in a new hackathon project.

## 4. Core Product Story

### 4.1 Demo Scenario

The primary demo should be a research-to-strategy workflow that uses real MemWal-backed memory writes on the main path:

1. User creates a memory space named `overflow-market-research`.
2. The app creates or links the corresponding Sui `MemorySpace` object and stores the initial Walrus index receipt.
3. Research Agent receives a prompt: "Research AI agent memory problems and summarize product opportunities for Sui builders."
4. Research Agent:
   - runs through MemWal's supported SDK path where possible, preferably the Vercel AI SDK integration;
   - stores the original prompt;
   - writes intermediate notes;
   - attaches source snippets or generated data;
   - writes a final research report artifact to Walrus;
   - records each write/recall as a Studio event for replay.
5. MemWal Studio displays:
   - all memory items;
   - artifact blobs;
   - run timeline;
   - memory graph;
   - Walrus blob IDs / memory IDs;
   - semantic recall trace;
   - ownership object;
   - access policy.
6. Strategy Agent uses a different LLM provider/runtime profile from Research Agent and is granted read access to the same memory space.
7. Strategy Agent semantically recalls the existing memories and produces a launch plan.
8. Owner revokes Strategy Agent access through the Sui/Seal policy path.
9. Strategy Agent attempts to read encrypted memory again and fails because the Seal policy no longer approves key access.
10. MemWal Studio shows access history, revocation evidence, recall trace, graph lineage, and replay.

This proves persistent memory, cross-agent sharing, portability across models/runtimes, artifact workflows, real storage receipts, and policy-enforced governance.

### 4.2 Portability Demo Requirement

The demo must include a portability proof, not just a sharing proof.

Required:

- Agent A and Agent B use the same memory space.
- Agent A and Agent B are clearly labeled as different runtime profiles or LLM providers.
- Agent B recalls memory written by Agent A without copying files, exporting chat logs, or re-ingesting local JSON.
- The UI shows the recall query, the semantically matched memories, and the storage receipts behind them.

### 4.3 Optional Domain-Specific Demo

If time allows, add a second demo:

- Trading Journal Agent:
  - writes market observations;
  - stores analysis artifacts;
  - records decisions;
  - later reuses past observations to avoid repeating a bad strategy.

This helps connect Walrus memory to real-world high-value workflows without turning the project into a DeepBook submission.

## 5. Product Scope

### 5.1 MVP Scope

The MVP must include:

1. Memory Spaces
   - Create memory space.
   - List memory spaces.
   - Select active memory space.
   - Display owner and access policy.

2. Agent Run Recorder
   - Start run.
   - Record prompt.
   - Record agent steps.
   - Record tool call logs.
   - Record final output.
   - Attach artifacts.
   - End run.

3. Walrus / MemWal Persistence
   - Write memory items.
   - Read memory items.
   - Use the real MemWal SDK path for the primary demo where available.
   - Use Walrus blob storage for artifacts and metadata receipts.
   - Store artifacts.
   - Store metadata envelopes.
   - Show storage identifiers in UI.

4. Memory Inspector
   - Visualize semantic memory recall from MemWal.
   - Filter recalled memories by audit fields.
   - Filter by type.
   - Filter by agent.
   - Filter by run.
   - Inspect raw metadata.
   - Inspect linked artifacts.

5. Replay Timeline
   - Show ordered run events.
   - Expand each step.
   - Show inputs, outputs, tool name, timestamp, and linked memory.

6. Multi-Agent Sharing
   - Register at least two agents.
   - Share memory space from one agent to another.
   - Demonstrate second agent reading memory created by first agent.
   - Demonstrate second agent using a different LLM/runtime profile.
   - Revoke second agent access through Sui/Seal policy.

7. Visual Memory Graph
   - Nodes: memory item, artifact, run, agent.
   - Edges: created_by, derived_from, attached_to, shared_with.

8. Public Demo Mode
   - Primary path defaults to real MemWal/Walrus mode.
   - Mock mode exists only as a clearly labeled fallback for local development or network outages.
   - If mock mode is active, the UI must show an obvious degraded-mode banner and the project should not claim real persistence for that run.

### 5.2 Winning Scope

To become a top-tier project, add:

1. Real Walrus / MemWal integration.
2. Sui ownership object for memory namespace.
3. Access grants and revocation events.
4. Seal-protected encrypted memory envelope with Move `seal_approve` policy.
5. Prompt injection / memory poisoning warning.
6. Memory version diff.
7. Exportable audit report.
8. Copy-paste Studio instrumentation adapter for existing MemWal-enabled agent builders.
9. Independent aggregator verification for at least one memory/artifact blob.

### 5.3 Out of Scope

For hackathon delivery, do not build:

- A full general-purpose vector database.
- Enterprise RBAC with organizations and billing.
- Full decentralized identity system.
- Fully automated cloud agent hosting.
- Complex real-time collaboration.
- Custom LLM training.

## 6. Feature Details

### 6.1 Memory Space

A memory space is a named namespace for agent memories and artifacts.

Fields:

- `id`: local app ID.
- `suiObjectId`: Sui object ID for the namespace, if deployed.
- `name`: human-readable name.
- `description`: optional.
- `ownerAddress`: Sui address.
- `createdAt`: ISO timestamp.
- `defaultVisibility`: private / shared / public.
- `walrusIndexBlobId`: optional blob ID containing index metadata.
- `tags`: string array.

Required interactions:

- Create new memory space.
- View summary.
- Copy Sui object ID.
- Copy Walrus index blob ID.
- Open access policy panel.
- Delete local cache, but not necessarily delete Walrus data.

Acceptance criteria:

- User can create a memory space in under 20 seconds.
- UI shows whether the memory space is local mock, testnet Sui, or real Walrus backed.
- UI clearly distinguishes owner from shared agents.

### 6.2 Agent Registry

Agents are identities that write or read memory.

Fields:

- `id`.
- `name`.
- `type`: research / strategy / support / trading / custom.
- `description`.
- `publicKey` or `walletAddress`, optional.
- `permissions`: read / write / share / admin.
- `createdAt`.

Required interactions:

- Add agent.
- Assign icon/color.
- Grant access to memory space.
- Revoke access.
- View agent's written memories.

Acceptance criteria:

- Demo includes at least two agents.
- Revocation state is visible.
- Hackathon MVP may additionally block revoked reads in the UI, but the winning path must prove real policy enforcement: after revocation, Seal no longer approves key access for that agent.

### 6.3 Memory Item

A memory item is a structured unit of durable agent memory.

Types:

- `prompt`: user prompt or task.
- `observation`: data or fact recorded by an agent.
- `reasoning_summary`: high-level reasoning summary, not hidden chain-of-thought.
- `tool_call`: tool invocation record.
- `tool_result`: result from tool.
- `decision`: decision made by agent.
- `artifact_reference`: link to generated file/report/data.
- `checkpoint`: state snapshot.
- `warning`: risk, injection, or quality warning.

Fields:

- `id`.
- `spaceId`.
- `runId`.
- `agentId`.
- `type`.
- `title`.
- `content`.
- `contentHash`.
- `walrusBlobId` or `memWalMemoryId`.
- `metadataBlobId`, optional.
- `artifactIds`.
- `parents`: memory item IDs.
- `tags`.
- `importance`: 1-5.
- `visibility`.
- `createdAt`.
- `updatedAt`.

Required interactions:

- Create memory item.
- Recall memory semantically through MemWal.
- Filter recalled memory items by audit fields such as type, agent, run, tag, risk level, and storage mode.
- Inspect raw JSON.
- View linked artifacts.
- View parent/child lineage.
- Copy storage IDs.

Acceptance criteria:

- Memory item includes verifiable storage reference.
- UI shows whether item is persisted, pending, failed, or mock.
- The same item can be retrieved after page refresh.
- The UI distinguishes semantic recall from audit filtering:
  - semantic recall is the MemWal-powered retrieval path.
  - filters are developer inspection controls layered on top of recalled or indexed results.
- At least one demo recall shows the query text, matched memories, match reason or score when available, and source storage receipts.

### 6.4 Artifact

Artifacts are files or structured outputs generated or used by an agent.

Types:

- Markdown report.
- JSON dataset.
- CSV.
- PDF.
- Image.
- Code snippet.
- Tool log.
- Prompt pack.

Fields:

- `id`.
- `spaceId`.
- `runId`.
- `agentId`.
- `filename`.
- `mimeType`.
- `sizeBytes`.
- `contentHash`.
- `walrusBlobId`.
- `previewText`.
- `createdAt`.
- `derivedFromMemoryIds`.

Required interactions:

- Upload or create artifact.
- Preview artifact.
- Download artifact.
- Link artifact to memory item.
- View artifact lineage.

Acceptance criteria:

- At least one generated report artifact is stored and visible.
- At least one JSON/CSV artifact is stored and visible.
- Artifact page shows blob ID and hash.

### 6.5 Run Replay

A run is a full agent session.

Run fields:

- `id`.
- `spaceId`.
- `agentId`.
- `status`: running / completed / failed.
- `prompt`.
- `startedAt`.
- `endedAt`.
- `summary`.
- `memoryIds`.
- `artifactIds`.
- `eventIds`.

Event fields:

- `id`.
- `runId`.
- `kind`: prompt / plan / memory_write / tool_call / tool_result / artifact_created / decision / warning / final_output.
- `timestamp`.
- `title`.
- `payload`.
- `linkedMemoryIds`.
- `linkedArtifactIds`.

Required interactions:

- Select run.
- Play/pause replay.
- Step forward/back.
- Expand event payload.
- Jump to linked memory.
- Jump to linked artifact.

Acceptance criteria:

- Demo run has at least 8 timeline events.
- Replay can reconstruct the agent session without relying on a terminal log.
- Timeline includes at least one tool call, one artifact, one memory write, and one final output.

### 6.6 Memory Graph

The graph makes memory lineage visible.

Node types:

- Memory space.
- Agent.
- Run.
- Memory item.
- Artifact.
- Access grant.

Edge types:

- `created_by`.
- `belongs_to_run`.
- `derived_from`.
- `attached_to`.
- `shared_with`.
- `revoked_from`.

Required interactions:

- Pan and zoom.
- Click node to inspect details.
- Filter by run / agent / memory type.
- Highlight lineage of selected artifact.

Acceptance criteria:

- The graph clearly shows Agent A memory being reused by Agent B.
- The graph distinguishes artifact nodes from memory nodes.

### 6.7 Access Control

Access control is a core differentiator because it connects Walrus data, MemWal memory, Sui ownership, and Seal key release policy.

MVP:

- Local policy model for development fallback.
- Owner can grant read/write.
- Owner can revoke.
- UI enforces policy as a secondary safety layer.

Winning version:

- Sui Move object records memory namespace ownership.
- Access grants are objects or events.
- Each memory write can include namespace ID.
- Revocation emits event.
- Memory payloads that contain sensitive or shared content are encrypted before being stored on Walrus.
- Seal releases decryption capability only when the Move policy approves the caller.
- Revocation changes the policy result so a revoked agent cannot decrypt future reads through the approved path.

Policy fields:

- `spaceId`.
- `ownerAddress`.
- `agentId`.
- `permission`: read / write / admin.
- `expiresAt`, optional.
- `revokedAt`, optional.
- `grantTxDigest`, optional.
- `revokeTxDigest`, optional.

Acceptance criteria:

- Demo shows owner granting Agent B read access.
- Demo shows Agent B reading shared memory.
- Demo shows owner revoking access.
- UI shows before/after policy state.
- Winning demo shows real Seal-policy enforcement or, if full Seal integration is not ready, clearly labels the feature as incomplete and does not claim true cryptographic revocation.

### 6.8 Memory Quality and Safety

This feature makes the project more than storage.

Checks:

- Duplicate memory detection.
- Contradictory memory warning.
- Prompt injection marker.
- Missing source warning.
- Stale memory warning.
- Oversharing warning for sensitive content.

MVP checks:

- Source-missing detector.
- Cross-memory contradiction detector.
- Stale memory detector.
- Sensitive-content sharing warning.
- Basic prompt injection detector.

Acceptance criteria:

- Demo includes one warning item.
- Warning is stored as a memory item.
- UI shows how warning affects later recall.
- Warnings are persisted as auditable memory items, not transient UI notices.
- At least one warning links to the memory items or artifact that triggered it.

## 7. Data Model

Use TypeScript types as the source of truth.

```ts
export type StorageMode = "mock" | "walrus" | "memwal";

export interface MemorySpace {
  id: string;
  name: string;
  description?: string;
  ownerAddress?: string;
  suiObjectId?: string;
  walrusIndexBlobId?: string;
  storageMode: StorageMode;
  sealPolicyPackageId?: string;
  sealPolicyObjectId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  type: "research" | "strategy" | "support" | "trading" | "custom";
  description?: string;
  walletAddress?: string;
  runtimeProfile?: "gpt" | "claude" | "local" | "custom";
  modelLabel?: string;
  color: string;
  createdAt: string;
}

export type MemoryType =
  | "prompt"
  | "observation"
  | "reasoning_summary"
  | "tool_call"
  | "tool_result"
  | "decision"
  | "artifact_reference"
  | "checkpoint"
  | "warning";

export interface MemoryItem {
  id: string;
  spaceId: string;
  runId?: string;
  agentId: string;
  type: MemoryType;
  title: string;
  content: string;
  contentHash: string;
  storageMode: StorageMode;
  walrusBlobId?: string;
  memWalMemoryId?: string;
  metadataBlobId?: string;
  encryptedBlobId?: string;
  sealPolicyId?: string;
  recallTraceIds: string[];
  parents: string[];
  artifactIds: string[];
  tags: string[];
  importance: 1 | 2 | 3 | 4 | 5;
  visibility: "private" | "shared" | "public";
  createdAt: string;
  updatedAt: string;
}

export interface RecallTrace {
  id: string;
  spaceId: string;
  runId?: string;
  agentId: string;
  query: string;
  provider: "memwal" | "mock";
  matchedMemoryIds: string[];
  scores?: Record<string, number>;
  explanation?: string;
  createdAt: string;
}

export interface Artifact {
  id: string;
  spaceId: string;
  runId?: string;
  agentId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  contentHash: string;
  walrusBlobId?: string;
  previewText?: string;
  derivedFromMemoryIds: string[];
  createdAt: string;
}

export interface AgentRun {
  id: string;
  spaceId: string;
  agentId: string;
  status: "running" | "completed" | "failed";
  prompt: string;
  summary?: string;
  memoryIds: string[];
  artifactIds: string[];
  eventIds: string[];
  startedAt: string;
  endedAt?: string;
}

export interface RunEvent {
  id: string;
  runId: string;
  kind:
    | "prompt"
    | "plan"
    | "memory_write"
    | "tool_call"
    | "tool_result"
    | "artifact_created"
    | "decision"
    | "warning"
    | "final_output";
  timestamp: string;
  title: string;
  payload: unknown;
  linkedMemoryIds: string[];
  linkedArtifactIds: string[];
}

export interface AccessGrant {
  id: string;
  spaceId: string;
  agentId: string;
  permission: "read" | "write" | "admin";
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  grantTxDigest?: string;
  revokeTxDigest?: string;
  sealApproved?: boolean;
  sealPolicyId?: string;
}
```

## 8. API Specification

### 8.1 Memory Space API

```ts
createMemorySpace(input: {
  name: string;
  description?: string;
  ownerAddress?: string;
  storageMode: StorageMode;
}): Promise<MemorySpace>

listMemorySpaces(): Promise<MemorySpace[]>

getMemorySpace(spaceId: string): Promise<MemorySpace>

updateMemorySpace(spaceId: string, patch: Partial<MemorySpace>): Promise<MemorySpace>
```

### 8.2 Memory API

```ts
writeMemory(input: {
  spaceId: string;
  agentId: string;
  runId?: string;
  type: MemoryType;
  title: string;
  content: string;
  parents?: string[];
  artifactIds?: string[];
  tags?: string[];
  importance?: 1 | 2 | 3 | 4 | 5;
  visibility?: "private" | "shared" | "public";
}): Promise<MemoryItem>

readMemory(memoryId: string): Promise<MemoryItem>

searchMemory(input: {
  spaceId: string;
  query?: string;
  agentId?: string;
  runId?: string;
  type?: MemoryType;
  tags?: string[];
}): Promise<MemoryItem[]>

semanticRecall(input: {
  spaceId: string;
  agentId: string;
  runId?: string;
  query: string;
  limit?: number;
}): Promise<{
  trace: RecallTrace;
  memories: MemoryItem[];
}>
```

`searchMemory` is an audit/filtering API for the Studio UI. `semanticRecall` is the MemWal-powered retrieval path that agents should use for meaningful recall. The product must not replace MemWal semantic retrieval with a weaker keyword-only implementation.

### 8.3 Artifact API

```ts
createArtifact(input: {
  spaceId: string;
  agentId: string;
  runId?: string;
  filename: string;
  mimeType: string;
  bytes: Uint8Array | string;
  derivedFromMemoryIds?: string[];
}): Promise<Artifact>

getArtifact(artifactId: string): Promise<Artifact>

downloadArtifact(artifactId: string): Promise<Blob>

verifyArtifactWithAggregator(artifactId: string): Promise<{
  artifactId: string;
  walrusBlobId: string;
  expectedHash: string;
  actualHash: string;
  verified: boolean;
}>
```

### 8.4 Run Recorder API

```ts
startRun(input: {
  spaceId: string;
  agentId: string;
  prompt: string;
}): Promise<AgentRun>

recordEvent(input: {
  runId: string;
  kind: RunEvent["kind"];
  title: string;
  payload: unknown;
  linkedMemoryIds?: string[];
  linkedArtifactIds?: string[];
}): Promise<RunEvent>

finishRun(input: {
  runId: string;
  summary: string;
  status: "completed" | "failed";
}): Promise<AgentRun>
```

### 8.5 Access API

```ts
grantAccess(input: {
  spaceId: string;
  agentId: string;
  permission: "read" | "write" | "admin";
  expiresAt?: string;
}): Promise<AccessGrant>

revokeAccess(grantId: string): Promise<AccessGrant>

canAgentAccess(input: {
  spaceId: string;
  agentId: string;
  permission: "read" | "write" | "admin";
}): Promise<boolean>
```

## 9. Sui Move and Seal Policy Specification

The Move package should be small and focused, but it must do more than emit governance-looking events. Its winning purpose is to act as the policy source for Seal-protected memory access.

The required chain is:

1. Memory or artifact payload is encrypted before being stored on Walrus.
2. The encrypted payload references a Sui policy object.
3. A caller asks Seal for decryption capability.
4. Seal checks the Move policy function.
5. The policy approves only if the caller has an active, non-expired, non-revoked grant.
6. Revocation changes policy outcome, so a revoked agent cannot decrypt through the approved path.

### 9.1 Objects

```move
public struct MemorySpace has key, store {
    id: UID,
    name: String,
    owner: address,
    walrus_index_blob_id: String,
    seal_policy_id: vector<u8>,
    created_at_ms: u64,
}

public struct AccessGrant has key, store {
    id: UID,
    space_id: ID,
    agent: address,
    permission: u8,
    expires_at_ms: u64,
    revoked: bool,
}

public struct SealApproval has copy, drop {
    approved: bool,
    space_id: ID,
    requester: address,
    permission: u8,
}
```

### 9.2 Events

```move
public struct MemorySpaceCreated has copy, drop {
    space_id: ID,
    owner: address,
    walrus_index_blob_id: String,
}

public struct AccessGranted has copy, drop {
    grant_id: ID,
    space_id: ID,
    agent: address,
    permission: u8,
    expires_at_ms: u64,
}

public struct AccessRevoked has copy, drop {
    grant_id: ID,
    space_id: ID,
    agent: address,
}

public struct SealApprovalChecked has copy, drop {
    space_id: ID,
    requester: address,
    approved: bool,
    reason_code: u8,
}
```

### 9.3 Functions

```move
public entry fun create_space(
    name: vector<u8>,
    walrus_index_blob_id: vector<u8>,
    seal_policy_id: vector<u8>,
    ctx: &mut TxContext
)

public entry fun grant_access(
    space: &MemorySpace,
    agent: address,
    permission: u8,
    expires_at_ms: u64,
    ctx: &mut TxContext
)

public entry fun revoke_access(
    grant: &mut AccessGrant,
    ctx: &mut TxContext
)

/// Policy function used by Seal-compatible access control.
/// Exact signature may be adjusted to the current Seal SDK requirements,
/// but the package must expose a deterministic approval path that checks:
/// - grant belongs to the requested memory space;
/// - requester is the granted agent;
/// - grant is not revoked;
/// - grant is not expired;
/// - requested permission is allowed.
public fun seal_approve(
    space: &MemorySpace,
    grant: &AccessGrant,
    requester: address,
    requested_permission: u8,
    now_ms: u64
): bool
```

### 9.4 Acceptance Criteria

- User can create a MemorySpace object on Sui testnet.
- UI displays object ID.
- User can create AccessGrant event.
- User can revoke grant.
- UI displays grant and revoke tx digest.
- Move package exposes a Seal-compatible approval function.
- Before revocation, the policy approves an authorized agent.
- After revocation, the same policy denies the same agent.
- Demo does not claim true encrypted revocation unless Seal integration is actually wired to the policy.

## 10. Frontend Specification

### 10.1 Navigation

Primary nav:

- Spaces
- Runs
- Memory
- Artifacts
- Graph
- Access
- Demo

### 10.2 Main Screens

#### Dashboard

Purpose:

- Show product value immediately.

Content:

- Active memory space.
- Number of memories.
- Number of artifacts.
- Number of agent runs.
- Current storage mode.
- Recent run timeline preview.
- Warnings.

#### Memory Spaces

Content:

- List of spaces.
- Create space modal.
- Owner and storage IDs.
- Tags.
- Access summary.

#### Run Replay

Content:

- Run list.
- Timeline.
- Event details.
- Linked memory and artifacts.
- Playback controls.

#### Memory Inspector

Content:

- Search bar.
- Type filters.
- Agent filters.
- Memory list.
- Raw JSON panel.
- Storage receipt panel.

#### Artifact Vault

Content:

- Artifact grid/table.
- Preview panel.
- Hash and blob ID.
- Download button.
- Lineage links.

#### Memory Graph

Content:

- Force graph or node-link diagram.
- Filter controls.
- Inspector drawer.

#### Access Control

Content:

- Owner card.
- Agent list.
- Grants.
- Revoke buttons.
- Tx digest display.

#### Demo Runner

Purpose:

- One-click reliable hackathon demo.

Content:

- Run Research Agent.
- Run Strategy Agent.
- Grant access.
- Revoke access.
- Reset demo data.

### 10.3 UI Requirements

- The first screen must be the actual studio, not a marketing landing page.
- Keep UI dense but readable, like a developer tool.
- Use tabs, split panels, tables, timelines, and inspectors.
- Avoid large decorative hero sections.
- Every async action must show loading, success, and error states.
- Long IDs must be copyable and truncated.
- Empty states must offer a clear action.
- Demo mode must be obvious but not look fake.

## 11. Backend and Storage Specification

### 11.1 Storage Adapters

Implement a common interface for Studio instrumentation, not a competing memory SDK. The adapter layer exists so the UI can display receipts, hashes, recall traces, and fallback state consistently while the primary path uses MemWal/Walrus.

```ts
export interface MemoryStorageAdapter {
  mode: StorageMode;
  writeJson(input: { key: string; value: unknown }): Promise<StorageReceipt>;
  readJson<T>(receipt: StorageReceipt): Promise<T>;
  writeBytes(input: { key: string; bytes: Uint8Array; mimeType: string }): Promise<StorageReceipt>;
  readBytes(receipt: StorageReceipt): Promise<Uint8Array>;
  verifyReceipt?(receipt: StorageReceipt): Promise<{ verified: boolean; actualHash?: string }>;
}

export interface StorageReceipt {
  mode: StorageMode;
  key: string;
  contentHash: string;
  walrusBlobId?: string;
  memWalMemoryId?: string;
  aggregatorUrl?: string;
  sealPolicyId?: string;
  encrypted?: boolean;
  localPath?: string;
  createdAt: string;
}
```

Adapters:

- `MemWalStorageAdapter`: primary memory path. It should call the real MemWal SDK where available, including supported agent framework integrations such as the Vercel AI SDK path. It should expose memory IDs, semantic recall traces, and any Walrus receipts available through MemWal.
- `WalrusStorageAdapter`: primary artifact and metadata path. It stores artifact bytes, metadata envelopes, and audit exports in Walrus and supports independent aggregator verification.
- `MockStorageAdapter`: deterministic local development fallback only. It must never be visually indistinguishable from real storage.

Demo rule:

- The main hackathon demo must default to real `memwal` or `walrus` mode.
- Mock mode is allowed only as a fallback and must display a prominent degraded-mode banner.
- Any run created in mock mode must be excluded from claims about real persistence, Seal enforcement, or independent verifiability.

### 11.2 Local Index

The app can keep a local index for speed, but the index is not the source of truth.

Use:

- IndexedDB for frontend-only version, or
- SQLite for backend version.

The local index stores:

- memory IDs;
- artifact IDs;
- blob IDs;
- search cache;
- UI state.

### 11.3 Hashing

Every memory and artifact must have content hash:

- Use SHA-256.
- Hash canonical JSON for metadata.
- Hash raw bytes for artifacts.

Acceptance:

- UI displays hash prefix.
- Raw inspector displays full hash.

## 12. Security and Privacy

### 12.1 Threats

- Agent writes sensitive data to public storage.
- Malicious memory injection.
- Agent B reads memory after revocation.
- Local cache disagrees with Walrus persisted data.
- User mistakes mock data for real data.

### 12.2 Controls

MVP controls:

- Storage mode badge.
- Sensitive content warning.
- Access check before read.
- Prompt injection detector.
- Hash verification on read.
- Revoked agents blocked by app policy as a fallback only.

Winning controls:

- Seal-compatible encrypted memory envelope.
- Sui object grants used as the policy source.
- Move `seal_approve` policy check.
- Revocation event display.
- Demonstrated failure to decrypt after revocation through the Seal path.
- Audit report export.

### 12.3 Seal-Protected Encryption Envelope

Design:

```ts
interface EncryptedEnvelope {
  version: "1";
  encryption: "seal-compatible";
  ciphertextBlobId: string;
  metadataHash: string;
  spaceId: string;
  suiSpaceObjectId: string;
  sealPolicyId: string;
  requiredPermission: "read" | "write" | "admin";
  allowedReaders: string[];
  createdBy: string;
  createdAt: string;
}
```

Required winning behavior:

- Plain memory payload is encrypted before Walrus storage.
- Envelope metadata records the Sui policy object and required permission.
- The read path asks Seal for decrypt capability.
- Seal approval is based on the Move `seal_approve` policy.
- A revoked grant no longer passes policy.

Fallback rule:

- If full Seal integration is not complete, the UI may show a prototype envelope and local policy simulation, but it must label the feature as `prototype` and must not claim real cryptographic access revocation.

## 13. Testing Requirements

### 13.1 Unit Tests

Required:

- content hash stable.
- memory schema validation.
- storage adapter mock round trip.
- access grant/revoke logic.
- search filters.
- replay event ordering.

### 13.2 Integration Tests

Required:

- create space -> write memory -> refresh -> read memory.
- run agent demo -> generate artifacts -> replay timeline.
- grant access -> second agent reads -> revoke -> read blocked.
- anti-fake storage proof:
  - write a memory or artifact;
  - receive a real Walrus blob ID or MemWal memory receipt;
  - bypass the app and read the same blob through the Walrus aggregator or equivalent independent read path;
  - verify that the retrieved content hash matches the Studio-recorded hash.
- Seal policy proof:
  - grant access;
  - confirm approval succeeds;
  - revoke access;
  - confirm the same requester is denied by the policy.
- portability proof:
  - Agent A writes memory using one runtime profile;
  - Agent B uses a different runtime profile;
  - Agent B semantically recalls Agent A's memory without re-ingesting local files.

### 13.3 Manual QA

Checklist:

- No console errors during demo.
- Demo runner works from empty state.
- All IDs copy correctly.
- UI works on desktop and laptop widths.
- Real Walrus/MemWal mode is the default demo path.
- If real Walrus is unavailable, mock mode still produces a coherent local demo, but the UI shows degraded mode.
- README explains how to switch storage mode.

## 14. Submission Requirements

Before submission:

- Public GitHub repo.
- Deployed website.
- Testnet Sui package ID if Move object is included.
- Walrus blob IDs or MemWal memory IDs from demo.
- Independent aggregator verification evidence for at least one blob or memory payload.
- Seal policy evidence if claiming cryptographic access control.
- 5-minute YouTube demo video.
- README with setup and architecture.
- Demo script.
- Screenshots.

## 15. Acceptance Criteria for Hackathon-Ready

The project is hackathon-ready only when all are true:

- A new user can create a memory space.
- A demo agent can write at least 5 memory items.
- At least 2 artifacts are stored and linked to memory.
- UI shows storage receipts.
- At least one complete demo run produces a real Walrus blob ID or MemWal memory ID.
- At least one stored item can be independently read and hash-verified outside the app.
- A second agent using a different LLM/runtime profile can read shared memory through MemWal semantic recall.
- Owner can revoke access.
- If claiming Seal support, revoked access is denied by the Seal/Move policy path, not just by frontend state.
- Replay timeline reconstructs a run.
- Memory graph shows cross-agent memory reuse.
- At least one memory safety warning appears.
- Warnings are persisted as auditable memory items.
- README can run the project from scratch.
- Demo video can be recorded without manual database edits.

## 16. Development Operations And Agent-Team Execution

### 16.1 Local Environment

Local development uses `.env` for testnet credentials and external service endpoints. `.env` must be ignored by Git. `.env.example` documents the required keys without secrets:

```text
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

- Browser code must never read `SUI_PRIVATE_KEY`.
- Only local scripts, server actions, or CI-safe secret contexts may read private keys.
- Public documents may include Sui addresses, object IDs, transaction digests, Walrus blob IDs, MemWal memory IDs, and proof report paths.
- Public documents must not include private keys or API keys.

### 16.2 Git And Remote Repository

The working repository should use:

```text
git@github.com:SU-AN-coder/MemWal-Studio.git
```

Required repo behavior:

- Use `main` as the default branch.
- Keep `.env` ignored.
- Keep generated proof reports under `docs/` when they are safe to publish.
- Use small commits that map to spec milestones.
- Before push, run all available no-spend checks.

### 16.3 Required Development Runbook

`DEVELOPMENT_RUNBOOK.md` is part of the engineering spec. It must stay current with:

- environment setup;
- Git workflow;
- local verification commands;
- proof artifact names;
- real-proof gates;
- mock-mode limitations.

### 16.4 Agent Team Execution

`AGENT_TEAM_EXECUTION_PLAN.md` is the default split for AI-assisted implementation:

1. Product Shell And UX.
2. Domain And Storage.
3. Agent Runtime And Replay.
4. Sui Move And Seal Policy.
5. Evidence And Submission.

Each agent must preserve the prime directive: MemWal Studio is the observability, replay, governance, and audit layer above MemWal/Walrus, not a replacement memory SDK.

### 16.5 Championship Verification Gates

The final project should expose these commands once implementation exists:

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

Required proof reports:

```text
docs/storage-proof.json
docs/aggregator-proof.json
docs/seal-policy-proof.json
docs/demo-run-report.json
docs/submission-readiness-report.json
```

The project must not be marked submission-ready until the proof reports show:

- real Walrus/MemWal write evidence;
- independent read/hash verification for at least one stored item;
- cross-agent semantic recall;
- Sui ownership/access object proof;
- Seal policy approval and denial proof if cryptographic revocation is claimed;
- complete replay and audit export for the demo run.
