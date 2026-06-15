// MemWal Studio - Memory Inspector
// Search, filter, table, detail panel

import { BrainCircuit, Search, Star, Filter, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useStudio } from "../../lib/studioContext";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState } from "../../components/EmptyState";
import { CopyButton } from "../../components/CopyButton";
import { shortId, truncatedHash } from "../../lib/domain/helpers";
import type { MemoryItem, MemoryType } from "../../lib/domain/types";

const ALL_TYPES: MemoryType[] = [
  "observation",
  "tool_call",
  "tool_result",
  "plan",
  "reasoning",
  "decision",
  "summary",
  "warning",
  "error",
];

export function MemoryInspector() {
  const studio = useStudio();
  const { activeSpace, index, loading, success } = studio;
  const agents = useMemo(() => index.getAgents(), [index, success]);
  const runs = useMemo(() => index.getRuns(), [index, success]);
  const memories = useMemo(() => index.getMemories(), [index, success]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [agentFilter, setAgentFilter] = useState<string>("");
  const [runFilter, setRunFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = memories;
    if (activeSpace)
      result = result.filter((m) => m.spaceId === activeSpace.id);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(lower) ||
          m.content.toLowerCase().includes(lower) ||
          m.tags.some((t) => t.toLowerCase().includes(lower)),
      );
    }
    if (typeFilter) result = result.filter((m) => m.type === typeFilter);
    if (agentFilter) result = result.filter((m) => m.agentId === agentFilter);
    if (runFilter) result = result.filter((m) => m.runId === runFilter);
    if (tagFilter) {
      const tags = tagFilter
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (tags.length > 0)
        result = result.filter((m) => tags.some((t) => m.tags.includes(t)));
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [
    memories,
    activeSpace,
    search,
    typeFilter,
    agentFilter,
    runFilter,
    tagFilter,
  ]);

  const selected = useMemo(
    () => memories.find((m) => m.id === selectedId) ?? null,
    [memories, selectedId],
  );

  const renderStars = (importance: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        fill={i < importance ? "#f59e0b" : "none"}
        stroke={i < importance ? "#f59e0b" : "#d8e0e6"}
        style={{ marginRight: 1 }}
      />
    ));

  return (
    <>
      <section className="titleRow">
        <div>
          <h1>Memory</h1>
          <p>
            Search and inspect agent memories with full detail, storage
            receipts, and recall traces.
          </p>
        </div>
      </section>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 14,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 260px", minWidth: 200 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 10,
              top: 10,
              color: "#c4cdd5",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memories..."
            style={{ ...inputStyle, paddingLeft: 32 }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={filterBtnStyle(showFilters)}
        >
          <Filter size={14} />
          Filters {showFilters ? "(on)" : ""}
        </button>
      </div>
      {showFilters && (
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 14,
            flexWrap: "wrap",
          }}
        >
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="">All types</option>
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="">All agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            value={runFilter}
            onChange={(e) => setRunFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="">All runs</option>
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {shortId(r.id)} - {r.agentName}
              </option>
            ))}
          </select>
          <input
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            placeholder="Tags (comma-separated)"
            style={{ ...inputStyle, width: 200 }}
          />
        </div>
      )}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BrainCircuit}
          title="No memories found"
          description={
            memories.length === 0
              ? "Run a demo agent to generate memories."
              : "Try adjusting your search or filters."
          }
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: selected ? "1fr 380px" : "1fr",
            gap: 14,
            alignItems: "start",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                background: "#fff",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <thead>
                <tr style={{ background: "#f7f9fb" }}>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Agent</th>
                  <th style={thStyle}>Importance</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Hash</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((mem) => {
                  const agent = agents.find((a) => a.id === mem.agentId);
                  return (
                    <tr
                      key={mem.id}
                      onClick={() =>
                        setSelectedId(selectedId === mem.id ? null : mem.id)
                      }
                      style={{
                        cursor: "pointer",
                        background:
                          selectedId === mem.id ? "#f0fbf8" : "transparent",
                      }}
                    >
                      <td style={tdStyle}>
                        <StatusBadge variant="memory" value={mem.type} />
                      </td>
                      <td style={tdStyle}>
                        <strong style={{ fontSize: 13 }}>{mem.title}</strong>
                      </td>
                      <td style={tdStyle}>
                        {agent?.name ?? shortId(mem.agentId)}
                      </td>
                      <td style={tdStyle}>{renderStars(mem.importance)}</td>
                      <td
                        style={{ ...tdStyle, fontSize: 12, color: "#637381" }}
                      >
                        {new Date(mem.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ ...tdStyle, fontSize: 11 }}>
                        <code>{truncatedHash(mem.contentHash)}</code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selected && (
            <DetailPanel
              selected={selected}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      )}
    </>
  );
}

