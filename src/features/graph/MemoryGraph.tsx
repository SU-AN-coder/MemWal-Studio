// MemWal Studio - Interactive Memory Graph
import { GitBranch, Filter, X } from "lucide-react";
import { useMemo, useState, useCallback, type CSSProperties } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { useStudio } from "../../lib/studioContext";
import { EmptyState } from "../../components/EmptyState";
import { shortId } from "../../lib/domain/helpers";
import type { GraphNode, GraphEdge } from "../../lib/domain/types";

// ---------------------------------------------------------------------------
// Color maps
// ---------------------------------------------------------------------------
const NODE_COLORS: Record<GraphNode["type"], string> = {
  space: "#08715f",
  agent: "#4352a3",
  run: "#647482",
  memory: "#8a5b08",
  artifact: "#1f6592",
  access: "#6657a8",
};
const NODE_BG: Record<GraphNode["type"], string> = {
  space: "#e8fbf7",
  agent: "#eef2ff",
  run: "#f5f5f5",
  memory: "#fff6df",
  artifact: "#edf7ff",
  access: "#f3eefc",
};
const EDGE_LABELS: Record<GraphEdge["type"], string> = {
  created_by: "created by",
  belongs_to_run: "in run",
  derived_from: "derived from",
  attached_to: "attached to",
  shared_with: "shared with",
  revoked_from: "revoked from",
};

