// MemWal Studio - First Run Wizard
// Auto-creates a Demo Space on first visit with pre-populated agent data

import { X, Info, Play } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useStudio } from "../lib/studioContext";

export function FirstRunWizard() {
  const studio = useStudio();
  const { index, activeSpace, loading, createSpace, runResearchAgentDemo } = studio;
  const [showBanner, setShowBanner] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    // Only run once on mount
    if (initialized.current) return;
    initialized.current = true;

    const spaces = index.getSpaces();
    if (spaces.length === 0) {
      // First visit - auto-create demo space
      try {
        createSpace(
          "Demo Space",
          "Pre-populated demo space showcasing MemWal Studio capabilities. Connect MemWal credentials for real persistence.",
          "demo-owner",
          ["demo", "research", "first-run"],
        );
      } catch {
        // Space might already exist, show banner anyway
      }
      setShowBanner(true);
    }
  }, []);

  // Run demo agent after space is created
  useEffect(() => {
    if (showBanner && activeSpace && activeSpace.name === "Demo Space") {
      const runDemo = async () => {
        try {
          await runResearchAgentDemo();
        } catch {
          // errors shown via context
        }
      };
      // Small delay to let the space creation settle
      const timer = setTimeout(runDemo, 300);
      return () => clearTimeout(timer);
    }
  }, [showBanner, activeSpace]);

  if (!showBanner) return null;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #effbf8 0%, #e0f5f0 100%)",
        border: "1px solid #55d6be",
        borderRadius: 8,
        padding: "12px 16px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontSize: 13,
      }}
    >
      <Info size={18} style={{ color: "#08715f", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <strong style={{ color: "#08715f" }}>Demo mode active</strong>
        <span style={{ color: "#4a7c6f", marginLeft: 8 }}>
          — connect MemWal credentials in Settings for real persistence. A Demo
          Space has been created and populated with Research Agent data.
        </span>
      </div>
      {loading && (
        <span style={{ fontSize: 12, color: "#637381", display: "flex", alignItems: "center", gap: 4 }}>
          <Play size={12} />
          Running demo...
        </span>
      )}
      <button
        onClick={() => setShowBanner(false)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          borderRadius: 6,
          border: "1px solid #d8e0e6",
          background: "rgba(255,255,255,0.7)",
          color: "#637381",
          cursor: "pointer",
          flexShrink: 0,
        }}
        title="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