function DetailPanel({
  selected,
  onClose,
}: {
  selected: MemoryItem;
  onClose: () => void;
}) {
  const renderStars = (imp: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        fill={i < imp ? "#f59e0b" : "none"}
        stroke={i < imp ? "#f59e0b" : "#d8e0e6"}
        style={{ marginRight: 1 }}
      />
    ));
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #dfe7ed",
        borderRadius: 8,
        padding: 16,
        position: "sticky",
        top: 16,
        maxHeight: "calc(100vh - 120px)",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 15 }}>{selected.title}</h2>
        <button
          onClick={onClose}
          style={{
            border: 0,
            background: "none",
            cursor: "pointer",
            color: "#637381",
          }}
        >
          <X size={16} />
        </button>
      </div>
      <div style={{ marginBottom: 12 }}>
        <StatusBadge variant="memory" value={selected.type} />
        <span style={{ marginLeft: 8, fontSize: 12, color: "#637381" }}>
          Importance: {renderStars(selected.importance)}
        </span>
      </div>
      <Sec label="Content">
        <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          {selected.content}
        </div>
      </Sec>
      <Sec label="Raw JSON">
        <pre
          style={{
            fontSize: 11,
            background: "#f7f9fb",
            padding: 8,
            borderRadius: 6,
            overflowX: "auto",
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {JSON.stringify(selected, null, 2)}
        </pre>
      </Sec>
      <Sec label="Content Hash">
        <code style={{ fontSize: 11 }}>{selected.contentHash}</code>{" "}
        <CopyButton value={selected.contentHash} label="Hash" />
      </Sec>
      {selected.storageReceipt && (
        <Sec label="Storage Receipt">
          <div style={{ fontSize: 12, lineHeight: 1.6 }}>
            <div>
              Blob ID: <code>{shortId(selected.storageReceipt.blobId)}</code>
            </div>
            <div>
              Mode:{" "}
              <StatusBadge
                variant="storage"
                value={selected.storageReceipt.storageMode}
              />
            </div>
            <div>
              Stored:{" "}
              {new Date(selected.storageReceipt.storedAt).toLocaleString()}
            </div>
          </div>
        </Sec>
      )}
      <Sec label="IDs">
        <div style={{ fontSize: 12, display: "grid", gap: 6 }}>
          <div>
            ID: <code>{selected.id}</code> <CopyButton value={selected.id} />
          </div>
          <div>
            Space: <code>{shortId(selected.spaceId)}</code>
          </div>
          <div>
            Run: <code>{shortId(selected.runId)}</code>
          </div>
          <div>
            Agent: <code>{shortId(selected.agentId)}</code>
          </div>
        </div>
      </Sec>
      {selected.parents.length > 0 && (
        <Sec label="Parent IDs">
          {selected.parents.map((p) => (
            <div key={p} style={{ fontSize: 12 }}>
              <code>{shortId(p)}</code> <CopyButton value={p} />
            </div>
          ))}
        </Sec>
      )}
      {selected.artifactIds.length > 0 && (
        <Sec label="Artifact Links">
          {selected.artifactIds.map((a) => (
            <div key={a} style={{ fontSize: 12 }}>
              <code>{shortId(a)}</code> <CopyButton value={a} />
            </div>
          ))}
        </Sec>
      )}
      {selected.recallTraces.length > 0 && (
        <Sec label="Recall Traces">
          {selected.recallTraces.map((rt) => (
            <div
              key={rt.id}
              style={{
                fontSize: 12,
                padding: "6px 0",
                borderTop: "1px solid #edf1f4",
              }}
            >
              <div>
                Via: <strong>{rt.retrievedVia}</strong>
              </div>
              <div>
                Source: <code>{shortId(rt.sourceMemoryId)}</code>
              </div>
              <div>
                Recalled by: <code>{shortId(rt.recalledByAgentId)}</code>
              </div>
              {rt.similarityScore !== null && (
                <div>Score: {(rt.similarityScore * 100).toFixed(1)}%</div>
              )}
            </div>
          ))}
        </Sec>
      )}
      <Sec label="Visibility">
        <span style={{ fontSize: 12 }}>{selected.visibility}</span>
      </Sec>
      <Sec label="Tags">
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {selected.tags.map((t) => (
            <span
              key={t}
              style={{
                padding: "1px 6px",
                borderRadius: 4,
                background: "#f3f4f6",
                fontSize: 11,
                color: "#637381",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </Sec>
    </div>
  );
}

function Sec({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#637381",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #d8e0e6",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
  width: "100%",
};
const selectStyle: React.CSSProperties = {
  ...inputStyle,
  width: "auto",
  minWidth: 140,
  cursor: "pointer",
};
const filterBtnStyle = (active: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #d8e0e6",
  background: active ? "#f0fbf8" : "#fff",
  color: active ? "#08715f" : "#637381",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
});
const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  fontSize: 12,
  color: "#637381",
  fontWeight: 600,
  borderBottom: "1px solid #edf1f4",
  whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderTop: "1px solid #edf1f4",
  fontSize: 13,
  verticalAlign: "middle",
};
