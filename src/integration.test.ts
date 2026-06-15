// MemWal Studio - Domain & Storage Integration Tests

import { describe, expect, it, beforeEach } from "vitest";
import { MockStorageAdapter } from "./lib/storage/mockStorageAdapter";
import { createMemoryService } from "./lib/services/memoryService";
import { createArtifactService } from "./lib/services/artifactService";
import { createRunService } from "./lib/services/runService";
import { createAccessService } from "./lib/services/accessService";
import { createGraphService } from "./lib/services/graphService";
import { createAuditService } from "./lib/services/auditService";
import { LocalIndex } from "./lib/index/localIndex";
import { RunRecorder } from "./lib/agent-sdk/runRecorder";
import { runResearchAgent, runStrategyAgent } from "./lib/agent-sdk/demoAgents";
import { generateId, shortId } from "./lib/domain/helpers";
import { computeHash } from "./lib/storage/hash";

function setupServices() {
  const index = new LocalIndex();
  const storage = new MockStorageAdapter();
  const memoryService = createMemoryService({
    index,
    storageMode: "MOCK" as const,
  });
  const artifactService = createArtifactService({
    index,
    storageMode: "MOCK" as const,
  });
  const runService = createRunService({ index });
  const accessService = createAccessService({ index });
  const graphService = createGraphService({ index });
  const auditService = createAuditService({ index });

  return {
    index,
    storage,
    memoryService,
    artifactService,
    runService,
    accessService,
    graphService,
    auditService,
  };
}

describe("Mock Storage Adapter", () => {
  it("writes and reads JSON with deterministic receipts", async () => {
    const storage = new MockStorageAdapter();
    const testData = { hello: "world", number: 42 };
    const receipt = await storage.writeJson("test-key", testData);

    expect(receipt.blobId).toContain("mock_blob_");
    expect(receipt.storageMode).toBe("MOCK");
    expect(receipt.contentHash).toBeTruthy();

    const { data, receipt: readReceipt } = await storage.readJson<
      typeof testData
    >("test-key", receipt.contentHash);
    expect(data).toEqual(testData);
    expect(readReceipt.contentHash).toBe(receipt.contentHash);
  });

  it("throws on hash mismatch", async () => {
    const storage = new MockStorageAdapter();
    await storage.writeJson("hash-test", { a: 1 });
    await expect(storage.readJson("hash-test", "wrong-hash")).rejects.toThrow(
      "Hash mismatch",
    );
  });

  it("throws on missing key", async () => {
    const storage = new MockStorageAdapter();
    await expect(storage.readJson("nonexistent")).rejects.toThrow(
      "Key not found",
    );
  });
});

describe("Content Hashing", () => {
  it("produces deterministic hashes", async () => {
    const hash1 = await computeHash("hello world");
    const hash2 = await computeHash("hello world");
    expect(hash1).toBe(hash2);
    expect(hash1).toContain("sha256:");
  });

  it("produces different hashes for different content", async () => {
    const hash1 = await computeHash("hello world");
    const hash2 = await computeHash("hello world!");
    expect(hash1).not.toBe(hash2);
  });
});

describe("Memory Service", () => {
  const svc = setupServices();

  it("creates a memory space", () => {
    const space = svc.memoryService.createMemorySpace({
      name: "test-space",
      description: "A test memory space",
      owner: "test-owner",
      tags: ["test", "demo"],
    });

    expect(space.id).toContain("space_");
    expect(space.name).toBe("test-space");
    expect(space.storageMode).toBe("MOCK");
    expect(svc.index.getSpaces()).toHaveLength(1);
  });

  it("writes a memory item with hash and receipt", async () => {
    const spaceId = generateId("space");
    const runId = generateId("run");
    const agentId = generateId("agent");

    const memory = await svc.memoryService.writeMemory(
      {
        spaceId,
        runId,
        agentId,
        type: "observation",
        title: "Test Memory",
        content: "This is a test observation about agent memory.",
        tags: ["test"],
        importance: 4,
      },
      svc.storage,
    );

    expect(memory.contentHash).toBeTruthy();
    expect(memory.storageReceipt).toBeTruthy();
    expect(memory.storageReceipt!.storageMode).toBe("MOCK");
    expect(svc.index.getMemories(spaceId)).toHaveLength(1);
  });

  it("searches memories by text", async () => {
    const spaceId = generateId("space");
    const runId = generateId("run");
    await svc.memoryService.writeMemory(
      {
        spaceId,
        runId,
        agentId: "a1",
        type: "observation",
        title: "Agent memory fragmentation",
        content: "Memory is fragmented across stores.",
        tags: [],
      },
      svc.storage,
    );
    await svc.memoryService.writeMemory(
      {
        spaceId,
        runId,
        agentId: "a1",
        type: "decision",
        title: "Use Walrus",
        content: "We should use Walrus for persistence.",
        tags: [],
      },
      svc.storage,
    );

    const results = svc.memoryService.searchMemories("fragmented", spaceId);
    expect(results).toHaveLength(1);
    expect(results[0].title).toContain("fragmentation");
  });
});

