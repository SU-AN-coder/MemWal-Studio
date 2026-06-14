# MemWal Studio Demo and Judging Strategy

## 1. Winning Narrative

MemWal Studio should be pitched as infrastructure for the next generation of AI agents.

Core message:

> AI agents cannot become durable, collaborative systems if their memory is trapped in local files, proprietary vector stores, or single-app chat history. MemWal Studio uses MemWal / Walrus Memory to make agent memory persistent, portable, inspectable, and verifiable, then uses Sui + Seal policy to govern ownership, sharing, and revocation.

Do not pitch it as:

- "A decentralized Dropbox for AI files."
- "A dashboard for logs."
- "A chatbot memory tool."

Pitch it as:

- "Agent memory infrastructure."
- "A developer tool for debugging and auditing long-running agents."
- "A Walrus-backed memory workspace for multi-agent workflows."

## 2. Judging Alignment

### Product and UX

Show:

- Clean developer studio.
- One-click demo runner.
- Tables, timelines, graph, and artifact previews.
- Clear storage receipts.
- Copyable IDs and readable metadata.

Avoid:

- Huge landing page.
- Abstract diagrams without working flow.
- Terminal-only demo.

### Real-World Application

Explain:

- Agent teams need memory that survives one session.
- Companies need to audit what an agent knew and produced.
- Developers need tools to debug bad memory and prompt injection.
- Multi-agent systems need shared context.

### Technical Implementation

Show:

- Walrus / MemWal write and read.
- Content hashes.
- Independent Walrus aggregator hash verification.
- Artifact storage.
- Memory replay.
- Sui MemorySpace object.
- Access grant and revoke.
- Seal-compatible `seal_approve` policy proof.
- Storage adapter architecture.

### Presentation and Vision

Vision:

- Walrus can become the durable memory layer for agentic applications.
- MemWal Studio is the developer tool that makes that layer usable.
- Future versions can support framework adapters, encrypted memory, team workspaces, and marketplace-ready agent memory modules.
- The current championship version should already show either real Seal policy enforcement or clearly label Seal as prototype.

## 3. Five-Minute Demo Script

### 0:00-0:30 Problem

Say:

> AI agents are becoming long-running systems, but their memory is still fragmented. It lives in local files, vendor logs, or app-specific vector stores. That makes memory hard to trust, hard to share, and hard to audit.

Show:

- Dashboard empty state.
- Storage mode badge.
- Real/prototype/mock proof status.

### 0:30-1:10 Create Memory Space

Action:

- Create memory space `overflow-agent-research`.
- Show owner and storage mode.
- If Sui integration exists, show MemorySpace object ID.

Say:

> A memory space is the durable namespace for a workflow. Walrus stores the data, while Sui and Seal define who can decrypt and reuse it.

### 1:10-2:00 Run Research Agent

Action:

- Click "Run Research Agent".
- Show timeline filling with events.
- Show memories being written.
- Show artifacts created.

Say:

> The research agent writes structured memories, tool results, and a final report. These are not just local logs; each memory and artifact receives a storage receipt and content hash.

### 2:00-2:45 Inspect Memory and Artifacts

Action:

- Open Memory Inspector.
- Filter observations.
- Open one memory.
- Show raw JSON, hash, blob ID.
- Run or show aggregator verification for one blob.
- Open Artifact Vault.
- Preview markdown report.

Say:

> Developers can inspect exactly what the agent remembered, where it is stored, and which artifact it produced. For at least one item, we bypass the app, read through the Walrus aggregator, and verify the hash so this is not fake local state.

### 2:45-3:35 Multi-Agent Sharing

Action:

- Grant Strategy Agent read access.
- Run Strategy Agent.
- Show it using MemWal semantic recall to reuse Research Agent memory.
- Open graph showing cross-agent edge.

Say:

> Now another agent can continue from the same memory space. This is the core MemWal/Walrus value: context becomes portable across agents, runtimes, and workflows.

### 3:35-4:20 Replay and Audit

Action:

