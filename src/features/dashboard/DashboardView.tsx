// MemWal Studio - Dashboard View
// Full dashboard with stats, demo runners, timeline, access summary, storage proof

import {
  Activity,
  Boxes,
  BrainCircuit,
  Clock3,
  Database,
  Fingerprint,
  LockKeyhole,
  Network,
  Play,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useStudio } from "../../lib/studioContext";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState } from "../../components/EmptyState";
import { shortId } from "../../lib/domain/helpers";
import type {
  AgentRun,
  RunEvent,
  MemorySpace,
  MemoryItem,
  Artifact,
  AgentProfile,
  AccessGrant,
  AgentRun as AgentRunType,
} from "../../lib/domain/types";

type ProofStatus = "passed" | "waiting" | "prototype";

interface ProofRow {
  label: string;
  value: string;
  status: ProofStatus;
}

export function DashboardView() {
  const studio = useStudio();
  const { activeSpace, index, storageMode, loading, error, success } = studio;

  // Read all data from index
  const spaces = useMemo(() => index.getSpaces(), [index, success, loading]);
  const memories = useMemo(
    () => index.getMemories(),
    [index, success, loading],
  );
  const artifacts = useMemo(
    () => index.getArtifacts(),
    [index, success, loading],
  );
  const runs = useMemo(() => index.getRuns(), [index, success, loading]);
  const agents = useMemo(() => index.getAgents(), [index, success, loading]);
  const grants = useMemo(() => index.getGrants(), [index, success, loading]);

  const [runCount, setRunCount] = useState(0);

  const handleRunResearch = async () => {
    setRunCount((c) => c + 1);
    try {
      await studio.runResearchAgentDemo();
    } catch {
      /* error shown via context */
    }
  };

  const handleRunStrategy = async () => {
    setRunCount((c) => c + 1);
    try {
      await studio.runStrategyAgentDemo();
    } catch {
      /* error shown via context */
    }
  };

  // Build timeline from latest run events
  const latestRun = useMemo<AgentRunType | null>(() => {
    if (runs.length === 0) return null;
    return [...runs].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  }, [runs]);

  const timelineRows = useMemo(() => {
    if (!latestRun) return [];
    return latestRun.events
      .slice(-8)
      .reverse()
      .map((evt: RunEvent) => ({
        time: evt.timestamp.slice(11, 19),
        kind: evt.kind,
        data: (() => {
          try {
            return JSON.parse(evt.data);
          } catch {
            return evt.data;
          }
        })(),
      }));
  }, [latestRun]);

  const proofRows: ProofRow[] = useMemo(
    () => [
      {
        label: "MemWal semantic recall",
        value: activeSpace ? `space_${shortId(activeSpace.id)}` : "\u2014",
        status: "waiting",
      },
      {
        label: "Walrus aggregator hash",
        value: storageMode === "MOCK" ? "mock excluded" : "sha256: pending",
        status: "waiting",
      },
      {
        label: "Sui MemorySpace",
        value: activeSpace?.suiObjectId
          ? shortId(activeSpace.suiObjectId)
          : "pending",
        status: "waiting",
      },
      {
        label: "Seal approve before revoke",
        value: "prototype policy",
        status: "prototype",
      },
      {
        label: "Seal denial after revoke",
        value: "prototype policy",
        status: "prototype",
      },
    ],
    [activeSpace, storageMode],
  );

  const activeGrantCount = useMemo(
    () => grants.filter((g) => g.status === "active").length,
    [grants],
  );
  const revokedGrantCount = useMemo(
    () => grants.filter((g) => g.status === "revoked").length,
    [grants],
  );

  const proofScore = useMemo(() => {
    return storageMode === "MOCK"
      ? "mock excluded"
      : `${proofRows.filter((r) => r.status === "passed").length}/${proofRows.length} wired`;
  }, [storageMode, proofRows]);

  if (error) {
    return <div style={{ padding: 24, color: "#991b1b" }}>{error}</div>;
  }

  if (!activeSpace) {
    return (
      <EmptyState
        icon={Boxes}
        title="No active space"
        description="Create a memory space from the Spaces view to get started."
      />
    );
  }

  return (
    <>
      <section className="titleRow">
        <div>
          <h1>Dashboard</h1>
          <p>
            Inspect memory writes, semantic recalls, artifacts, access policy,
            and proof reports for long-running AI agents.
          </p>
        </div>
        <div className="scorecard">
          <span>Proof readiness</span>
          <strong>{proofScore}</strong>
        </div>
      </section>

      {success && (
        <div
          style={{
            marginBottom: 14,
            padding: "10px 14px",
            borderRadius: 8,
            background: "#f0fbf8",
            color: "#08715f",
            border: "1px solid #55d6be",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <ShieldCheck size={16} /> {success}
        </div>
      )}

      <section className="grid">
        <article className="panel">
          <div className="panelHeader">
            <Fingerprint size={18} />
            <h2>Memory Space Health</h2>
          </div>
          <div className="metric">
            <span>Active space</span>
            <strong>{activeSpace.name}</strong>
          </div>
          <div className="metric">
            <span>Owner</span>
            <strong>{activeSpace.owner}</strong>
          </div>
          <div className="metric">
            <span>Storage mode</span>
            <strong>
              <StatusBadge variant="storage" value={activeSpace.storageMode} />
            </strong>
          </div>
          <div className="metric">
            <span>Created</span>
            <strong>
              {new Date(activeSpace.createdAt).toLocaleDateString()}
            </strong>
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <Activity size={18} />
            <h2>Quick Stats</h2>
          </div>
          <div className="metric">
            <span>Spaces</span>
            <strong>{spaces.length}</strong>
          </div>
          <div className="metric">
            <span>Memories</span>
            <strong>{memories.length}</strong>
          </div>
          <div className="metric">
            <span>Artifacts</span>
            <strong>{artifacts.length}</strong>
          </div>
          <div className="metric">
            <span>Runs</span>
            <strong>{runs.length}</strong>
          </div>
          <div className="metric">
            <span>Agents</span>
            <strong>{agents.length}</strong>
          </div>
          <div className="metric">
            <span>Access Grants</span>
            <strong>{grants.length}</strong>
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <Play size={18} />
            <h2>Demo Agent Runners</h2>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              margin: "8px 0",
            }}
          >
            <button
              className="primaryAction"
              onClick={handleRunResearch}
              disabled={loading}
              style={{
                marginLeft: 0,
                justifyContent: "center",
                opacity: loading ? 0.6 : 1,
              }}
            >
              <Play size={16} />
              {loading ? "Running..." : "Run Research Agent"}
            </button>
            <button
              className="primaryAction"
              onClick={handleRunStrategy}
              disabled={loading}
              style={{
                marginLeft: 0,
                justifyContent: "center",
                opacity: loading ? 0.6 : 1,
                background: "#eef2ff",
                color: "#4352a3",
                border: "1px solid #c7d2fe",
              }}
            >
              <BrainCircuit size={16} />
              {loading ? "Running..." : "Run Strategy Agent"}
            </button>
          </div>
          {runCount > 0 && (
            <p
              className="panelText"
              style={{ margin: "8px 0 0", fontSize: 12 }}
            >
              Runs initiated: {runCount}
            </p>
          )}
        </article>

        <article className="panel" style={{ gridColumn: "span 6" }}>
          <div className="panelHeader">
            <Clock3 size={18} />
            <h2>Latest Agent Run Timeline</h2>
          </div>
          {latestRun ? (
            <>
              <div
                style={{
                  marginBottom: 10,
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  fontSize: 12,
                  color: "#637381",
                }}
              >
                <span>
                  <strong>{latestRun.agentName}</strong>
                </span>
                <StatusBadge variant="run" value={latestRun.status} />
                <span>{latestRun.memoryIds.length} memories</span>
                <span>{latestRun.artifactIds.length} artifacts</span>
              </div>
              <div className="timeline">
                {timelineRows.map((row, i) => (
                  <div className="timelineRow" key={i}>
                    <span>{row.time}</span>
                    <strong>{row.kind.replace(/_/g, " ")}</strong>
                    <p>
                      {typeof row.data === "string"
                        ? row.data
                        : (row.data?.text ??
                          row.data?.title ??
                          row.data?.message ??
                          row.data?.summary ??
                          "")}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              icon={Clock3}
              title="No runs yet"
              description="Run a demo agent to see the timeline."
            />
          )}
        </article>

        <article className="panel">
          <div className="panelHeader">
            <LockKeyhole size={18} />
            <h2>Access Grants</h2>
          </div>
          <div className="metric">
            <span>Active grants</span>
            <strong>{activeGrantCount}</strong>
          </div>
          <div className="metric">
            <span>Revoked grants</span>
            <strong>{revokedGrantCount}</strong>
          </div>
          {grants.length === 0 && (
            <p className="panelText">No access grants configured yet.</p>
          )}
          {grants
            .filter((g) => g.status === "active")
            .slice(0, 3)
            .map((g) => (
              <div className="metric" key={g.id}>
                <span>{g.agentName}</span>
                <strong>
                  <StatusBadge variant="grant" value={g.status} />{" "}
                  {g.permission}
                </strong>
              </div>
            ))}
        </article>

        <article className="panel">
          <div className="panelHeader">
            <Database size={18} />
            <h2>Storage Proof</h2>
          </div>
          {proofRows.slice(0, 3).map((row) => (
            <div className={`proofLine ${row.status}`} key={row.label}>
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
          ))}
          <div className="proofNote">
            <ShieldCheck size={16} />
            Requires aggregator proof before submission.
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <Network size={18} />
            <h2>Artifact Lineage</h2>
          </div>
          <div className="graph">
            <span className="node space">space</span>
            <span className="edge" />
            <span className="node agent">agent</span>
            <span className="edge" />
            <span className="node memory">memory</span>
            <span className="edge" />
            <span className="node artifact">artifact</span>
          </div>
          <p className="panelText">
            Graph links spaces, agents, runs, memories, artifacts, and access
            grants into an auditable replay.
          </p>
        </article>
      </section>

      {storageMode === "MOCK" && (
        <div className="degraded">
          <TriangleAlert size={18} />
          Mock mode is for local fallback only. This run cannot be used as real
          Walrus, MemWal, or Seal evidence.
        </div>
      )}
    </>
  );
}
