// MemWal Studio - Artifact Vault
import { FileJson, FileText, Download, Eye, Table2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useStudio } from "../../lib/studioContext";
import { EmptyState } from "../../components/EmptyState";
import { CopyButton } from "../../components/CopyButton";
import { shortId, truncatedHash } from "../../lib/domain/helpers";
import type { Artifact } from "../../lib/domain/types";

export function ArtifactVault() {
  const studio = useStudio();
  const { activeSpace, index, loading, success } = studio;
  const artifacts = useMemo(() => index.getArtifacts(), [index, success]);
  const memories = useMemo(() => index.getMemories(), [index, success]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const filtered = useMemo(() => {
    let result = artifacts;
    if (activeSpace)
      result = result.filter((a) => a.spaceId === activeSpace.id);
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [artifacts, activeSpace]);
  const selected = useMemo(
    () => artifacts.find((a) => a.id === selectedId) ?? null,
    [artifacts, selectedId],
  );

  const handleDownload = (artifact: Artifact) => {
    const blob = new Blob([artifact.content], { type: artifact.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = artifact.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const formatSize = (bytes: number) =>
    bytes < 1024
      ? `${bytes} B`
      : bytes < 1048576
        ? `${(bytes / 1024).toFixed(1)} KB`
        : `${(bytes / 1048576).toFixed(1)} MB`;
  const previewIcon = (mime: string) =>
    mime === "text/markdown" ? (
      <FileText size={14} />
    ) : mime === "application/json" ? (
      <FileJson size={14} />
    ) : mime === "text/csv" ? (
      <Table2 size={14} />
    ) : (
      <FileText size={14} />
    );

  const renderPreview = (art: Artifact) => {
    if (art.mimeType === "application/json") {
      try {
        return (
          <pre style={preStyle}>
            {JSON.stringify(JSON.parse(art.content), null, 2)}
          </pre>
        );
      } catch {
        return <div style={{ fontSize: 13 }}>{art.content}</div>;
      }
    }
    if (art.mimeType === "text/csv") {
      const lines = art.content.split("\n").filter(Boolean);
      const headers = lines[0]?.split(",") ?? [];
      return (
        <div style={{ overflowX: "auto" }}>
          <table style={{ fontSize: 12 }}>
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} style={csvTh}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.slice(1).map((l, ri) => (
                <tr key={ri}>
                  {l.split(",").map((c, ci) => (
                    <td key={ci} style={csvTd}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return (
      <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
        {art.content}
      </div>
    );
  };

  return (
    <>
      <section className="titleRow">
        <div>
          <h1>Artifacts</h1>
          <p>View, preview, and download agent-generated artifacts.</p>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => setViewMode("grid")}
            style={tog(viewMode === "grid")}
          >
            <Table2 size={14} /> Grid
          </button>
          <button
            onClick={() => setViewMode("table")}
            style={tog(viewMode === "table")}
          >
            <FileText size={14} /> Table
          </button>
        </div>
      </section>
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileJson}
          title="No artifacts yet"
          description="Run a demo agent to generate artifacts."
        />
      ) : selected ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
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
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {previewIcon(selected.mimeType)}
                <strong>{selected.filename}</strong>
                <span style={{ fontSize: 12, color: "#637381" }}>
                  {selected.mimeType}
                </span>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                style={{
                  border: 0,
                  background: "none",
                  cursor: "pointer",
                  color: "#637381",
                  fontSize: 12,
                }}
              >
                ← Back
              </button>
            </div>
            <div style={{ borderTop: "1px solid #edf1f4", paddingTop: 12 }}>
              {renderPreview(selected)}
            </div>
          </div>
          <div
            style={{
              background: "#fff",
              border: "1px solid #dfe7ed",
              borderRadius: 8,
              padding: 16,
              position: "sticky",
              top: 16,
            }}
          >
            <h2 style={{ margin: "0 0 12px", fontSize: 15 }}>Details</h2>
            <DR label="Filename" value={selected.filename} />
            <DR label="MIME Type" value={selected.mimeType} />
            <DR label="Size" value={formatSize(selected.sizeBytes)} />
            <DR label="Hash" value={truncatedHash(selected.contentHash)} />
            <CopyButton value={selected.contentHash} label="Hash" />
            <div style={{ marginTop: 8 }} />
            <DR
              label="Blob ID"
              value={
                selected.storageReceipt
                  ? shortId(selected.storageReceipt.blobId)
                  : "—"
              }
            />
            <DR label="ID" value={shortId(selected.id)} />
            <CopyButton value={selected.id} label="ID" />
            <div style={{ marginTop: 8 }} />
            <DR
              label="Created"
              value={new Date(selected.createdAt).toLocaleString()}
            />
            <DR label="Agent" value={shortId(selected.agentId)} />
            <DR label="Run" value={shortId(selected.runId)} />
            {selected.derivedFromMemoryIds.length > 0 && (
              <>
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#637381",
                    textTransform: "uppercase",
                  }}
                >
                  Derived from
                </div>
                {selected.derivedFromMemoryIds.map((id) => {
                  const mem = memories.find((m) => m.id === id);
                  return (
                    <div key={id} style={{ fontSize: 12, padding: "4px 0" }}>
                      {mem ? (
                        <strong>{mem.title}</strong>
                      ) : (
                        <code>{shortId(id)}</code>
                      )}
                    </div>
                  );
                })}
              </>
            )}
            <button
              onClick={() => handleDownload(selected)}
              style={{
                marginTop: 16,
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #55d6be",
                background: "#effbf8",
                color: "#08715f",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <Download size={16} />
              Download {selected.filename}
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {filtered.map((art) => (
            <div
              key={art.id}
              onClick={() => setSelectedId(art.id)}
              style={{
                background: "#fff",
                border: "1px solid #dfe7ed",
                borderRadius: 8,
                padding: 16,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                {previewIcon(art.mimeType)}
                <strong style={{ fontSize: 14 }}>{art.filename}</strong>
              </div>
              <div style={{ fontSize: 12, color: "#637381", marginBottom: 8 }}>
                {art.mimeType} · {formatSize(art.sizeBytes)}
              </div>
              <div style={{ fontSize: 11, color: "#c4cdd5" }}>
                {truncatedHash(art.contentHash)}
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(art);
                  }}
                  style={sbtn}
                >
                  <Download size={12} /> Download
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(art.id);
                  }}
                  style={sbtn}
                >
                  <Eye size={12} /> Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ background: "#fff", borderRadius: 8, overflow: "hidden" }}
          >
            <thead>
              <tr style={{ background: "#f7f9fb" }}>
                <th style={thStyle}>Filename</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Size</th>
                <th style={thStyle}>Hash</th>
                <th style={thStyle}>Created</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((art) => (
                <tr
                  key={art.id}
                  onClick={() => setSelectedId(art.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td style={tdStyle}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      {previewIcon(art.mimeType)}
                      <strong style={{ fontSize: 13 }}>{art.filename}</strong>
                    </div>
                  </td>
                  <td style={tdStyle}>{art.mimeType}</td>
                  <td style={tdStyle}>{formatSize(art.sizeBytes)}</td>
                  <td style={{ ...tdStyle, fontSize: 11 }}>
                    <code>{truncatedHash(art.contentHash)}</code>
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12 }}>
                    {new Date(art.createdAt).toLocaleDateString()}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(art.id);
                        }}
                        style={sbtn}
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(art);
                        }}
                        style={sbtn}
                      >
                        <Download size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function DR({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        fontSize: 12,
        padding: "4px 0",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <span style={{ color: "#637381" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
const preStyle: React.CSSProperties = {
  fontSize: 11,
  background: "#f7f9fb",
  padding: 12,
  borderRadius: 6,
  overflowX: "auto",
  maxHeight: 400,
  overflowY: "auto",
};
const csvTh: React.CSSProperties = {
  padding: "4px 8px",
  borderBottom: "2px solid #edf1f4",
  textAlign: "left",
};
const csvTd: React.CSSProperties = {
  padding: "4px 8px",
  borderTop: "1px solid #edf1f4",
};
const tog = (a: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 12px",
  borderRadius: 6,
  border: a ? "1px solid #55d6be" : "1px solid #d8e0e6",
  background: a ? "#effbf8" : "#fff",
  color: a ? "#08715f" : "#637381",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
});
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
