// MemWal Studio - Graph Service
// Builds graph nodes and edges for visualization of a memory space

import type {
  GraphNode,
  GraphEdge,
  MemorySpace,
  AgentProfile,
  AgentRun,
  MemoryItem,
  Artifact,
  AccessGrant,
} from "../domain/types";
import type { LocalIndex } from "../index/localIndex";

export interface GraphServiceDeps {
  index: LocalIndex;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function createGraphService(deps: GraphServiceDeps) {
  const { index } = deps;

  function buildGraph(spaceId: string): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // --- Space node ---
    const space = index.getSpace(spaceId);
    if (space) {
      nodes.push(makeSpaceNode(space));
    }

    // --- Agents ---
    const agents = index.getAgents();
    const agentIdsInSpace = new Set<string>();
    for (const agent of agents) {
      // Include all agents for now; later we could scope by space membership
      nodes.push(makeAgentNode(agent));
      agentIdsInSpace.add(agent.id);
    }

    // --- Runs ---
    const runs = index.getRuns(spaceId);
    const runIdsInSpace = new Set<string>();
    for (const run of runs) {
      nodes.push(makeRunNode(run));
      runIdsInSpace.add(run.id);

      // Edge: run -> space (created_by)
      edges.push({
        id: `edge_run_space_${run.id}`,
        source: run.id,
        target: spaceId,
        type: "created_by",
        label: "runs in",
      });

      // Edge: run -> agent (created_by)
      edges.push({
        id: `edge_run_agent_${run.id}`,
        source: run.id,
        target: run.agentId,
        type: "created_by",
        label: "executed by",
      });
    }

    // --- Memories ---
    const memories = index.getMemories(spaceId);
    for (const memory of memories) {
      nodes.push(makeMemoryNode(memory));

      // Edge: memory -> run (belongs_to_run)
      if (memory.runId && runIdsInSpace.has(memory.runId)) {
        edges.push({
          id: `edge_mem_run_${memory.id}`,
          source: memory.id,
          target: memory.runId,
          type: "belongs_to_run",
        });
      }

      // Edge: memory -> agent (created_by)
      if (memory.agentId && agentIdsInSpace.has(memory.agentId)) {
        edges.push({
          id: `edge_mem_agent_${memory.id}`,
          source: memory.id,
          target: memory.agentId,
          type: "created_by",
        });
      }

      // Edge: memory -> parent memories (derived_from)
      for (const parentId of memory.parents) {
        edges.push({
          id: `edge_mem_parent_${memory.id}_${parentId}`,
          source: memory.id,
          target: parentId,
          type: "derived_from",
        });
      }

      // Edge: memory -> artifacts (attached_to)
      for (const artId of memory.artifactIds) {
        edges.push({
          id: `edge_mem_art_${memory.id}_${artId}`,
          source: memory.id,
          target: artId,
          type: "attached_to",
        });
      }
    }

    // --- Artifacts ---
    const artifacts = index.getArtifacts(spaceId);
    for (const artifact of artifacts) {
      nodes.push(makeArtifactNode(artifact));

      // Edge: artifact -> run (belongs_to_run)
      if (artifact.runId && runIdsInSpace.has(artifact.runId)) {
        edges.push({
          id: `edge_art_run_${artifact.id}`,
          source: artifact.id,
          target: artifact.runId,
          type: "belongs_to_run",
        });
      }

      // Edge: artifact -> agent (created_by)
      if (artifact.agentId && agentIdsInSpace.has(artifact.agentId)) {
        edges.push({
          id: `edge_art_agent_${artifact.id}`,
          source: artifact.id,
          target: artifact.agentId,
          type: "created_by",
        });
      }

      // Edge: artifact -> derived from memories (derived_from)
      for (const memId of artifact.derivedFromMemoryIds) {
        edges.push({
          id: `edge_art_mem_${artifact.id}_${memId}`,
          source: artifact.id,
          target: memId,
          type: "derived_from",
        });
      }
    }

    // --- Access Grants ---
    const grants = index.getGrants(spaceId);
    for (const grant of grants) {
      nodes.push(makeAccessNode(grant));

      // Edge: grant -> space
      edges.push({
        id: `edge_grant_space_${grant.id}`,
        source: grant.id,
        target: spaceId,
        type: "shared_with",
      });

      // Edge: grant -> agent (shared_with)
      if (agentIdsInSpace.has(grant.agentId)) {
        edges.push({
          id: `edge_grant_agent_${grant.id}`,
          source: grant.id,
          target: grant.agentId,
          type: "shared_with",
          label: grant.permission,
        });
      }

      // Edge: grant -> granter (shared_with)
      if (grant.granterAgentId && agentIdsInSpace.has(grant.granterAgentId)) {
        edges.push({
          id: `edge_grant_granter_${grant.id}`,
          source: grant.id,
          target: grant.granterAgentId,
          type: "shared_with",
          label: "granted by",
        });
      }

      // Revoked edges
      if (grant.status === "revoked") {
        edges.push({
          id: `edge_grant_revoked_${grant.id}`,
          source: grant.id,
          target: grant.agentId,
          type: "revoked_from",
        });
      }
    }

    return { nodes, edges };
  }

  return { buildGraph };
}

// --- Node builders ---

function makeSpaceNode(space: MemorySpace): GraphNode {
  return {
    id: space.id,
    type: "space",
    label: space.name,
    sublabel: space.owner,
    data: {
      description: space.description,
      tags: space.tags,
      storageMode: space.storageMode,
      createdAt: space.createdAt,
    },
  };
}

function makeAgentNode(agent: AgentProfile): GraphNode {
  return {
    id: agent.id,
    type: "agent",
    label: agent.name,
    sublabel: agent.role,
    data: {
      model: agent.model,
      suiAddress: agent.suiAddress,
    },
  };
}

function makeRunNode(run: AgentRun): GraphNode {
  return {
    id: run.id,
    type: "run",
    label: run.agentName,
    sublabel: run.status,
    data: {
      prompt: run.prompt.slice(0, 200),
      status: run.status,
      eventCount: run.events.length,
      memoryCount: run.memoryIds.length,
      artifactCount: run.artifactIds.length,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
    },
  };
}

function makeMemoryNode(memory: MemoryItem): GraphNode {
  return {
    id: memory.id,
    type: "memory",
    label: memory.title,
    sublabel: memory.type,
    data: {
      type: memory.type,
      content: memory.content.slice(0, 200),
      importance: memory.importance,
      visibility: memory.visibility,
      tags: memory.tags,
      hasReceipt: memory.storageReceipt !== null,
    },
  };
}

function makeArtifactNode(artifact: Artifact): GraphNode {
  return {
    id: artifact.id,
    type: "artifact",
    label: artifact.filename,
    sublabel: artifact.mimeType,
    data: {
      mimeType: artifact.mimeType,
      sizeBytes: artifact.sizeBytes,
      hasReceipt: artifact.storageReceipt !== null,
    },
  };
}

function makeAccessNode(grant: AccessGrant): GraphNode {
  return {
    id: grant.id,
    type: "access",
    label: grant.agentName,
    sublabel: grant.permission,
    data: {
      permission: grant.permission,
      status: grant.status,
      granterAgentId: grant.granterAgentId,
      grantedAt: grant.grantedAt,
      expiresAtMs: grant.expiresAtMs,
    },
  };
}

export type GraphService = ReturnType<typeof createGraphService>;
