# MemWal Studio

MemWal Studio is a Sui Overflow 2026 Walrus-track project concept and development spec.

The product is a verifiable memory, artifact, replay, governance, and audit workspace for AI agents. It builds above MemWal / Walrus Memory as the persistent memory substrate, uses Walrus for independently verifiable artifact storage, and uses Sui + Seal policy for ownership, access, and revocation.

## Primary Track

Walrus.

## One-Line Pitch

MemWal Studio turns fragile AI agent memory into a persistent, inspectable, shareable, and verifiable Walrus-backed workspace for long-running and multi-agent workflows.

## Why This Project Exists

AI agents are becoming long-running systems, but most agent memory is still trapped in local databases, vendor-specific vector stores, or app-specific logs. That makes memory hard to trust, hard to share across tools, and hard to audit after an agent makes a decision.

MemWal Studio solves this by providing:

- Walrus-backed long-term memory.
- Durable artifact storage for reports, datasets, logs, prompts, tool outputs, and generated files.
- A memory inspector for developers.
- Replay timelines for completed agent runs.
- Cross-agent memory spaces.
- Access control and revocation built around Sui ownership objects.
- Seal-compatible encrypted memory envelopes governed by Move `seal_approve` policy.
- Independent Walrus aggregator verification so the demo can prove it is not local mock state.

## Document Map

- [SPEC.md](./SPEC.md): complete product, feature, data, API, and acceptance specification.
- [ARCHITECTURE.md](./ARCHITECTURE.md): system architecture, modules, data flow, storage model, and security model.
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md): milestone plan, tasks, build order, and definition of done.
- [AI_CODING_PROMPTS.md](./AI_CODING_PROMPTS.md): prompts for using AI to generate code module by module.
- [DEMO_AND_JUDGING.md](./DEMO_AND_JUDGING.md): demo script, judging alignment, winning narrative, and submission checklist.
- [DEVELOPMENT_RUNBOOK.md](./DEVELOPMENT_RUNBOOK.md): environment, Git, local verification, and iteration commands.
- [AGENT_TEAM_EXECUTION_PLAN.md](./AGENT_TEAM_EXECUTION_PLAN.md): agent-team work split for fast AI-assisted implementation.

## Competition Strategy

The project should not be presented as a generic file uploader or vector database UI. It must be presented as an agent memory operating layer:

1. Agents write memory through MemWal where available and artifacts to Walrus.
2. Developers inspect exactly what was remembered, reused, shared, and produced.
3. Another agent with a different runtime profile can continue from the same persistent memory space.
4. The full workflow can be replayed and audited.
5. Sui objects plus Seal policy prove ownership, access, and revocation.
6. At least one memory or artifact is independently read through a Walrus aggregator and hash-verified.

The highest-value demo is a two-agent workflow:

1. A research agent gathers data and writes memories plus artifacts.
2. A strategy agent reads the same memory space and produces a new output.
3. The owner revokes access through the policy path.
4. MemWal Studio shows the memory graph, artifact lineage, replay timeline, storage receipts, aggregator proof, and access policy.

## Local Environment

Copy `.env.example` to `.env` and fill the local test values. `.env` is intentionally ignored by Git.

The repository is configured for:

```text
git@github.com:SU-AN-coder/MemWal-Studio.git
```
