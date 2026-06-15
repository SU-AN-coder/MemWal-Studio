// MemWal Studio - Empty State
// Reusable empty state with icon, title, description, and optional action button

import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 24px",
      textAlign: "center",
      gap: 12,
      minHeight: 200,
      color: "#637381",
    }}>
      {Icon && <Icon size={40} strokeWidth={1.5} />}
      <strong style={{ fontSize: 15, color: "#25313c" }}>{title}</strong>
      {description && <p style={{ margin: 0, maxWidth: 420, lineHeight: 1.55, fontSize: 13 }}>{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 4,
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #55d6be",
            background: "#effbf8",
            color: "#08715f",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
