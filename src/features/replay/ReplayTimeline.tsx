// MemWal Studio - Replay Timeline
import {
  Clock3,
  MessageSquare,
  ListTodo,
  Wrench,
  CheckCircle2,
  BrainCircuit,
  FileJson,
  Lightbulb,
  Search,
  FileText,
  TriangleAlert,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useStudio } from "../../lib/studioContext";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState } from "../../components/EmptyState";
import { shortId } from "../../lib/domain/helpers";
import type { AgentRun, RunEvent, RunEventKind } from "../../lib/domain/types";

const EVENT_ICONS: Record<
  RunEventKind,
  React.ComponentType<{ size?: number }>
> = {
  prompt: MessageSquare,
  plan: ListTodo,
  tool_call: Wrench,
  tool_result: CheckCircle2,
  memory_write: BrainCircuit,
  artifact_create: FileJson,
  decision: Lightbulb,
  recall: Search,
  output: FileText,
  warning: TriangleAlert,
  error: AlertCircle,
};
const EVENT_COLORS: Record<RunEventKind, string> = {
  prompt: "#6366f1",
  plan: "#f59e0b",
  tool_call: "#8b5cf6",
  tool_result: "#10b981",
  memory_write: "#ec4899",
  artifact_create: "#3b82f6",
  decision: "#eab308",
  recall: "#06b6d4",
  output: "#6b7280",
  warning: "#f97316",
  error: "#ef4444",
};

