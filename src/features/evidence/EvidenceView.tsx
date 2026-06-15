// MemWal Studio - Evidence View
import {
  ShieldCheck,
  FileText,
  FileJson,
  Download,
  CheckCircle2,
  XCircle,
  Database,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useStudio } from "../../lib/studioContext";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState } from "../../components/EmptyState";
import type { AuditReport, ProofReceipt } from "../../lib/domain/types";

export function EvidenceView() {
  const studio = useStudio();
  const { activeSpace, exportReport, storageMode, loading } = studio;
  const [report, setReport] = useState<AuditReport | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleGenerate = () => {
    try {
      const r = exportReport();
      setReport(r);
      setReportError(null);
    } catch (err) {
      setReportError(
        err instanceof Error ? err.message : "Failed to generate report",
      );
      setReport(null);
    }
  };
  const downloadFile = (
    filename: string,
    content: string,
    mimeType: string,
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const formatDate = (iso: string) => iso.slice(0, 10); // YYYY-MM-DD
  const handleExportMd = () => {
    if (!report) return;
    const spaceName = report.space.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const date = formatDate(report.generatedAt);
    const l: string[] = [];
    l.push(`# MemWal Studio Audit Report`);
    l.push(`**Space:** ${report.space.name}`);
    l.push(`Generated: ${new Date(report.generatedAt).toLocaleString()}`);
    l.push(``);
    l.push(`## Space`);
    l.push(`- **Name:** ${report.space.name}`);
    l.push(`- **Owner:** ${report.space.owner}`);
    l.push(`- **Storage:** ${report.space.storageMode}`);
    l.push(``);
    l.push(`## Summary`);
    l.push(
      `- Agents: ${report.agents.length}, Runs: ${report.runs.length}, Memories: ${report.memoryItems.length}, Artifacts: ${report.artifacts.length}, Grants: ${report.accessGrants.length}`,
    );
    l.push(``);
    l.push(`## Proof Receipts`);
    const verifiedCount = report.proofReceipts.filter((p) => p.verified).length;
    l.push(
      `- **Status:** ${verifiedCount}/${report.proofReceipts.length} proofs verified`,
    );
    for (const pr of report.proofReceipts)
      l.push(`- **${pr.type}:** ${pr.verified ? "✅" : "❌"} ${pr.details}`);
    l.push(``);
    l.push(`## Warnings`);
    if (report.warnings.length === 0) l.push(`None.`);
    else
      for (const w of report.warnings)
        l.push(`- [${w.severity.toUpperCase()}] ${w.category}: ${w.message}`);
    downloadFile(
      `memwal-studio-audit-${spaceName}-${date}.md`,
      l.join("\n"),
      "text/markdown",
    );
  };
  const handleExportJson = () => {
    if (!report) return;
    const spaceName = report.space.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const date = formatDate(report.generatedAt);
    downloadFile(
      `memwal-studio-audit-${spaceName}-${date}.json`,
      JSON.stringify(report, null, 2),
      "application/json",
    );
  };

  const storageProofs: ProofReceipt[] = useMemo(
    () => [
      {
        type: "storage",
        verified: false,
        details: `${storageMode} writes require a live receipt before submission`,
        verifiedAt: null,
      },
      {
        type: "aggregator",
        verified: false,
        details: "Requires Walrus aggregator configuration",
        verifiedAt: null,
      },
      {
        type: "seal-policy",
        verified: false,
        details: "Seal key release proof required",
        verifiedAt: null,
      },
    ],
    [storageMode],
  );

  return (
    <>
      <section className="titleRow">
        <div>
          <h1>Evidence</h1>
          <p>
            Generate audit reports, verify storage proofs, and export evidence
            for compliance.
          </p>
        </div>
      </section>
      {!activeSpace ? (
        <EmptyState
          icon={ShieldCheck}
          title="No active space"
          description="Select a space to generate audit evidence."
        />
      ) : (
        <>
          <div
            style={{
              background: "#fff",
              border: "1px solid #dfe7ed",
              borderRadius: 8,
              padding: 16,
              marginBottom: 14,
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
              <Database size={18} style={{ color: "#14806d" }} />
              <h2 style={{ margin: 0, fontSize: 15 }}>Storage Proof Status</h2>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {storageProofs.map((pr) => (
                <div
                  key={pr.type}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: pr.verified ? "#f0fbf8" : "#fff8e8",
                    border: pr.verified
                      ? "1px solid #55d6be"
                      : "1px solid #ffd794",
                  }}
                >
                  {pr.verified ? (
                    <CheckCircle2 size={18} style={{ color: "#08715f" }} />
                  ) : (
                    <XCircle size={18} style={{ color: "#8a5b08" }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        textTransform: "capitalize",
                      }}
                    >
                      {pr.type.replace("-", " ")}
                    </div>
                    <div style={{ fontSize: 12, color: "#637381" }}>
                      {pr.details}
                    </div>
                  </div>
                  <StatusBadge
                    variant="run"
                    value={pr.verified ? "completed" : "running"}
                    label={pr.verified ? "VERIFIED" : "REQUIRED"}
                  />
                </div>
              ))}
            </div>
          </div>
          {!report ? (
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
                <FileText size={18} style={{ color: "#14806d" }} />
                <h2 style={{ margin: 0, fontSize: 15 }}>Audit Report</h2>
              </div>
              {reportError && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: "#fee2e2",
                    color: "#991b1b",
                    fontSize: 13,
                    marginBottom: 12,
                  }}
                >
                  {reportError}
                </div>
              )}
              <p style={{ fontSize: 13, color: "#637381", marginBottom: 16 }}>
                Generate a comprehensive audit report for the active space.
              </p>
              <button
                onClick={handleGenerate}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "1px solid #55d6be",
                  background: "#effbf8",
                  color: "#08715f",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <ShieldCheck size={16} />
                Generate Audit Report
              </button>
            </div>
          ) : (
            <>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #dfe7ed",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <FileText size={18} style={{ color: "#14806d" }} />
                    <h2 style={{ margin: 0, fontSize: 15 }}>Audit Report</h2>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleExportMd} style={ebtn}>
                      <Download size={14} /> Markdown
                    </button>
                    <button onClick={handleExportJson} style={ebtn}>
                      <FileJson size={14} /> JSON
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 10,
                  }}
                >
                  {[
                    ["Agents", report.agents.length],
                    ["Runs", report.runs.length],
                    ["Memories", report.memoryItems.length],
                    ["Artifacts", report.artifacts.length],
                    ["Grants", report.accessGrants.length],
                    ["Warnings", report.warnings.length],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        background: "#f7f9fb",
                        border: "1px solid #edf1f4",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: "#25313c",
                        }}
                      >
                        {value as number}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#637381", marginTop: 2 }}
                      >
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #dfe7ed",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 14,
                }}
              >
                <h2 style={{ margin: "0 0 12px", fontSize: 15 }}>
                  Proof Receipts
                </h2>
                <div
                  style={{
                    marginBottom: 12,
                    padding: "8px 12px",
                    borderRadius: 6,
                    background: "#f0fbf8",
                    border: "1px solid #55d6be",
                    fontSize: 13,
                    color: "#08715f",
                    fontWeight: 600,
                  }}
                >
                  {report.proofReceipts.filter((p) => p.verified).length} of{" "}
                  {report.proofReceipts.length} proofs verified
                  {report.proofReceipts.filter((p) => !p.verified).length > 0 &&
                    ` — ${report.proofReceipts.filter((p) => !p.verified).length} required`}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {report.proofReceipts.map((pr) => (
                    <div
                      key={pr.type}
                      className={`proofLine ${pr.verified ? "passed" : "waiting"}`}
                      style={{ padding: "10px 0" }}
                    >
                      <span style={{ textTransform: "capitalize" }}>
                        {pr.type.replace("-", " ")}
                      </span>
                      <strong>
                        {pr.verified ? (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <CheckCircle2
                              size={14}
                              style={{ color: "#08715f" }}
                            />{" "}
                            Verified
                          </span>
                        ) : (
                          <span style={{ color: "#8a5b08" }}>Required</span>
                        )}
                      </strong>
                    </div>
                  ))}
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
                <h2 style={{ margin: "0 0 12px", fontSize: 15 }}>Warnings</h2>
                {report.warnings.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#08715f",
                      fontSize: 13,
                    }}
                  >
                    <CheckCircle2 size={16} />
                    No warnings detected.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {report.warnings.map((w, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 8,
                          background:
                            w.severity === "high"
                              ? "#fee2e2"
                              : w.severity === "medium"
                                ? "#fff8e8"
                                : "#f7f9fb",
                          border: `1px solid ${w.severity === "high" ? "#fca5a5" : w.severity === "medium" ? "#ffd794" : "#d8e0e6"}`,
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <StatusBadge variant="severity" value={w.severity} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>
                            {w.category.replace("-", " ")}
                          </div>
                          <div style={{ fontSize: 12, color: "#637381" }}>
                            {w.message}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: "#c4cdd5" }}>
                          {w.relatedIds.length} items
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

const ebtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 14px",
  borderRadius: 6,
  border: "1px solid #d8e0e6",
  background: "#fff",
  color: "#637381",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};