- Open Replay Timeline.
- Step through run.
- Open graph.
- Show artifact lineage.
- Show warning item.

Say:

> If the agent makes a bad decision, we can replay the run, inspect the memory that influenced it, and audit the generated artifacts.

### 4:20-4:50 Revoke Access

Action:

- Revoke Strategy Agent access.
- Try to read memory as Strategy Agent.
- Show denied state.
- Show revoke tx digest.
- If Seal is fully integrated, show `seal_approve` denial after revoke; otherwise show a prototype label and do not claim cryptographic revocation.

Say:

> Memory should be shareable, but governed. Owners can revoke access, and the winning path proves the decryption policy changes, not just the button state.

### 4:50-5:00 Closing

Say:

> MemWal Studio makes MemWal and Walrus usable as the persistent memory layer for agentic applications. It gives builders a control room for memory, artifacts, replay, governance, and audit.

## 4. Demo Data Requirements

The demo must include:

- 1 memory space.
- 2 agents.
- At least 2 runs.
- At least 8 events in first run.
- At least 5 memory items.
- At least 2 artifacts.
- At least 1 warning.
- At least 1 access grant.
- At least 1 revocation.
- At least 1 graph view showing cross-agent memory reuse.
- At least 1 real Walrus / MemWal receipt, if integration is available.
- At least 1 independent aggregator verification proof.
- At least 1 Sui tx digest.
- Seal policy proof if cryptographic revocation is claimed.

## 5. Submission Checklist

Before submission:

- Public GitHub repo.
- Deployed app URL.
- Demo video under 5 minutes.
- README with setup.
- Architecture document.
- Demo instructions.
- Walrus / MemWal receipt examples.
- Sui package ID and object IDs.
- Aggregator proof report.
- Seal proof report if claiming Seal support.
- Screenshots.
- Known limitations.

## 6. README Pitch Section

Use this in the project README:

```text
MemWal Studio is a Walrus-backed memory, artifact, replay, and audit workspace for AI agents.

Agents can write long-term memory, attach generated artifacts, share memory spaces with other agents, and replay completed runs. Developers can inspect storage receipts, content hashes, memory lineage, and access history.

The project demonstrates how MemWal and Walrus can become the persistent memory layer for long-running, collaborative agentic systems, with Sui + Seal policy for auditable access.
```

## 7. Judge Questions and Answers

### Why does this need Walrus?

Because agent memory must outlive one app runtime and remain portable across tools. Walrus gives a durable data layer for memories, artifacts, reports, datasets, and logs. MemWal Studio adds the developer workflow needed to inspect and reuse that data.

### Why not just use a vector database?

A vector database helps retrieval, but it does not solve durable artifact storage, cross-agent portability, verifiable receipts, ownership, access history, or replay. MemWal Studio can use vector search later, but Walrus is the persistence and trust layer.

### What is the Sui component?

Sui objects represent memory namespace ownership and access grants. The data lives in Walrus; the control plane lives on Sui, and Seal can use the Move policy to approve or deny decryption capability.

### What is the main technical achievement?

The project connects agent runtime events to persistent memory and artifact storage, proves at least one stored payload outside the app, then makes memory recall, access policy, and artifacts inspectable and replayable through a developer studio.

### What happens after the hackathon?

Next steps:

- Publish framework adapters.
- Add hosted team workspaces.
- Add semantic search.
- Add memory quality scoring.
- Add templates for research, trading, customer support, and coding agents.

## 8. What Would Make This Win

The project has the best chance if the final demo feels like a real tool, not a prototype.

Must feel real:

- IDs and hashes are visible.
- At least one ID is independently hash-verified through an aggregator path.
- Memory is retrieved after refresh.
- Two agents actually share context.
- Replay is useful.
- Artifact preview is polished.
- Access revoke is policy-backed or explicitly labeled prototype.

Must sound strategic:

- "Walrus as verifiable agent memory layer."
- "Persistent memory across sessions."
- "Cross-agent context sharing."
- "Developer tooling for debugging and auditing memory."
- "Sui + Seal policy for governed memory namespaces."
