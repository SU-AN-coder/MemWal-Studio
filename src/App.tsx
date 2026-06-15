import {
  Activity,
  Boxes,
  BrainCircuit,
  Clock3,
  Database,
  FileJson,
  GitBranch,
  LockKeyhole,
  Play,
  ShieldCheck,
  TriangleAlert,
  Wallet,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useMemo, useState } from "react";
import { StudioProvider, useStudio } from "./lib/studioContext";
import { MemWalStorageAdapter } from "./lib/storage/memwalStorageAdapter";
import { DashboardView } from "./features/dashboard/DashboardView";
import { SpacesView } from "./features/spaces/SpacesView";
import { MemoryInspector } from "./features/memory/MemoryInspector";
import { ArtifactVault } from "./features/artifacts/ArtifactVault";
import { ReplayTimeline } from "./features/replay/ReplayTimeline";
import { MemoryGraph } from "./features/graph/MemoryGraph";
import { AccessControl } from "./features/access/AccessControl";
import { EvidenceView } from "./features/evidence/EvidenceView";
import { DemoRunner } from "./features/demo/DemoRunner";
import { FirstRunWizard } from "./components/FirstRunWizard";

export type StorageMode = "MOCK" | "WALRUS" | "MEMWAL";
type View =
  | "Dashboard"
  | "Spaces"
  | "Runs"
  | "Memory"
  | "Artifacts"
  | "Graph"
  | "Access"
  | "Evidence"
  | "Demo";

const navItems: Array<{
  label: View;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { label: "Dashboard", icon: Activity },
  { label: "Spaces", icon: Boxes },
  { label: "Runs", icon: Clock3 },
  { label: "Memory", icon: BrainCircuit },
  { label: "Artifacts", icon: FileJson },
  { label: "Graph", icon: GitBranch },
  { label: "Access", icon: LockKeyhole },
  { label: "Evidence", icon: ShieldCheck },
  { label: "Demo", icon: Play },
];

function AppShell() {
  const studio = useStudio();
  const {
    activeSpace,
    loading,
    storageMode,
    setStorageMode,
    storage,
    runResearchAgentDemo,
  } = studio;

  const [view, setView] = useState<View>("Dashboard");

  const handleRunDemo = async () => {
    try {
      await runResearchAgentDemo();
    } catch {
      /* error shown in context */
    }
  };

  const handleToggleMode = () => {
    const next: StorageMode =
      storageMode === "MOCK"
        ? "WALRUS"
        : storageMode === "WALRUS"
          ? "MEMWAL"
          : "MOCK";
    setStorageMode(next);
  };

  // Determine MemWal connection status for display
  const memwalLabel = useMemo(() => {
    if (storage instanceof MemWalStorageAdapter) {
      return storage.getAvailabilityLabel();
    }
    return null;
  }, [storage]);

  const isRealMode = storageMode === "WALRUS" || storageMode === "MEMWAL";

  const viewContent = (() => {
    switch (view) {
      case "Dashboard":
        return <DashboardView />;
      case "Spaces":
        return <SpacesView />;
      case "Runs":
        return <ReplayTimeline />;
      case "Memory":
        return <MemoryInspector />;
      case "Artifacts":
        return <ArtifactVault />;
      case "Graph":
        return <MemoryGraph />;
      case "Access":
        return <AccessControl />;
      case "Evidence":
        return <EvidenceView />;
      case "Demo":
        return <DemoRunner />;
    }
  })();

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
              <button
                className={item.label === view ? "navItem active" : "navItem"}
                key={item.label}
                onClick={() => setView(item.label)}
              >
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
            <strong>{activeSpace?.name ?? "No space selected"}</strong>
          </div>

          {/* Storage mode toggle */}
          <button
            className={isRealMode ? "mode real" : "mode mock"}
            onClick={handleToggleMode}
            style={{ cursor: "pointer" }}
            title={`Current: ${storageMode}. Click to cycle MOCK → WALRUS → MEMWAL`}
          >
            <Database size={16} />
            {storageMode}
          </button>

          {/* MemWal connection status */}
          {storageMode === "MEMWAL" && memwalLabel && (
            <div
              className={
                memwalLabel === "MemWal Connected"
                  ? "wallet"
                  : "degraded compact"
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
              }}
            >
              {memwalLabel === "MemWal Connected" ? (
                <Wifi size={14} />
              ) : (
                <WifiOff size={14} />
              )}
              <span style={{ fontSize: "0.8rem" }}>{memwalLabel}</span>
            </div>
          )}

          <div className="wallet">
            <Wallet size={16} />
            testnet wallet pending
          </div>

          <button
            className="primaryAction"
            onClick={handleRunDemo}
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Play size={16} />
            {loading ? "Running..." : "Run demo"}
          </button>
        </header>

        <FirstRunWizard />
        {viewContent}

        {storageMode === "MOCK" && (
          <div className="degraded">
            <TriangleAlert size={18} />
            Mock mode is for local fallback only. This run cannot be used as
            real Walrus, MemWal, or Seal evidence.
          </div>
        )}

        {storageMode === "MEMWAL" &&
          memwalLabel &&
          memwalLabel !== "MemWal Connected" && (
            <div className="degraded">
              <TriangleAlert size={18} />
              MemWal is configured but not connected ({memwalLabel}). Using mock
              fallback. Add credentials in Settings to enable real storage.
            </div>
          )}
      </section>
    </main>
  );
}

export function App() {
  return (
    <StudioProvider>
      <AppShell />
    </StudioProvider>
  );
}
