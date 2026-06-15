// MemWal Studio - Demo Runner
import {
  Play,
  RotateCcw,
  BrainCircuit,
  Search,
  CheckCircle2,
  Loader2,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useStudio } from "../../lib/studioContext";
import { EmptyState } from "../../components/EmptyState";

interface LogEntry {
  time: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export function DemoRunner() {
  const studio = useStudio();
  const { activeSpace, loading, error } = studio;
  const [log, setLog] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState("");
  const addLog = useCallback(
    (message: string, type: LogEntry["type"] = "info") =>
      setLog((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), message, type },
      ]),
    [],
  );

  const handleRunFullDemo = async () => {
    setLog([]);
    setProgress(0);
    setStep("Initializing...");
    addLog("Starting full demo sequence", "info");
    if (!activeSpace) {
      addLog("No active space! Creating default space...", "warning");
      studio.createSpace(
        "demo-space",
        "Demo memory space for testing",
        "demo-user",
        ["demo"],
      );
      addLog("Default space created", "success");
    }
    setProgress(5);
    setStep("Running Research Agent...");
    addLog("Launching Research Agent", "info");
    try {
      await studio.runResearchAgentDemo();
      addLog("Research Agent completed", "success");
    } catch (err) {
      addLog(
        `Error: ${err instanceof Error ? err.message : "Unknown"}`,
        "error",
      );
      return;
    }
    setProgress(50);
    setStep("Running Strategy Agent...");
    addLog("Launching Strategy Agent", "info");
    try {
      await studio.runStrategyAgentDemo();
      addLog("Strategy Agent completed", "success");
    } catch (err) {
      addLog(
        `Error: ${err instanceof Error ? err.message : "Unknown"}`,
        "error",
      );
      return;
    }
    setProgress(85);
    setStep("Setting up access grants...");
    addLog("Configuring access grants", "info");
    const agents = studio.index.getAgents();
    const sp = studio.activeSpace;
    if (agents.length >= 2 && sp) {
      studio.grantAccess({
        spaceId: sp.id,
        agentId: agents[0].id,
        agentName: agents[0].name,
        permission: "admin",
        granterAgentId: sp.owner,
      });
      studio.grantAccess({
        spaceId: sp.id,
        agentId: agents[1].id,
        agentName: agents[1].name,
        permission: "read",
        granterAgentId: agents[0].id,
      });
      addLog("Access grants configured", "success");
    }
    setProgress(100);
    setStep("Complete");
    addLog("Full demo sequence complete!", "success");
  };
  const handleRunResearch = async () => {
    setLog([]);
    setProgress(0);
    setStep("Running Research Agent...");
    addLog("Starting Research Agent", "info");
    try {
      await studio.runResearchAgentDemo();
      addLog("Research Agent completed", "success");
      setProgress(100);
      setStep("Complete");
    } catch (err) {
      addLog(
        `Failed: ${err instanceof Error ? err.message : "Unknown"}`,
        "error",
      );
    }
  };
  const handleRunStrategy = async () => {
    setStep("Running Strategy Agent...");
    addLog("Starting Strategy Agent", "info");
    try {
      await studio.runStrategyAgentDemo();
      addLog("Strategy Agent completed", "success");
      setProgress(100);
      setStep("Complete");
    } catch (err) {
      addLog(
        `Failed: ${err instanceof Error ? err.message : "Unknown"}`,
        "error",
      );
    }
  };
  const handleReset = () => {
    if (window.confirm("Reset all data?")) {
      studio.resetAll();
      setLog([]);
      setProgress(0);
      setStep("");
      addLog("All data cleared", "warning");
    }
  };

  return (
    <>
      <section className="titleRow">
        <div>
          <h1>Demo</h1>
          <p>Run full demo sequence to see MemWal Studio in action.</p>
        </div>
      </section>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 14,
          alignItems: "start",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #dfe7ed",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Zap size={18} style={{ color: "#14806d" }} />
            <h2 style={{ margin: 0, fontSize: 15 }}>Demo Runner</h2>
          </div>
          {!activeSpace && (
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: "#fff8e8",
                color: "#8a5b08",
                fontSize: 13,
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <TriangleAlert size={16} />
              No active space. A default will be created automatically.
            </div>
          )}
          {step && (
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                <span style={{ color: "#637381" }}>{step}</span>
                <span style={{ color: "#c4cdd5" }}>{progress}%</span>
              </div>
              <div
                style={{
                  height: 6,
                  background: "#edf1f4",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: progress === 100 ? "#55d6be" : "#3b82f6",
                    borderRadius: 3,
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={handleRunFullDemo}
              disabled={loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 20px",
                borderRadius: 8,
                border: "1px solid #55d6be",
                background: loading ? "#c4cdd5" : "#55d6be",
                color: "#06201b",
                fontWeight: 800,
                fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Play size={16} />
              )}
              Run Full Demo
            </button>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <button
                onClick={handleRunResearch}
                disabled={loading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #d8e0e6",
                  background: "#fff",
                  color: "#25313c",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <Search size={14} />
                Research
              </button>
              <button
                onClick={handleRunStrategy}
                disabled={loading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #d8e0e6",
                  background: "#fff",
                  color: "#25313c",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <BrainCircuit size={14} />
                Strategy
              </button>
            </div>
            <button
              onClick={handleReset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #fca5a5",
                background: "#fef2f2",
                color: "#991b1b",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                marginTop: 4,
              }}
            >
              <RotateCcw size={14} />
              Reset All Data
            </button>
          </div>
        </div>
        <div
          style={{
            background: "#fff",
            border: "1px solid #dfe7ed",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <CheckCircle2 size={18} style={{ color: "#14806d" }} />
            <h2 style={{ margin: 0, fontSize: 15 }}>Event Log</h2>
          </div>
          {log.length === 0 ? (
            <EmptyState
              icon={Play}
              title="No events yet"
              description="Run the demo to see the event log."
            />
          ) : (
            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              {log.map((entry, i) => {
                const colors = {
                  info: { bg: "#f7f9fb", fg: "#25313c", border: "#d8e0e6" },
                  success: { bg: "#f0fbf8", fg: "#08715f", border: "#55d6be" },
                  warning: { bg: "#fff8e8", fg: "#8a5b08", border: "#ffd794" },
                  error: { bg: "#fee2e2", fg: "#991b1b", border: "#fca5a5" },
                };
                const c = colors[entry.type];
                return (
                  <div
                    key={i}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      marginBottom: 6,
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      color: c.fg,
                      fontSize: 12,
                      display: "flex",
                      gap: 8,
                      alignItems: "start",
                    }}
                  >
                    <span
                      style={{
                        color: "#c4cdd5",
                        whiteSpace: "nowrap",
                        fontSize: 11,
                      }}
                    >
                      {entry.time}
                    </span>
                    <span>{entry.message}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {error && (
        <div
          style={{
            marginTop: 14,
            padding: "12px 16px",
            borderRadius: 8,
            background: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fca5a5",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <TriangleAlert size={18} />
          {error}
        </div>
      )}
    </>
  );
}
