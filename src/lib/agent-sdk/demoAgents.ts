// MemWal Studio - Demo Agents
// Deterministic demo agents that simulate agent workflows with hardcoded narratives.
// No live LLM calls - every run produces identical content.

import type { MemoryStorageAdapter } from "../storage/types";
import type { MemoryService } from "../services/memoryService";
import type { ArtifactService } from "../services/artifactService";
import type { RunRecorder } from "./runRecorder";
import type { MemoryItem, Artifact } from "../domain/types";

// ─── Research Agent ────────────────────────────────────────────

const RESEARCH_PROMPT =
  "Research the problem of AI agent memory fragmentation across different systems " +
  "and identify key challenges that need to be solved for reliable agent collaboration.";

export async function runResearchAgent(
  spaceId: string,
  agentId: string,
  runRecorder: RunRecorder,
  memoryService: MemoryService,
  artifactService: ArtifactService,
  storageAdapter: MemoryStorageAdapter,
): Promise<{ runId: string | null; memories: MemoryItem[]; artifacts: Artifact[] }> {
  const memories: MemoryItem[] = [];
  const artifacts: Artifact[] = [];

  // 1. Start run
  const run = runRecorder.start(spaceId, agentId, "Research Agent", RESEARCH_PROMPT);

  // 2. Record prompt event
  runRecorder.recordEvent("prompt", JSON.stringify({ prompt: RESEARCH_PROMPT }));

  // 3. Record plan event
  const planPayload = JSON.stringify({
    steps: [
      "Survey current agent memory architectures",
      "Identify fragmentation pain points",
      "Analyze cross-agent data sharing challenges",
      "Evaluate persistence and audit requirements",
      "Compile findings into structured report",
    ],
    methodology: "literature review + system analysis + synthetic reasoning",
  });
  runRecorder.recordEvent("plan", planPayload);

  // 4. Write 5 observation memories
  const observationDefs = [
    {
      title: "Vendor-Specific Memory Fragmentation",
      content:
        "Agent memory is fragmented across vendor stores. Each AI platform " +
        "(OpenAI, Anthropic, Google) maintains its own memory silo, making it " +
        "impossible for agents running on different providers to share context " +
        "or build on each other's discoveries. This vendor lock-in creates " +
        "artificial barriers to multi-agent systems.",
    },
    {
      title: "Session Context Loss",
      content:
        "Most LLM agents lose context between sessions. Without persistent, " +
        "verifiable memory, agents restart each conversation from scratch. " +
        "Long-running research tasks, multi-turn negotiations, and iterative " +
        "development workflows all suffer from this amnesia problem. Context " +
        "windows are also finite, forcing truncation of important history.",
    },
    {
      title: "Audit Trail Necessity",
      content:
        "Auditing agent decisions requires persistent memory trails. When an " +
        "agent makes a consequential decision (financial, medical, legal), there " +
        "must be a tamper-evident record of what information was available, what " +
        "reasoning was applied, and why the conclusion was reached. Current systems " +
        "lack cryptographically verifiable audit trails.",
    },
    {
      title: "Cross-Agent Collaboration Gap",
      content:
        "Cross-agent collaboration needs shared memory spaces. Specialized agents " +
        "(research, coding, strategy, review) must be able to read each other's " +
        "findings, build on prior work, and maintain a coherent shared understanding. " +
        "The absence of a standardized memory protocol prevents effective agent teams.",
    },
    {
      title: "Memory Security Concerns",
      content:
        "Security concerns with unencrypted agent memory are significant. Agent " +
        "memories may contain proprietary business logic, personal data, API keys, " +
        "or strategic plans. Without encryption at rest and in transit, plus " +
        "fine-grained access control, shared memory spaces become attack vectors " +
        "rather than collaboration enablers.",
    },
  ];

  for (const def of observationDefs) {
    const mem = await memoryService.writeMemory(
      {
        spaceId,
        runId: run.id,
        agentId,
        type: "observation",
        title: def.title,
        content: def.content,
        parents: [],
        artifactIds: [],
        tags: ["research", "memory", "fragmentation"],
        importance: 4,
        visibility: "shared",
      },
      storageAdapter,
    );
    memories.push(mem);
    runRecorder.recordEvent(
      "memory_write",
      JSON.stringify({ title: def.title, type: "observation" }),
      [mem.id],
    );
  }

  // 5. Tool call event (simulated web search)
  runRecorder.recordEvent(
    "tool_call",
    JSON.stringify({
      tool: "web_search",
      query: "AI agent memory fragmentation solutions 2024 2025",
      parameters: { max_results: 10, include_academic: true },
    }),
  );

  // 6. Tool result event
  runRecorder.recordEvent(
    "tool_result",
    JSON.stringify({
      tool: "web_search",
      results_count: 8,
      top_sources: [
        "arXiv: Agent Memory Architectures Survey (2024)",
        "Anthropic Research: Persistent Memory for Claude",
        "LangChain Memory Module Documentation",
        "Microsoft AutoGen: Multi-Agent Conversation Framework",
      ],
      summary:
        "Industry consensus points to the need for decentralized, content-addressed " +
        "memory storage with cryptographic verification. Walrus on Sui is emerging as " +
        "a leading solution for decentralized blob storage suitable for agent memory.",
    }),
  );

  // 7. Create artifacts
  const reportMarkdown = `# AI Agent Memory Fragmentation - Research Report

## Executive Summary

This report investigates the problem of AI agent memory fragmentation across
different systems and identifies key challenges for reliable agent collaboration.

## Key Findings

### 1. Vendor Fragmentation
Agent memory is siloed within each AI provider's ecosystem. OpenAI, Anthropic,
Google, and open-source models each implement memory differently, preventing
cross-platform agent collaboration.

### 2. Context Loss
Without persistent memory, agents lose all context between sessions. This makes
long-running research, iterative development, and complex multi-step tasks
extremely difficult.

### 3. Audit Gaps
Current systems lack tamper-evident audit trails. For high-stakes decisions
in finance, healthcare, and law, this is unacceptable.

### 4. Collaboration Barriers
Specialized agent teams cannot share findings or build on each other's work
without a common memory protocol.

### 5. Security Risks
Unencrypted, access-uncontrolled memory exposes sensitive data and creates
attack surfaces.

## Recommendations

1. Adopt content-addressed storage (e.g., Walrus on Sui) for tamper-evident memory
2. Implement cryptographic verification of all memory writes and reads
3. Establish fine-grained access control with on-chain audit logs
4. Standardize memory schemas for cross-agent interoperability
5. Encrypt all memory at rest and in transit
`;

  const art1 = await artifactService.createArtifact(
    {
      spaceId,
      runId: run.id,
      agentId,
      filename: "research-report.md",
      mimeType: "text/markdown",
      content: reportMarkdown,
      derivedFromMemoryIds: memories.map((m) => m.id),
    },
    storageAdapter,
  );
  artifacts.push(art1);
  runRecorder.recordEvent(
    "artifact_create",
    JSON.stringify({ filename: "research-report.md", mimeType: "text/markdown" }),
    [],
    [art1.id],
  );

  const findingsJson = JSON.stringify(
    {
      research_topic: "AI Agent Memory Fragmentation",
      date: new Date().toISOString().split("T")[0],
      key_challenges: [
        {
          id: "CH-001",
          title: "Vendor Fragmentation",
          severity: "high",
          impact: "Prevents cross-platform agent collaboration",
          affected_systems: ["OpenAI", "Anthropic", "Google", "Open-source"],
        },
        {
          id: "CH-002",
          title: "Context Loss Between Sessions",
          severity: "high",
          impact: "Makes long-running tasks unreliable",
          affected_systems: ["All LLM-based agents"],
        },
        {
          id: "CH-003",
          title: "Missing Audit Trails",
          severity: "critical",
          impact: "Cannot verify agent decision-making for compliance",
          affected_systems: ["Financial", "Healthcare", "Legal agents"],
        },
        {
          id: "CH-004",
          title: "Cross-Agent Collaboration Gap",
          severity: "high",
          impact: "Specialized agents cannot work as effective teams",
          affected_systems: ["Multi-agent frameworks"],
        },
        {
          id: "CH-005",
          title: "Memory Security",
          severity: "critical",
          impact: "Sensitive data exposure risk in shared memory",
          affected_systems: ["All agent memory systems"],
        },
      ],
      recommended_solution: "Walrus-backed decentralized memory with cryptographic proofs",
    },
    null,
    2,
  );

  const art2 = await artifactService.createArtifact(
    {
      spaceId,
      runId: run.id,
      agentId,
      filename: "findings.json",
      mimeType: "application/json",
      content: findingsJson,
      derivedFromMemoryIds: memories.map((m) => m.id),
    },
    storageAdapter,
  );
  artifacts.push(art2);
  runRecorder.recordEvent(
    "artifact_create",
    JSON.stringify({ filename: "findings.json", mimeType: "application/json" }),
    [],
    [art2.id],
  );

  // 8. Decision memory
  const decisionMem = await memoryService.writeMemory(
    {
      spaceId,
      runId: run.id,
      agentId,
      type: "decision",
      title: "Walrus Selected for Persistent Memory Layer",
      content:
        "After evaluating multiple storage solutions, Walrus on Sui is the " +
        "recommended persistence layer for agent memory. Its content-addressed " +
        "blob storage provides tamper-evident, decentralized memory that can be " +
        "verified on-chain. Combined with Sui's object model for access control, " +
        "this creates the ideal foundation for a cross-agent memory protocol.",
      parents: memories.map((m) => m.id),
      artifactIds: artifacts.map((a) => a.id),
      tags: ["decision", "architecture", "walrus"],
      importance: 5,
      visibility: "shared",
    },
    storageAdapter,
  );
  memories.push(decisionMem);
  runRecorder.recordEvent(
    "decision",
    JSON.stringify({ title: "Walrus Selected for Persistent Memory Layer" }),
    [decisionMem.id],
  );

  // 9. Warning memory
  const warningMem = await memoryService.writeMemory(
    {
      spaceId,
      runId: run.id,
      agentId,
      type: "warning",
      title: "Prompt Injection Risk in Shared Memory Spaces",
      content:
        "Warning: Shared memory spaces introduce prompt injection risks. Malicious " +
        "agents or users could write crafted content into shared memory that, when " +
        "read by another agent, manipulates its behavior. Mitigations must include " +
        "content sanitization, permission boundaries, and cryptographic signatures " +
        "to verify memory provenance before ingestion into an agent's context.",
      parents: [],
      artifactIds: [],
      tags: ["security", "warning", "prompt-injection"],
      importance: 5,
      visibility: "shared",
    },
    storageAdapter,
  );
  memories.push(warningMem);
  runRecorder.recordEvent(
    "warning",
    JSON.stringify({ title: "Prompt Injection Risk in Shared Memory Spaces" }),
    [warningMem.id],
  );

  // 10. Output event
  runRecorder.recordEvent(
    "output",
    JSON.stringify({
      summary: "Research complete. Identified 5 key challenges in agent memory fragmentation.",
      artifacts_created: ["research-report.md", "findings.json"],
      memories_written: memories.length,
      recommendation: "Adopt Walrus on Sui for decentralized, verifiable agent memory.",
    }),
  );

  // 11. Finish run
  runRecorder.finish("completed");

  return { runId: run.id, memories, artifacts };
}

