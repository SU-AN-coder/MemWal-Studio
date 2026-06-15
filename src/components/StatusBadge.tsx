// MemWal Studio - Status Badge
// Reusable badge for storage mode, memory type, grant status, run status, severity

import type { MemoryType, GrantStatus, RunStatus, StorageMode } from "../lib/domain/types";

type BadgeVariant =
  | "storage"
  | "memory"
  | "grant"
  | "run"
  | "severity";

type SeverityLevel = "low" | "medium" | "high";

interface StatusBadgeProps {
  variant: "storage";
  value: StorageMode;
  label?: string;
}

interface MemoryBadgeProps {
  variant: "memory";
  value: MemoryType;
  label?: string;
}

interface GrantBadgeProps {
  variant: "grant";
  value: GrantStatus;
  label?: string;
}

interface RunBadgeProps {
  variant: "run";
  value: RunStatus;
  label?: string;
}

interface SeverityBadgeProps {
  variant: "severity";
  value: SeverityLevel;
  label?: string;
}

type Props =
  | StatusBadgeProps
  | MemoryBadgeProps
  | GrantBadgeProps
  | RunBadgeProps
  | SeverityBadgeProps;

const STORAGE_COLORS: Record<StorageMode, { bg: string; fg: string; border: string }> = {
  MOCK: { bg: "#fff8e8", fg: "#8a5b08", border: "#ffd794" },
  WALRUS: { bg: "#effbf8", fg: "#08715f", border: "#a9e6d8" },
  MEMWAL: { bg: "#edf7ff", fg: "#1f6592", border: "#b5d8f7" },
};

const MEMORY_COLORS: Record<MemoryType, { bg: string; fg: string }> = {
  observation: { bg: "#e8fbf7", fg: "#08715f" },
  tool_call: { bg: "#f3e8ff", fg: "#6b21a8" },
  tool_result: { bg: "#e8f5ff", fg: "#1e40af" },
  plan: { bg: "#fef3c7", fg: "#92400e" },
  reasoning: { bg: "#fce7f3", fg: "#9d174d" },
  decision: { bg: "#fef9c3", fg: "#854d0e" },
  summary: { bg: "#e0f2fe", fg: "#075985" },
  warning: { bg: "#fff8e8", fg: "#8a5b08" },
  error: { bg: "#fee2e2", fg: "#991b1b" },
};

const GRANT_COLORS: Record<GrantStatus, { bg: string; fg: string }> = {
  active: { bg: "#dcfce7", fg: "#166534" },
  revoked: { bg: "#fee2e2", fg: "#991b1b" },
};

const RUN_COLORS: Record<RunStatus, { bg: string; fg: string }> = {
  running: { bg: "#dbeafe", fg: "#1e40af" },
  completed: { bg: "#dcfce7", fg: "#166534" },
  failed: { bg: "#fee2e2", fg: "#991b1b" },
};

const SEVERITY_COLORS: Record<SeverityLevel, { bg: string; fg: string }> = {
  low: { bg: "#f3f4f6", fg: "#6b7280" },
  medium: { bg: "#fff8e8", fg: "#8a5b08" },
  high: { bg: "#fee2e2", fg: "#991b1b" },
};

const badgeStyles: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "2px 8px",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 700,
  lineHeight: "18px",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  whiteSpace: "nowrap",
};

export function StatusBadge(props: Props) {
  let bg: string;
  let fg: string;
  let border: string | undefined;
  let display: string;

  switch (props.variant) {
    case "storage": {
      const c = STORAGE_COLORS[props.value];
      bg = c.bg; fg = c.fg; border = c.border;
      display = props.label ?? props.value;
      break;
    }
    case "memory": {
      const c = MEMORY_COLORS[props.value];
      bg = c.bg; fg = c.fg;
      display = props.label ?? props.value.replace(/_/g, " ");
      break;
    }
    case "grant": {
      const c = GRANT_COLORS[props.value];
      bg = c.bg; fg = c.fg;
      display = props.label ?? props.value;
      break;
    }
    case "run": {
      const c = RUN_COLORS[props.value];
      bg = c.bg; fg = c.fg;
      display = props.label ?? props.value;
      break;
    }
    case "severity": {
      const c = SEVERITY_COLORS[props.value];
      bg = c.bg; fg = c.fg;
      display = props.label ?? props.value;
      break;
    }
  }

  return (
    <span style={{ ...badgeStyles, backgroundColor: bg, color: fg, border: border ? `1px solid ${border}` : undefined }}>
      {display}
    </span>
  );
}