// ---------------------------------------------------------------------------
// Custom node component for ReactFlow
// ---------------------------------------------------------------------------
function MemoryGraphNode({
  data,
}: {
  data: { label: string; sublabel?: string; nodeType: GraphNode["type"] };
}) {
  const bg = NODE_BG[data.nodeType] || "#fff";
  const border = NODE_COLORS[data.nodeType];
  return (
    <div
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        background: bg,
        border: `2px solid ${border}`,
        minWidth: 110,
        textAlign: "center",
      }}
    >
      <strong style={{ color: border, fontSize: 12, display: "block" }}>
        {data.label}
      </strong>
      {data.sublabel && (
        <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
          {data.sublabel}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { memoryGraphNode: MemoryGraphNode };

// ---------------------------------------------------------------------------
// Dagre auto-layout
// ---------------------------------------------------------------------------
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

function layoutNodesEdges(
  nodes: GraphNode[],
  edges: GraphEdge[],
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    nodesep: 70,
    ranksep: 90,
    marginx: 40,
    marginy: 40,
  });

  for (const n of nodes) {
    g.setNode(n.id, { width: 150, height: 56 });
  }
  for (const e of edges) {
    g.setEdge(e.source, e.target);
  }

  dagre.layout(g);

  const rfNodes: Node[] = nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      id: n.id,
      type: "memoryGraphNode",
      position: { x: pos.x - 75, y: pos.y - 28 },
      data: {
        label: n.label,
        sublabel: n.sublabel ?? "",
        nodeType: n.type,
        fullData: n.data,
        graphNodeType: n.type,
      },
    };
  });

  const rfEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label ?? EDGE_LABELS[e.type] ?? e.type,
    style: { stroke: "#c7d2dc", strokeWidth: 1.5 },
    labelStyle: { fontSize: 10, fill: "#647482" },
    labelBgStyle: { fill: "#fff", fillOpacity: 0.9 },
    type: "smoothstep",
  }));

  return { nodes: rfNodes, edges: rfEdges };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function MemoryGraph() {
  const studio = useStudio();
  const { activeSpace, index, success } = studio;

  const spaces = useMemo(() => index.getSpaces(), [index, success]);
  const agents = useMemo(() => index.getAgents(), [index, success]);
  const runs = useMemo(() => index.getRuns(), [index, success]);
  const memories = useMemo(() => index.getMemories(), [index, success]);
  const artifacts = useMemo(() => index.getArtifacts(), [index, success]);
  const grants = useMemo(() => index.getGrants(), [index, success]);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [filterAgent, setFilterAgent] = useState<string>("");
  const [filterRun, setFilterRun] = useState<string>("");
  const [filterMemType, setFilterMemType] = useState<string>("");
  const [showLegend, setShowLegend] = useState(true);

  // --- Build raw graph data (filtered) ---
  const graph = useMemo(() => {
    const rawNodes: GraphNode[] = [];
    const rawEdges: GraphEdge[] = [];

    // Spaces
    for (const space of spaces) {
      if (activeSpace && space.id !== activeSpace.id) continue;
      rawNodes.push({
        id: space.id,
        type: "space",
        label: space.name,
        sublabel: space.owner,
        data: space as unknown as Record<string, unknown>,
      });
    }

    // Agents
    for (const agent of agents) {
      rawNodes.push({
        id: agent.id,
        type: "agent",
        label: agent.name,
        sublabel: agent.role,
        data: agent as unknown as Record<string, unknown>,
      });
    }

    // Runs (filtered)
    let filteredRuns = runs;
    if (activeSpace)
      filteredRuns = filteredRuns.filter((r) => r.spaceId === activeSpace.id);
    if (filterAgent)
      filteredRuns = filteredRuns.filter((r) => r.agentId === filterAgent);
    if (filterRun)
      filteredRuns = filteredRuns.filter((r) => r.id === filterRun);
    for (const run of filteredRuns) {
      rawNodes.push({
        id: run.id,
        type: "run",
        label: run.agentName,
        sublabel: run.status,
        data: run as unknown as Record<string, unknown>,
      });
      if (rawNodes.some((n) => n.id === run.agentId))
        rawEdges.push({
          id: `${run.id}--${run.agentId}`,
          source: run.id,
          target: run.agentId,
          type: "created_by",
        });
    }

    // Memories (filtered)
    let filteredMemories = memories;
    if (activeSpace)
      filteredMemories = filteredMemories.filter(
        (m) => m.spaceId === activeSpace.id,
      );
    if (filterAgent)
      filteredMemories = filteredMemories.filter(
        (m) => m.agentId === filterAgent,
      );
    if (filterRun)
      filteredMemories = filteredMemories.filter((m) => m.runId === filterRun);
    if (filterMemType)
      filteredMemories = filteredMemories.filter(
        (m) => m.type === filterMemType,
      );
    for (const mem of filteredMemories) {
      rawNodes.push({
        id: mem.id,
        type: "memory",
        label: mem.title,
        sublabel: mem.type,
        data: mem as unknown as Record<string, unknown>,
      });
      if (filteredRuns.some((r) => r.id === mem.runId))
        rawEdges.push({
          id: `${mem.id}--${mem.runId}`,
          source: mem.id,
          target: mem.runId,
          type: "belongs_to_run",
        });
      for (const pid of mem.parents) {
        if (rawNodes.some((n) => n.id === pid))
          rawEdges.push({
            id: `${mem.id}--${pid}`,
            source: mem.id,
            target: pid,
            type: "derived_from",
          });
      }
    }

    // Artifacts (filtered)
    let filteredArtifacts = artifacts;
    if (activeSpace)
      filteredArtifacts = filteredArtifacts.filter(
        (a) => a.spaceId === activeSpace.id,
      );
    if (filterAgent)
      filteredArtifacts = filteredArtifacts.filter(
        (a) => a.agentId === filterAgent,
      );
    if (filterRun)
      filteredArtifacts = filteredArtifacts.filter(
        (a) => a.runId === filterRun,
      );
    for (const art of filteredArtifacts) {
      rawNodes.push({
        id: art.id,
        type: "artifact",
        label: art.filename,
        sublabel: art.mimeType,
        data: art as unknown as Record<string, unknown>,
      });
      if (filteredRuns.some((r) => r.id === art.runId))
        rawEdges.push({
          id: `${art.id}--${art.runId}`,
          source: art.id,
          target: art.runId,
          type: "attached_to",
        });
      for (const mid of art.derivedFromMemoryIds) {
        if (rawNodes.some((n) => n.id === mid))
          rawEdges.push({
            id: `${art.id}--${mid}`,
            source: art.id,
            target: mid,
            type: "derived_from",
          });
      }
    }

    // Access grants
    const fg = activeSpace
      ? grants.filter((g) => g.spaceId === activeSpace.id)
      : grants;
    for (const grant of fg) {
      rawNodes.push({
        id: grant.id,
        type: "access",
        label: grant.agentName,
        sublabel: `${grant.permission} (${grant.status})`,
        data: grant as unknown as Record<string, unknown>,
      });
      if (rawNodes.some((n) => n.id === grant.agentId))
        rawEdges.push({
          id: `${grant.id}--${grant.agentId}`,
          source: grant.id,
          target: grant.agentId,
          type: grant.status === "active" ? "shared_with" : "revoked_from",
        });
    }

    return { rawNodes, rawEdges };
  }, [
    spaces,
    agents,
    runs,
    memories,
    artifacts,
    grants,
    activeSpace,
    filterAgent,
    filterRun,
    filterMemType,
  ]);

  // --- Layout with dagre ---
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => layoutNodesEdges(graph.rawNodes, graph.rawEdges),
    [graph],
  );

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(initialNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when graph data changes
  useMemo(() => {
    setRfNodes(initialNodes);
    setRfEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  // --- Node click handler ---
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  }, []);

  // --- Connected edges for selected node ---
  const connectedEdges = useMemo(() => {
    if (!selectedNode) return [];
    return rfEdges.filter(
      (e) => e.source === selectedNode.id || e.target === selectedNode.id,
    );
  }, [rfEdges, selectedNode]);

  // --- Lookup raw node data for detail panel ---
  const selectedRawNode = useMemo(
    () => graph.rawNodes.find((n) => n.id === selectedNode?.id) ?? null,
    [graph.rawNodes, selectedNode],
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <>
      <section className="titleRow">
        <div>
          <h1>Graph</h1>
          <p>
            Visualize relationships between spaces, agents, runs, memories,
            artifacts, and access grants.
          </p>
        </div>
      </section>

      {/* Filter controls */}
      <div className="graphFilters">
        <select
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
          className="graphSelect"
        >
          <option value="">All agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={filterRun}
          onChange={(e) => setFilterRun(e.target.value)}
          className="graphSelect"
        >
          <option value="">All runs</option>
          {runs.map((r) => (
            <option key={r.id} value={r.id}>
              {shortId(r.id)} - {r.agentName}
            </option>
          ))}
        </select>
        <select
          value={filterMemType}
          onChange={(e) => setFilterMemType(e.target.value)}
          className="graphSelect"
        >
          <option value="">All memory types</option>
          {[
            "observation",
            "tool_call",
            "tool_result",
            "plan",
            "reasoning",
            "decision",
            "summary",
            "warning",
            "error",
          ].map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <button onClick={() => setShowLegend(!showLegend)} className="graphBtn">
          <Filter size={14} /> {showLegend ? "Hide" : "Show"} Legend
        </button>
      </div>

      {graph.rawNodes.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No graph data"
          description="Create spaces and run demo agents to populate the graph."
        />
      ) : (
        <div
          className="graphWorkspace"
          style={{
            gridTemplateColumns: selectedNode ? "1fr 340px" : "1fr",
          }}
        >
          {/* ReactFlow container */}
          <div className="graphCanvas">
            {showLegend && (
              <div className="graphLegend">
                {/* Color legend */}
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 6,
                    fontSize: 11,
                  }}
                >
                  {(Object.keys(NODE_COLORS) as GraphNode["type"][]).map(
                    (t) => (
                      <div
                        key={t}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 3,
                            background: NODE_BG[t],
                            border: `2px solid ${NODE_COLORS[t]}`,
                          }}
                        />
                        <span style={{ color: "#637381" }}>{t}</span>
                      </div>
                    ),
                  )}
                </div>
                {/* Edge legend */}
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    fontSize: 11,
                  }}
                >
                  {(Object.keys(EDGE_LABELS) as GraphEdge["type"][])
                    .slice(0, 4)
                    .map((t) => (
                      <div
                        key={t}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 2,
                            background: "#c7d2dc",
                          }}
                        />
                        <span style={{ color: "#637381" }}>
                          {EDGE_LABELS[t]}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
              style={{ background: "#fafbfc" }}
            >
              <Background color="#e2e8f0" gap={20} />
              <Controls />
              <MiniMap
                nodeColor={(n) =>
                  NODE_BG[
                    (n.data as { nodeType?: string })
                      ?.nodeType as GraphNode["type"]
                  ] ?? "#eee"
                }
                maskColor="rgba(0,0,0,0.08)"
              />
            </ReactFlow>
          </div>

          {/* Detail panel */}
          {selectedNode && selectedRawNode && (
            <div className="graphDetail">
              <div className="graphDetailHeader">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: NODE_BG[selectedRawNode.type],
                      border: `2px solid ${NODE_COLORS[selectedRawNode.type]}`,
                    }}
                  />
                  <strong style={{ fontSize: 14 }}>
                    {selectedRawNode.label}
                  </strong>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="graphCloseBtn"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="graphDetailType">{selectedRawNode.type}</div>
              {selectedRawNode.sublabel && (
                <div className="graphDetailSublabel">
                  {selectedRawNode.sublabel}
                </div>
              )}
              <div className="graphDetailId">
                ID: <code>{shortId(selectedRawNode.id)}</code>
              </div>
              <pre className="graphDetailData">
                {JSON.stringify(selectedRawNode.data, null, 2)}
              </pre>
              {connectedEdges.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div className="graphDetailSectionLabel">Connections</div>
                  {connectedEdges.map((e) => {
                    const oid =
                      e.source === selectedNode.id ? e.target : e.source;
                    const on = graph.rawNodes.find((n) => n.id === oid);
                    return (
                      <div key={e.id} className="graphConnRow">
                        <span
                          style={{
                            color: NODE_COLORS[on?.type ?? "run"],
                          }}
                        >
                          {on?.label ?? shortId(oid)}
                        </span>
                        <span style={{ color: "#c4cdd5" }}>
                          {typeof e.label === "string"
                            ? e.label
                            : (EDGE_LABELS[e.type as GraphEdge["type"]] ??
                              e.type)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