// ─── Strategy Agent ────────────────────────────────────────────

const STRATEGY_PROMPT =
  "Create a launch strategy for MemWal Studio based on the research findings. " +
  "Identify target users, key features to prioritize, and a go-to-market plan.";

export async function runStrategyAgent(
  spaceId: string,
  agentId: string,
  runRecorder: RunRecorder,
  memoryService: MemoryService,
  artifactService: ArtifactService,
  storageAdapter: MemoryStorageAdapter,
): Promise<{ runId: string | null; memories: MemoryItem[]; artifacts: Artifact[] }> {
  const memories: MemoryItem[] = [];
  const artifacts: Artifact[] = [];

  // 1. Start run
  const run = runRecorder.start(spaceId, agentId, "Strategy Agent", STRATEGY_PROMPT);

  // 2. Record prompt event
  runRecorder.recordEvent("prompt", JSON.stringify({ prompt: STRATEGY_PROMPT }));

  // 3. Recall event - reading Research Agent's memories
  // Get existing research memories from the space
  const existingMemories = memoryService.searchMemories("fragmentation", spaceId);
  const recallTraceIds = existingMemories.map((m) => m.id);

  runRecorder.recordEvent(
    "recall",
    JSON.stringify({
      action: "recalled research findings",
      source: "Research Agent",
      memories_recalled: existingMemories.map((m) => ({
        id: m.id,
        title: m.title,
        type: m.type,
      })),
      recall_method: "semantic search for 'fragmentation'",
    }),
    recallTraceIds,
  );

  // 4. Plan memory
  const planMem = await memoryService.writeMemory(
    {
      spaceId,
      runId: run.id,
      agentId,
      type: "plan",
      title: "MemWal Studio Launch Strategy",
      content:
        "Launch Strategy Plan:\n" +
        "Phase 1 (Month 1-2): Developer Preview\n" +
        "- Release MemWal Studio as a Chrome DevTools extension\n" +
        "- Target AI agent developers building on LangChain, AutoGen, CrewAI\n" +
        "- Focus on memory inspection and replay capabilities\n\n" +
        "Phase 2 (Month 3-4): Team Beta\n" +
        "- Add multi-agent collaboration features\n" +
        "- Introduce access control and audit reports\n" +
        "- Partner with 5-10 AI agent framework teams\n\n" +
        "Phase 3 (Month 5-6): Public Launch\n" +
        "- Full Walrus mainnet integration\n" +
        "- Sui on-chain access control and billing\n" +
        "- Marketplace for shared agent memory spaces",
      parents: recallTraceIds,
      artifactIds: [],
      tags: ["strategy", "launch", "planning"],
      importance: 5,
      visibility: "shared",
    },
    storageAdapter,
  );
  memories.push(planMem);
  runRecorder.recordEvent(
    "memory_write",
    JSON.stringify({ title: "MemWal Studio Launch Strategy", type: "plan" }),
    [planMem.id],
  );

  // 5. Decision memory
  const decisionMem = await memoryService.writeMemory(
    {
      spaceId,
      runId: run.id,
      agentId,
      type: "decision",
      title: "Position MemWal Studio as the DevTools Layer for Agent Memory",
      content:
        "Decision: MemWal Studio should be positioned as the developer tools " +
        "layer for Walrus-backed agent memory, analogous to how Chrome DevTools " +
        "serves web developers. This means prioritizing an exceptional debugging " +
        "experience: visual memory graphs, replay capabilities, audit reports, " +
        "and real-time memory inspection. The platform should make it trivially " +
        "easy for developers to understand what their agents remember, verify " +
        "memory integrity, and debug agent decision-making.",
      parents: [...recallTraceIds, planMem.id],
      artifactIds: [],
      tags: ["decision", "positioning", "devtools"],
      importance: 5,
      visibility: "shared",
    },
    storageAdapter,
  );
  memories.push(decisionMem);
  runRecorder.recordEvent(
    "decision",
    JSON.stringify({ title: "Position MemWal Studio as the DevTools Layer" }),
    [decisionMem.id],
  );

  // 6. Create launch plan artifact
  const launchPlanMd = `# MemWal Studio - Launch Plan

## Product Positioning
MemWal Studio is the DevTools layer for Walrus-backed agent memory.
Positioned as "Chrome DevTools for AI agents" - making agent memory
visible, verifiable, and debuggable.

## Target Users

### Primary: AI Agent Developers
- Building on LangChain, CrewAI, AutoGen, or custom frameworks
- Need visibility into agent memory and decision-making
- Want replay capabilities for debugging agent behavior

### Secondary: Agent Operations Teams
- Managing fleets of production AI agents
- Need audit trails for compliance and debugging
- Require access control for multi-agent systems

### Tertiary: AI Safety Researchers
- Studying agent behavior patterns
- Need verifiable, tamper-evident memory for research
- Evaluating alignment through memory inspection

## Key Features (MVP)

1. **Memory Inspector** - Visualize all memories in a space
2. **Run Replay** - Step through agent decision-making
3. **Audit Reports** - Generate compliance-ready audit trails
4. **Access Control** - Fine-grained permissions for shared spaces
5. **Graph Visualization** - Interactive memory relationship graphs

## Go-to-Market Strategy

### Developer Preview (Free)
- Browser extension with local encrypted cache
- Single-agent memory inspection
- Community on Discord/GitHub

### Team Beta (Invite-only)
- Walrus testnet integration
- Multi-agent collaboration
- Early partner programs

### Public Launch
- Walrus mainnet with Sui on-chain access control
- Usage-based pricing on Sui
- Marketplace for community memory spaces

## Success Metrics
- Developer Preview: 1,000 weekly active developers
- Team Beta: 50 partner teams
- Public Launch: 10,000 MAU within 6 months
`;

  const art = await artifactService.createArtifact(
    {
      spaceId,
      runId: run.id,
      agentId,
      filename: "launch-plan.md",
      mimeType: "text/markdown",
      content: launchPlanMd,
      derivedFromMemoryIds: memories.map((m) => m.id),
    },
    storageAdapter,
  );
  artifacts.push(art);
  runRecorder.recordEvent(
    "artifact_create",
    JSON.stringify({ filename: "launch-plan.md", mimeType: "text/markdown" }),
    [],
    [art.id],
  );

  // 7. Output event
  runRecorder.recordEvent(
    "output",
    JSON.stringify({
      summary:
        "Launch strategy complete. MemWal Studio positioned as DevTools layer for agent memory. " +
        "Three-phase launch plan targeting AI agent developers.",
      artifacts_created: ["launch-plan.md"],
      memories_written: memories.length,
      key_decision: "Position as Chrome DevTools for AI agents",
    }),
  );

  // 8. Finish run
  runRecorder.finish("completed");

  return { runId: run.id, memories, artifacts };
}
