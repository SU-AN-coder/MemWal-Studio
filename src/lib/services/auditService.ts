// MemWal Studio - Audit Service
// Generates audit reports with safety warnings for a memory space

import type {
  MemorySpace,
  AgentProfile,
  AccessGrant,
  AgentRun,
  MemoryItem,
  Artifact,
  AuditReport,
  AuditWarning,
  ProofReceipt,
} from "../domain/types";
import type { LocalIndex } from "../index/localIndex";
import { isoNow } from "../domain/helpers";

export interface AuditServiceDeps {
  index: LocalIndex;
}

/** Patterns commonly found in prompt injection attempts */
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /you\s+are\s+now\s+(DAN|jailbroken)/i,
  /system\s*(prompt|message):?\s*/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /forget\s+everything/i,
  /act\s+as\s+if/i,
  /pretend\s+you\s+are/i,
  /override\s+(system|safety)/i,
  /bypass\s+(filter|restriction)/i,
];

/** Patterns indicating potentially sensitive content */
const SENSITIVE_PATTERNS = [
  /password\s*[:=]\s*\S+/i,
  /api[_-]?key\s*[:=]\s*\S+/i,
  /secret\s*[:=]\s*\S+/i,
  /token\s*[:=]\s*\S+/i,
  /private\s*key/i,
  /\b\d{13,16}\b/, // potential credit card numbers
];