export function ReplayTimeline() {
  const studio = useStudio();
  const { activeSpace, index, loading, success } = studio;
  const runs = useMemo(() => index.getRuns(), [index, success]);
  const memories = useMemo(() => index.getMemories(), [index, success]);
  const artifacts = useMemo(() => index.getArtifacts(), [index, success]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(-1);

  const completedRuns = useMemo(() => {
    let result = runs;
    if (activeSpace)
      result = result.filter((r) => r.spaceId === activeSpace.id);
    return result
      .filter((r) => r.status === "completed")
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }, [runs, activeSpace]);
  const selectedRun = useMemo(
    () => runs.find((r) => r.id === selectedRunId) ?? null,
    [runs, selectedRunId],
  );
  // Auto-select
  if (!selectedRunId && completedRuns.length > 0) {
    setTimeout(() => setSelectedRunId(completedRuns[0].id), 0);
  }

  const duration = useMemo(() => {
    if (!selectedRun?.startedAt || !selectedRun?.finishedAt) return "—";
    const ms =
      new Date(selectedRun.finishedAt).getTime() -
      new Date(selectedRun.startedAt).getTime();
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  }, [selectedRun]);
  const parseEventData = (data: string) => {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  };

  return (
    <>
      <section className="titleRow">
        <div>
          <h1>Runs</h1>
          <p>
            Replay agent runs step-by-step, inspect events, and trace memory
            lineage.
          </p>
        </div>
      </section>
      {completedRuns.length === 0 ? (
        <EmptyState
          icon={Clock3}
          title="No completed runs"
          description="Run a demo agent to generate replayable run data."
        />
      ) : (
        <>
          <div
            style={{
              display: "flex",
              gap: 14,
              marginBottom: 16,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <select
              value={selectedRunId}
              onChange={(e) => {
                setSelectedRunId(e.target.value);
                setCurrentStep(-1);
                setExpandedEventId(null);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #d8e0e6",
                fontSize: 13,
                fontFamily: "inherit",
                minWidth: 280,
                cursor: "pointer",
              }}
            >
              {completedRuns.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.agentName} — {new Date(r.startedAt).toLocaleString()} (
                  {r.events.length} events)
                </option>
              ))}
            </select>
          </div>
          {selectedRun && (
            <>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #dfe7ed",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 14,
                  display: "flex",
                  gap: 20,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={lbl}>Agent</span>
                  <strong
                    style={{ display: "block", fontSize: 14, marginTop: 2 }}
                  >
                    {selectedRun.agentName}
                  </strong>
                </div>
                <div>
                  <span style={lbl}>Status</span>
                  <div style={{ marginTop: 2 }}>
                    <StatusBadge variant="run" value={selectedRun.status} />
                  </div>
                </div>
                <div>
                  <span style={lbl}>Duration</span>
                  <strong
                    style={{ display: "block", fontSize: 14, marginTop: 2 }}
                  >
                    {duration}
                  </strong>
                </div>
                <div>
                  <span style={lbl}>Memories</span>
                  <strong
                    style={{ display: "block", fontSize: 14, marginTop: 2 }}
                  >
                    {selectedRun.memoryIds.length}
                  </strong>
                </div>
                <div>
                  <span style={lbl}>Artifacts</span>
                  <strong
                    style={{ display: "block", fontSize: 14, marginTop: 2 }}
                  >
                    {selectedRun.artifactIds.length}
                  </strong>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <span style={lbl}>Prompt</span>
                  <div style={{ fontSize: 13, color: "#25313c", marginTop: 2 }}>
                    {selectedRun.prompt}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <button
                  onClick={() => {
                    setCurrentStep(Math.max(currentStep - 1, -1));
                    setExpandedEventId(null);
                  }}
                  disabled={currentStep < 0}
                  style={nbtn}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span style={{ fontSize: 12, color: "#637381" }}>
                  Step {currentStep + 1} / {selectedRun.events.length}
                </span>
                <button
                  onClick={() => {
                    if (selectedRun) {
                      const next = Math.min(
                        currentStep + 1,
                        selectedRun.events.length - 1,
                      );
                      setCurrentStep(next);
                      if (selectedRun.events[next])
                        setExpandedEventId(selectedRun.events[next].id);
                    }
                  }}
                  disabled={currentStep >= selectedRun.events.length - 1}
                  style={nbtn}
                >
                  Next <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => {
                    setCurrentStep(-1);
                    setExpandedEventId(null);
                  }}
                  style={{ ...nbtn, marginLeft: "auto" }}
                >
                  Reset
                </button>
              </div>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #dfe7ed",
                  borderRadius: 8,
                  padding: "16px 0",
                  overflowX: "auto",
                }}
              >
                {selectedRun.events.map((evt, i) => {
                  const Icon = EVENT_ICONS[evt.kind];
                  const color = EVENT_COLORS[evt.kind];
                  const isPast = currentStep >= i;
                  const isExpanded = expandedEventId === evt.id;
                  const evtData = parseEventData(evt.data);
                  return (
                    <div key={evt.id}>
                      <div
                        onClick={() =>
                          setExpandedEventId(isExpanded ? null : evt.id)
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 16px",
                          cursor: "pointer",
                          background: isExpanded ? "#f7f9fb" : "transparent",
                          opacity: isPast ? 1 : 0.5,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            display: "grid",
                            placeItems: "center",
                            background: `${color}18`,
                            color,
                          }}
                        >
                          <Icon size={16} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {evt.kind.replace(/_/g, " ")}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#637381",
                              marginTop: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {typeof evtData === "string"
                              ? evtData
                              : (evtData?.text ??
                                evtData?.title ??
                                evtData?.message ??
                                evtData?.tool ??
                                evtData?.filename ??
                                JSON.stringify(evtData).slice(0, 80))}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#c4cdd5",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {evt.timestamp.slice(11, 19)}
                        </div>
                        {isExpanded ? (
                          <ChevronUp size={14} style={{ color: "#c4cdd5" }} />
                        ) : (
                          <ChevronDown size={14} style={{ color: "#c4cdd5" }} />
                        )}
                      </div>
                      {isExpanded && (
                        <div
                          style={{
                            marginLeft: 60,
                            marginRight: 16,
                            marginBottom: 8,
                            padding: 12,
                            background: "#f7f9fb",
                            borderRadius: 8,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#637381",
                              textTransform: "uppercase",
                              marginBottom: 8,
                            }}
                          >
                            Event Payload
                          </div>
                          <pre
                            style={{
                              fontSize: 11,
                              margin: 0,
                              whiteSpace: "pre-wrap",
                              overflowWrap: "break-word",
                              maxHeight: 300,
                              overflowY: "auto",
                            }}
                          >
                            {JSON.stringify(evtData, null, 2)}
                          </pre>
                          {evt.linkedMemoryIds.length > 0 && (
                            <div style={{ marginTop: 8, fontSize: 12 }}>
                              <span
                                style={{ color: "#637381", fontWeight: 600 }}
                              >
                                Linked Memories:{" "}
                              </span>
                              {evt.linkedMemoryIds.map((id) => {
                                const mem = memories.find((m) => m.id === id);
                                return (
                                  <span key={id} style={{ marginRight: 8 }}>
                                    {mem ? mem.title : shortId(id)}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          {evt.linkedArtifactIds.length > 0 && (
                            <div style={{ marginTop: 4, fontSize: 12 }}>
                              <span
                                style={{ color: "#637381", fontWeight: 600 }}
                              >
                                Linked Artifacts:{" "}
                              </span>
                              {evt.linkedArtifactIds.map((id) => {
                                const art = artifacts.find((a) => a.id === id);
                                return (
                                  <span key={id} style={{ marginRight: 8 }}>
                                    {art ? art.filename : shortId(id)}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          <div style={{ marginTop: 8 }}>
                            <button
                              onClick={() => {
                                setCurrentStep(i);
                                setExpandedEventId(evt.id);
                              }}
                              style={{
                                ...sbtn,
                                background: "#effbf8",
                                border: "1px solid #55d6be",
                                color: "#08715f",
                              }}
                            >
                              <Play size={12} /> Replay to here
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  marginTop: 14,
                  background: "#fff",
                  border: "1px solid #dfe7ed",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <h2 style={{ margin: "0 0 10px", fontSize: 15 }}>
                  Run Summary
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: 10,
                  }}
                >
                  {Object.entries(
                    selectedRun.events.reduce<Record<string, number>>(
                      (acc, evt) => {
                        acc[evt.kind] = (acc[evt.kind] ?? 0) + 1;
                        return acc;
                      },
                      {},
                    ),
                  ).map(([kind, count]) => {
                    const Icon = EVENT_ICONS[kind as RunEventKind];
                    const color = EVENT_COLORS[kind as RunEventKind];
                    return (
                      <div
                        key={kind}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            display: "grid",
                            placeItems: "center",
                            background: `${color}18`,
                            color,
                          }}
                        >
                          <Icon size={13} />
                        </div>
                        <span style={{ textTransform: "capitalize" }}>
                          {kind.replace(/_/g, " ")}
                        </span>
                        <strong style={{ marginLeft: "auto" }}>{count}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

const lbl: React.CSSProperties = {
  fontSize: 11,
  color: "#637381",
  textTransform: "uppercase",
  fontWeight: 600,
};
const nbtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid #d8e0e6",
  background: "#fff",
  color: "#637381",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};
const sbtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid #d8e0e6",
  background: "#fff",
  color: "#637381",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
};
