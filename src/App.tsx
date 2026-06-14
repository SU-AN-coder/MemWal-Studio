import {
  Activity,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Database,
  FileJson,
  Fingerprint,
  GitBranch,
  KeyRound,
  LockKeyhole,
  Network,
  Play,
  Search,
  ShieldCheck,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";

export type StorageMode = "REAL" | "MOCK";
type View = "Dashboard" | "Spaces" | "Runs" | "Memory" | "Artifacts" | "Graph" | "Access" | "Evidence";
type ProofStatus = "passed" | "waiting" | "prototype";

interface ProofRow {
  label: string;
  value: string;
  status: ProofStatus;
}

const navItems: Array<{ label: View; icon: React.ComponentType<{ size?: number }> }> = [
  { label: "Dashboard", icon: Activity },
  { label: "Spaces", icon: Boxes },
  { label: "Runs", icon: Clock3 },
  { label: "Memory", icon: BrainCircuit },
  { label: "Artifacts", icon: FileJson },
  { label: "Graph", icon: GitBranch },
  { label: "Access", icon: LockKeyhole },
  { label: "Evidence", icon: ShieldCheck },
];

const proofRows: ProofRow[] = [
  { label: "MemWal semantic recall", value: "trace_0x8c...19e", status: "waiting" },
  { label: "Walrus aggregator hash", value: "sha256: 9f4a...c21", status: "waiting" },
  { label: "Sui MemorySpace", value: "0xspace...pending", status: "waiting" },
  { label: "Seal approve before revoke", value: "prototype policy", status: "prototype" },
  { label: "Seal denial after revoke", value: "prototype policy", status: "prototype" },
];

const timeline = [
  ["00:00", "Research Agent started run", "run"],
  ["00:12", "Stored market research memory", "memory"],
  ["00:21", "Created report.md artifact", "artifact"],
  ["00:34", "Strategy Agent semantic recall", "recall"],
  ["00:47", "Access revoke requested", "policy"],
];

const memoryRows = [
  ["observation", "Agent memory is fragmented across vendor stores", "Walrus receipt pending"],
  ["tool_result", "Research report artifact generated", "blob proof pending"],
  ["warning", "Shared memory contains strategy-sensitive prompt", "audit item"],
  ["decision", "Use MemWal Studio as DevTools layer, not SDK clone", "semantic anchor"],
];

export function App() {
  const [view, setView] = useState<View>("Dashboard");
  const [mode, setMode] = useState<StorageMode>("REAL");
  const [runCount, setRunCount] = useState(0);

  const proofScore = useMemo(() => getProofScore(mode), [mode]);

  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">MW</div>
          <div>
            <strong>MemWal Studio</strong>
            <span>Memory control room</span>
          </div>
        </div>
        <nav className="navList" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button className={item.label === view ? "navItem active" : "navItem"} key={item.label} onClick={() => setView(item.label)}>
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="spaceSelect">
            <span>Active space</span>
            <strong>overflow-agent-research</strong>
          </div>
          <button className={mode === "REAL" ? "mode real" : "mode mock"} onClick={() => setMode(mode === "REAL" ? "MOCK" : "REAL")}>
            <Database size={16} />
            {mode}
          </button>
          <div className="wallet">
            <Wallet size={16} />
            testnet wallet pending
          </div>
          <button className="primaryAction" onClick={() => setRunCount((value) => value + 1)}>
            <Play size={16} />
            Run demo
          </button>
        </header>

        <section className="titleRow">
          <div>
            <h1>{view}</h1>
            <p>Inspect memory writes, semantic recalls, artifacts, access policy, and proof reports for long-running AI agents.</p>
          </div>
          <div className="scorecard">
            <span>Proof readiness</span>
            <strong>{proofScore}</strong>
          </div>
        </section>

        <section className="grid">
          <Panel title="Memory Space Health" icon={Fingerprint}>
            <Metric label="Storage target" value={mode === "REAL" ? "MemWal / Walrus" : "Mock fallback"} />
            <Metric label="Memory items" value="5 target / 4 seeded" />
            <Metric label="Artifacts" value="2 target / 2 seeded" />
            <Metric label="Latest demo run" value={runCount ? `run_${runCount.toString().padStart(3, "0")}` : "waiting"} />
          </Panel>

          <Panel title="Latest Agent Run Timeline" icon={Clock3}>
            <div className="timeline">
              {timeline.map(([time, text, kind]) => (
                <div className="timelineRow" key={`${time}-${text}`}>
                  <span>{time}</span>
                  <strong>{kind}</strong>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Semantic Recall Trace" icon={Search}>
            <div className="callout">
              <BrainCircuit size={20} />
              <div>
                <strong>Strategy Agent recall</strong>
                <span>Uses MemWal semantic retrieval; keyword filters remain audit-only.</span>
              </div>
            </div>
            <table>
              <tbody>
                {memoryRows.map(([type, title, receipt]) => (
                  <tr key={title}>
                    <td>{type}</td>
                    <td>{title}</td>
                    <td>{receipt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="Storage Proof" icon={Database}>
            {proofRows.slice(0, 3).map((row) => (
              <ProofLine row={row} key={row.label} />
            ))}
            <div className="proofNote">
              <CheckCircle2 size={16} />
              Requires `docs/aggregator-proof.json` before submission.
            </div>
          </Panel>

          <Panel title="Sui + Seal Access Policy" icon={KeyRound}>
            {proofRows.slice(3).map((row) => (
              <ProofLine row={row} key={row.label} />
            ))}
            <div className="policyBox">
              <span>Move policy</span>
              <code>seal_approve(space, grant, requester)</code>
            </div>
          </Panel>

          <Panel title="Artifact Lineage Graph" icon={Network}>
            <div className="graph">
              <span className="node space">space</span>
              <span className="edge" />
              <span className="node agent">research</span>
              <span className="edge" />
              <span className="node memory">memory</span>
              <span className="edge" />
              <span className="node artifact">report</span>
            </div>
            <p className="panelText">Graph links space, agents, runs, memories, artifacts, warnings, and access grants into an auditable replay.</p>
          </Panel>
        </section>

        {mode === "MOCK" && (
          <div className="degraded">
            <TriangleAlert size={18} />
            Mock mode is for local fallback only. This run cannot be used as real Walrus, MemWal, or Seal evidence.
          </div>
        )}
      </section>
    </main>
  );
}

export function getProofScore(mode: StorageMode) {
  return mode === "REAL" ? "2/7 wired" : "mock excluded";
}

function Panel({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ size?: number }>; children: React.ReactNode }) {
  return (
    <article className="panel">
      <div className="panelHeader">
        <Icon size={18} />
        <h2>{title}</h2>
      </div>
      {children}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProofLine({ row }: { row: ProofRow }) {
  return (
    <div className={`proofLine ${row.status}`}>
      <span>{row.label}</span>
      <strong>{row.value}</strong>
    </div>
  );
}
