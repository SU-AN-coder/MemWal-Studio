// MemWal Studio - Access Control
import {
  LockKeyhole,
  ShieldCheck,
  ShieldOff,
  UserPlus,
  Users,
  History,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useStudio } from "../../lib/studioContext";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState } from "../../components/EmptyState";
import { shortId } from "../../lib/domain/helpers";
import type { Permission } from "../../lib/domain/types";

export function AccessControl() {
  const studio = useStudio();
  const { activeSpace, index, loading, success } = studio;
  const agents = useMemo(() => index.getAgents(), [index, success]);
  const grants = useMemo(() => index.getGrants(), [index, success]);
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [grantAgentId, setGrantAgentId] = useState("");
  const [grantPermission, setGrantPermission] = useState<Permission>("read");
  const [grantExpiry, setGrantExpiry] = useState("");
  const [checkAgentId, setCheckAgentId] = useState("");
  const [checkPermission, setCheckPermission] = useState<Permission>("read");
  const [checkResult, setCheckResult] = useState<boolean | null>(null);

  const spaceGrants = useMemo(() => {
    if (!activeSpace) return [];
    return grants.filter((g) => g.spaceId === activeSpace.id);
  }, [grants, activeSpace]);

  const handleGrant = () => {
    if (!activeSpace || !grantAgentId) return;
    const agent = agents.find((a) => a.id === grantAgentId);
    if (!agent) return;
    studio.grantAccess({
      spaceId: activeSpace.id,
      agentId: grantAgentId,
      agentName: agent.name,
      permission: grantPermission,
      granterAgentId: activeSpace.owner,
      expiresAtMs: grantExpiry ? new Date(grantExpiry).getTime() : null,
    });
    setGrantAgentId("");
    setGrantPermission("read");
    setGrantExpiry("");
    setShowGrantForm(false);
  };
  const handleRevoke = (grantId: string) => {
    studio.revokeAccess(grantId);
  };
  const handleCheck = () => {
    if (!activeSpace || !checkAgentId) return;
    const result = index
      .getGrants(activeSpace.id)
      .some(
        (g) =>
          g.agentId === checkAgentId &&
          g.status === "active" &&
          g.permission === checkPermission,
      );
    setCheckResult(result);
  };

  if (!activeSpace)
    return (
      <EmptyState
        icon={LockKeyhole}
        title="No active space"
        description="Select a space to manage access control."
      />
    );

  return (
    <>
      <section className="titleRow">
        <div>
          <h1>Access</h1>
          <p>
            Manage access grants, permissions, revocation, and verify access
            policies for shared agent memory.
          </p>
        </div>
      </section>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
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
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <ShieldCheck size={18} style={{ color: "#14806d" }} />
            <h2 style={{ margin: 0, fontSize: 15 }}>Space Owner</h2>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            {activeSpace.owner}
          </div>
          <div style={{ fontSize: 12, color: "#637381" }}>
            Space: {activeSpace.name}
          </div>
          <div style={{ fontSize: 12, color: "#637381", marginTop: 2 }}>
            ID: <code>{shortId(activeSpace.id)}</code>
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <Users size={18} style={{ color: "#14806d" }} />
            <h2 style={{ margin: 0, fontSize: 15 }}>Agents</h2>
          </div>
          {agents.length === 0 ? (
            <p className="panelText">No agents registered.</p>
          ) : (
            agents.map((a) => (
              <div
                key={a.id}
                style={{
                  fontSize: 13,
                  padding: "6px 0",
                  borderTop: "1px solid #edf1f4",
                }}
              >
                <strong>{a.name}</strong>
                <span style={{ color: "#637381", marginLeft: 8 }}>
                  {a.role}
                </span>
                <div style={{ fontSize: 11, color: "#c4cdd5" }}>
                  {shortId(a.id)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div
        style={{
          marginTop: 14,
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
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LockKeyhole size={18} style={{ color: "#14806d" }} />
            <h2 style={{ margin: 0, fontSize: 15 }}>Access Grants</h2>
          </div>
          <button
            onClick={() => setShowGrantForm(!showGrantForm)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid #55d6be",
              background: "#effbf8",
              color: "#08715f",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <UserPlus size={14} />
            {showGrantForm ? "Cancel" : "Grant Access"}
          </button>
        </div>
        {showGrantForm && (
          <div
            style={{
              padding: 16,
              marginBottom: 14,
              background: "#f7f9fb",
              borderRadius: 8,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "end",
            }}
          >
            <div>
              <label style={lbl}>Agent</label>
              <select
                value={grantAgentId}
                onChange={(e) => setGrantAgentId(e.target.value)}
                style={sel}
              >
                <option value="">Select agent</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Permission</label>
              <select
                value={grantPermission}
                onChange={(e) =>
                  setGrantPermission(e.target.value as Permission)
                }
                style={sel}
              >
                <option value="read">Read</option>
                <option value="write">Write</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Expiry (optional)</label>
              <input
                type="datetime-local"
                value={grantExpiry}
                onChange={(e) => setGrantExpiry(e.target.value)}
                style={{ ...sel, width: 200 }}
              />
            </div>
            <button
              onClick={handleGrant}
              disabled={!grantAgentId}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "1px solid #55d6be",
                background: grantAgentId ? "#55d6be" : "#c4cdd5",
                color: grantAgentId ? "#06201b" : "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: grantAgentId ? "pointer" : "not-allowed",
              }}
            >
              Grant Access
            </button>
          </div>
        )}
        {spaceGrants.length === 0 ? (
          <EmptyState
            icon={LockKeyhole}
            title="No access grants"
            description="Grant agents access to this memory space."
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr style={{ background: "#f7f9fb" }}>
                  <th style={th}>Agent</th>
                  <th style={th}>Permission</th>
                  <th style={th}>Status</th>
                  <th style={th}>Granted</th>
                  <th style={th}>Revoked</th>
                  <th style={th}>Expires</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {spaceGrants.map((g) => (
                  <tr key={g.id}>
                    <td style={td}>
                      <strong style={{ fontSize: 13 }}>{g.agentName}</strong>
                      <div style={{ fontSize: 11, color: "#c4cdd5" }}>
                        {shortId(g.agentId)}
                      </div>
                    </td>
                    <td style={td}>{g.permission}</td>
                    <td style={td}>
                      <StatusBadge variant="grant" value={g.status} />
                    </td>
                    <td style={{ ...td, fontSize: 12 }}>
                      {new Date(g.grantedAt).toLocaleString()}
                    </td>
                    <td style={{ ...td, fontSize: 12 }}>
                      {g.revokedAt
                        ? new Date(g.revokedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td style={{ ...td, fontSize: 12 }}>
                      {g.expiresAtMs
                        ? new Date(g.expiresAtMs).toLocaleDateString()
                        : "—"}
                    </td>
                    <td style={td}>
                      {g.status === "active" && (
                        <button
                          onClick={() => handleRevoke(g.id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "1px solid #fca5a5",
                            background: "#fef2f2",
                            color: "#991b1b",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <ShieldOff size={12} /> Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div
        style={{
          marginTop: 14,
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
          <ShieldCheck size={18} style={{ color: "#14806d" }} />
          <h2 style={{ margin: 0, fontSize: 15 }}>Enforce Access</h2>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "end",
          }}
        >
          <div>
            <label style={lbl}>Agent</label>
            <select
              value={checkAgentId}
              onChange={(e) => setCheckAgentId(e.target.value)}
              style={sel}
            >
              <option value="">Select agent</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Permission</label>
            <select
              value={checkPermission}
              onChange={(e) => setCheckPermission(e.target.value as Permission)}
              style={sel}
            >
              <option value="read">Read</option>
              <option value="write">Write</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            onClick={handleCheck}
            disabled={!checkAgentId}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #55d6be",
              background: "#effbf8",
              color: "#08715f",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Check Access
          </button>
        </div>
        {checkResult !== null && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 8,
              background: checkResult ? "#dcfce7" : "#fee2e2",
              color: checkResult ? "#166534" : "#991b1b",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {checkResult ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
            {checkResult ? "Access Granted" : "Access Denied"}
          </div>
        )}
      </div>
      <div
        style={{
          marginTop: 14,
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
          <History size={18} style={{ color: "#14806d" }} />
          <h2 style={{ margin: 0, fontSize: 15 }}>Access History</h2>
        </div>
        {spaceGrants.length === 0 ? (
          <p className="panelText">No access history recorded.</p>
        ) : (
          <div className="timeline">
            {spaceGrants
              .sort((a, b) => b.grantedAt.localeCompare(a.grantedAt))
              .map((g) => (
                <div
                  key={g.id}
                  style={{
                    padding: "8px 0",
                    borderTop: "1px solid #edf1f4",
                    fontSize: 12,
                  }}
                >
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <StatusBadge variant="grant" value={g.status} />
                    <strong>{g.agentName}</strong>
                    <span style={{ color: "#637381" }}>
                      received {g.permission}
                    </span>
                    <span style={{ color: "#c4cdd5", marginLeft: "auto" }}>
                      {new Date(g.grantedAt).toLocaleString()}
                    </span>
                  </div>
                  {g.revokedAt && (
                    <div style={{ color: "#991b1b", marginTop: 2 }}>
                      Revoked at {new Date(g.revokedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  );
}

const lbl: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#637381",
  marginBottom: 4,
};
const sel: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #d8e0e6",
  fontSize: 12,
  fontFamily: "inherit",
  cursor: "pointer",
};
const th: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  fontSize: 12,
  color: "#637381",
  fontWeight: 600,
  borderBottom: "1px solid #edf1f4",
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "10px 12px",
  borderTop: "1px solid #edf1f4",
  fontSize: 13,
  verticalAlign: "top",
};