describe("Artifact Service", () => {
  const svc = setupServices();

  it("creates an artifact with metadata", async () => {
    const spaceId = generateId("space");
    const runId = generateId("run");
    const agentId = generateId("agent");

    const artifact = await svc.artifactService.createArtifact(
      {
        spaceId,
        runId,
        agentId,
        filename: "report.md",
        mimeType: "text/markdown",
        content: "# Research Report\n\nFindings about agent memory.",
        derivedFromMemoryIds: [],
      },
      svc.storage,
    );

    expect(artifact.filename).toBe("report.md");
    expect(artifact.mimeType).toBe("text/markdown");
    expect(artifact.contentHash).toBeTruthy();
    expect(artifact.storageReceipt).toBeTruthy();
    expect(svc.index.getArtifacts(spaceId)).toHaveLength(1);
  });
});

describe("Run Service", () => {
  const svc = setupServices();

  it("manages run lifecycle", () => {
    const spaceId = generateId("space");
    const agentId = generateId("agent");

    const run = svc.runService.startRun(
      spaceId,
      agentId,
      "Test Agent",
      "Test prompt",
    );
    expect(run.status).toBe("running");
    expect(run.events).toHaveLength(0);

    svc.runService.recordEvent(
      run.id,
      "memory_write",
      '{"test":true}',
      ["mem1"],
      [],
    );
    svc.runService.recordEvent(
      run.id,
      "artifact_create",
      '{"name":"test"}',
      [],
      ["art1"],
    );

    const updated = svc.runService.getRun(run.id)!;
    expect(updated.events).toHaveLength(2);
    expect(updated.events[0].kind).toBe("memory_write");

    svc.runService.finishRun(run.id, "completed");
    const finished = svc.runService.getRun(run.id)!;
    expect(finished.status).toBe("completed");
    expect(finished.finishedAt).toBeTruthy();
  });
});

describe("Access Service", () => {
  const svc = setupServices();

  it("grants and revokes access", () => {
    const spaceId = generateId("space");
    const agentId = generateId("agent");

    const grant = svc.accessService.grantAccess({
      spaceId,
      agentId,
      agentName: "Strategy Agent",
      permission: "read",
      granterAgentId: "owner",
    });

    expect(grant.status).toBe("active");
    expect(grant.permission).toBe("read");

    // Check access
    expect(svc.accessService.checkAccess(spaceId, agentId, "read")).toBe(true);
    expect(svc.accessService.checkAccess(spaceId, agentId, "write")).toBe(
      false,
    );

    // Revoke
    const revoked = svc.accessService.revokeAccess(grant.id);
    expect(revoked.status).toBe("revoked");
    expect(revoked.revokedAt).toBeTruthy();

    // Check access after revoke
    expect(svc.accessService.checkAccess(spaceId, agentId, "read")).toBe(false);
  });
});

describe("Graph Service", () => {
  it("builds graph from data", async () => {
    const svc = setupServices();
    const space = svc.memoryService.createMemorySpace({
      name: "graph-test",
      description: "",
      owner: "owner",
      tags: [],
    });

    const runId = svc.runService.startRun(
      space.id,
      "agent1",
      "Research Agent",
      "prompt",
    ).id;
    const agentId1 = generateId("agent");
    const agentId2 = generateId("agent");

    await svc.memoryService.writeMemory(
      {
        spaceId: space.id,
        runId,
        agentId: agentId1,
        type: "observation",
        title: "Mem 1",
        content: "c",
        tags: [],
      },
      svc.storage,
    );
    await svc.artifactService.createArtifact(
      {
        spaceId: space.id,
        runId,
        agentId: agentId1,
        filename: "a.md",
        mimeType: "text/markdown",
        content: "c",
      },
      svc.storage,
    );
    svc.accessService.grantAccess({
      spaceId: space.id,
      agentId: agentId2,
      agentName: "Strategy Agent",
      permission: "read",
      granterAgentId: agentId1,
    });

    const { nodes, edges } = svc.graphService.buildGraph(space.id);
    expect(nodes.length).toBeGreaterThanOrEqual(4); // space + agent + run + memory + artifact + grant
    expect(edges.length).toBeGreaterThanOrEqual(3);
  });
});