const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createAuditService(deps: AuditServiceDeps) {
  const { index } = deps;

  function generateAuditReport(space: MemorySpace): AuditReport {
    const now = isoNow();
    const warnings: AuditWarning[] = [];

    // Gather all data for the space
    const agents = index.getAgents();
    const accessGrants = index.getGrants(space.id);
    const runs = index.getRuns(space.id);
    const memoryItems = index.getMemories(space.id);
    const artifacts = index.getArtifacts(space.id);

    // --- Content integrity checks ---
    for (const mem of memoryItems) {
      // Missing storage receipt
      if (!mem.storageReceipt) {
        warnings.push({
          severity: "high",
          category: "integrity",
          message: `Memory "${mem.title}" lacks a storage receipt`,
          relatedIds: [mem.id],
        });
      }

      // Empty content
      if (!mem.content || mem.content.trim().length === 0) {
        warnings.push({
          severity: "medium",
          category: "integrity",
          message: `Memory "${mem.title}" has empty content`,
          relatedIds: [mem.id],
        });
      }

      // Missing content hash (should never happen with our code, but defensive)
      if (!mem.contentHash) {
        warnings.push({
          severity: "high",
          category: "integrity",
          message: `Memory "${mem.title}" is missing its content hash`,
          relatedIds: [mem.id],
        });
      }
    }

    for (const art of artifacts) {
      if (!art.storageReceipt) {
        warnings.push({
          severity: "high",
          category: "integrity",
          message: `Artifact "${art.filename}" lacks a storage receipt`,
          relatedIds: [art.id],
        });
      }
    }

    // --- Access control warnings ---
    const nowMs = Date.now();
    for (const grant of accessGrants) {
      // Expired but still active
      if (
        grant.status === "active" &&
        grant.expiresAtMs !== null &&
        grant.expiresAtMs < nowMs
      ) {
        warnings.push({
          severity: "high",
          category: "access",
          message: `Access grant for "${grant.agentName}" has expired but is still marked active`,
          relatedIds: [grant.id],
        });
      }
    }

    // --- Stale content warnings ---
    for (const mem of memoryItems) {
      const createdMs = new Date(mem.createdAt).getTime();
      if (nowMs - createdMs > STALE_THRESHOLD_MS) {
        warnings.push({
          severity: "low",
          category: "freshness",
          message: `Memory "${mem.title}" is older than 7 days and may be stale`,
          relatedIds: [mem.id],
        });
      }
    }

    // --- Safety warnings ---
    assessSafetyWarnings(memoryItems, artifacts, runs, warnings);

    // --- Proof receipts ---
    const proofReceipts: ProofReceipt[] = [
      {
        type: "storage",
        verified: checkStorageIntegrity(memoryItems, artifacts),
        details: "Content hash integrity check across all memories and artifacts",
        verifiedAt: now,
      },
      {
        type: "aggregator",
        verified: checkAggregatorEvidence(memoryItems, artifacts),
        details: "Walrus aggregator URL present on persisted Walrus receipts",
        verifiedAt: checkAggregatorEvidence(memoryItems, artifacts) ? now : null,
      },
      {
        type: "seal-policy",
        verified: false,
        details: "Seal key release evidence must be verified by the live e2e script",
        verifiedAt: null,
      },
    ];

    return {
      generatedAt: now,
      space,
      agents,
      accessGrants,
      runs,
      memoryItems,
      artifacts,
      warnings,
      proofReceipts,
    };
  }

  function assessSafetyWarnings(
    memories: MemoryItem[],
    _artifacts: Artifact[],
    _runs: AgentRun[],
    warnings: AuditWarning[],
  ): void {
    for (const mem of memories) {
      // Check for prompt injection patterns in content
      for (const pattern of PROMPT_INJECTION_PATTERNS) {
        if (pattern.test(mem.content)) {
          warnings.push({
            severity: "high",
            category: "safety",
            message: `Memory "${mem.title}" may contain prompt injection patterns`,
            relatedIds: [mem.id],
          });
          break; // One warning per memory for injection
        }
      }

      // Check for sensitive content
      for (const pattern of SENSITIVE_PATTERNS) {
        if (pattern.test(mem.content)) {
          warnings.push({
            severity: "high",
            category: "safety",
            message: `Memory "${mem.title}" may contain sensitive data (credentials, keys, etc.)`,
            relatedIds: [mem.id],
          });
          break; // One warning per memory for sensitive content
        }
      }

      // Missing source attribution (no parents, no runId)
      if (mem.parents.length === 0 && !mem.runId) {
        warnings.push({
          severity: "low",
          category: "provenance",
          message: `Memory "${mem.title}" has no source attribution (no parents or runId)`,
          relatedIds: [mem.id],
        });
      }
    }

    // Check artifacts for sensitive content
    for (const art of _artifacts) {
      for (const pattern of SENSITIVE_PATTERNS) {
        if (pattern.test(art.content)) {
          warnings.push({
            severity: "high",
            category: "safety",
            message: `Artifact "${art.filename}" may contain sensitive data`,
            relatedIds: [art.id],
          });
          break;
        }
      }
    }
  }

  function checkStorageIntegrity(
    memories: MemoryItem[],
    artifacts: Artifact[],
  ): boolean {
    // All items must have receipts and content hashes
    for (const mem of memories) {
      if (!mem.storageReceipt || !mem.contentHash) return false;
    }
    for (const art of artifacts) {
      if (!art.storageReceipt || !art.contentHash) return false;
    }
    return true;
  }

  function checkAggregatorEvidence(
    memories: MemoryItem[],
    artifacts: Artifact[],
  ): boolean {
    const receipts = [
      ...memories.map((m) => m.storageReceipt),
      ...artifacts.map((a) => a.storageReceipt),
    ].filter((r): r is NonNullable<typeof r> => r !== null);
    const walrusReceipts = receipts.filter((r) => r.storageMode === "WALRUS");
    return (
      walrusReceipts.length > 0 &&
      walrusReceipts.every((r) => !!r.aggregatorUrl)
    );
  }

  function exportMarkdown(report: AuditReport): string {
    const lines: string[] = [];

    lines.push(`# Audit Report: ${report.space.name}`);
    lines.push("");
    lines.push(`**Generated:** ${report.generatedAt}`);
    lines.push(`**Space ID:** ${report.space.id}`);
    lines.push(`**Owner:** ${report.space.owner}`);
    lines.push(`**Description:** ${report.space.description}`);
    lines.push("");

    // Summary stats
    lines.push("## Summary");
    lines.push("");
    lines.push(`| Category | Count |`);
    lines.push(`|----------|-------|`);
    lines.push(`| Agents | ${report.agents.length} |`);
    lines.push(`| Access Grants | ${report.accessGrants.length} |`);
    lines.push(`| Runs | ${report.runs.length} |`);
    lines.push(`| Memories | ${report.memoryItems.length} |`);
    lines.push(`| Artifacts | ${report.artifacts.length} |`);
    lines.push(`| Warnings | ${report.warnings.length} |`);
    lines.push("");

    // Warnings
    if (report.warnings.length > 0) {
      lines.push("## Warnings");
      lines.push("");

      const bySeverity = {
        high: report.warnings.filter((w) => w.severity === "high"),
        medium: report.warnings.filter((w) => w.severity === "medium"),
        low: report.warnings.filter((w) => w.severity === "low"),
      };

      for (const severity of ["high", "medium", "low"] as const) {
        const ws = bySeverity[severity];
        if (ws.length === 0) continue;
        lines.push(`### ${severity.toUpperCase()} (${ws.length})`);
        lines.push("");
        for (const w of ws) {
          lines.push(`- **[${w.category}]** ${w.message}`);
          if (w.relatedIds.length > 0) {
            lines.push(`  - Related: ${w.relatedIds.join(", ")}`);
          }
        }
        lines.push("");
      }
    }

    // Agents
    if (report.agents.length > 0) {
      lines.push("## Agents");
      lines.push("");
      for (const agent of report.agents) {
        lines.push(`- **${agent.name}** (${agent.role}) - Model: ${agent.model}`);
      }
      lines.push("");
    }

    // Runs
    if (report.runs.length > 0) {
      lines.push("## Runs");
      lines.push("");
      for (const run of report.runs) {
        lines.push(`- **${run.agentName}** - Status: ${run.status} - Events: ${run.events.length}`);
      }
      lines.push("");
    }

    // Memories
    if (report.memoryItems.length > 0) {
      lines.push("## Memories");
      lines.push("");
      for (const mem of report.memoryItems) {
        lines.push(`- **${mem.title}** (${mem.type}) [importance: ${mem.importance}/5]`);
      }
      lines.push("");
    }

    // Artifacts
    if (report.artifacts.length > 0) {
      lines.push("## Artifacts");
      lines.push("");
      for (const art of report.artifacts) {
        lines.push(`- **${art.filename}** (${art.mimeType}, ${art.sizeBytes} bytes)`);
      }
      lines.push("");
    }

    // Proofs
    lines.push("## Proof Receipts");
    lines.push("");
    for (const proof of report.proofReceipts) {
      const icon = proof.verified ? "✓" : "✗";
      lines.push(`- ${icon} **${proof.type}**: ${proof.details}`);
    }
    lines.push("");

    return lines.join("\n");
  }

  function exportJson(report: AuditReport): string {
    return JSON.stringify(report, null, 2);
  }

  return {
    generateAuditReport,
    exportMarkdown,
    exportJson,
  };
}

export type AuditService = ReturnType<typeof createAuditService>;