describe("Audit Service", () => {
  it("generates audit report with warnings", async () => {
    const svc = setupServices();
    const space = svc.memoryService.createMemorySpace({
      name: "audit-test",
      description: "",
      owner: "owner",
      tags: [],
    });

    const report = svc.auditService.generateAuditReport(space);
    expect(report.space.name).toBe("audit-test");
    expect(report.warnings).toBeDefined();
    expect(report.proofReceipts).toBeDefined();
  });

  it("exports markdown", async () => {
    const svc = setupServices();
    const space = svc.memoryService.createMemorySpace({
      name: "md-test",
      description: "desc",
      owner: "owner",
      tags: [],
    });
    const report = svc.auditService.generateAuditReport(space);
    const md = svc.auditService.exportMarkdown(report);
    expect(md).toContain("md-test");
    expect(md).toContain("Audit Report");
  });
});

describe("Demo Agents", () => {
  it("Research Agent produces at least 5 memories and 2 artifacts", async () => {
    const svc = setupServices();
    const space = svc.memoryService.createMemorySpace({
      name: "demo-space",
      description: "Demo",
      owner: "demo-owner",
      tags: ["demo"],
    });

    const agentId = generateId("agent");
    const recorder = new RunRecorder(svc.runService, svc.index);
    const result = await runResearchAgent(
      space.id,
      agentId,
      recorder,
      svc.memoryService,
      svc.artifactService,
      svc.storage,
    );

    expect(result.runId).toBeTruthy();
    expect(result.memories.length).toBeGreaterThanOrEqual(5);
    expect(result.artifacts.length).toBeGreaterThanOrEqual(2);

    // Check the run has events
    const run = svc.runService.getRun(result.runId!);
    expect(run).toBeTruthy();
    expect(run!.events.length).toBeGreaterThanOrEqual(8);
    expect(run!.status).toBe("completed");
  });

  it("Strategy Agent recalls Research Agent memories", async () => {
    const svc = setupServices();
    const space = svc.memoryService.createMemorySpace({
      name: "demo-space-2",
      description: "Demo",
      owner: "demo-owner",
      tags: ["demo"],
    });

    const researchAgentId = generateId("agent");
    const strategyAgentId = generateId("agent");

    // Run research first
    const researchRecorder = new RunRecorder(svc.runService, svc.index);
    const researchResult = await runResearchAgent(
      space.id,
      researchAgentId,
      researchRecorder,
      svc.memoryService,
      svc.artifactService,
      svc.storage,
    );

    // Run strategy with recall
    const strategyRecorder = new RunRecorder(svc.runService, svc.index);
    const strategyResult = await runStrategyAgent(
      space.id,
      strategyAgentId,
      strategyRecorder,
      svc.memoryService,
      svc.artifactService,
      svc.storage,
    );

    expect(strategyResult.runId).toBeTruthy();
    expect(strategyResult.memories.length).toBeGreaterThanOrEqual(1);
    expect(strategyResult.artifacts.length).toBeGreaterThanOrEqual(1);

    // Check the strategy agent's recall event exists
    const strategyRun = svc.runService.getRun(strategyResult.runId!)!;
    const recallEvents = strategyRun.events.filter((e) => e.kind === "recall");
    expect(recallEvents.length).toBeGreaterThanOrEqual(1);
  });
});

describe("ID and Helpers", () => {
  it("generates unique IDs", () => {
    const id1 = generateId("test");
    const id2 = generateId("test");
    expect(id1).not.toBe(id2);
    expect(id1).toContain("test_");
  });

  it("shortens IDs", () => {
    expect(shortId("abcdef1234567890")).toContain("...");
  });
});
