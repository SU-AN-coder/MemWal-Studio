// MemWal Studio - Spaces View
// Memory space management: list, create, select

import { Boxes, Plus, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useStudio } from "../../lib/studioContext";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState } from "../../components/EmptyState";
import { CopyButton } from "../../components/CopyButton";
import { shortId } from "../../lib/domain/helpers";

export function SpacesView() {
  const studio = useStudio();
  const { activeSpace, index, createSpace, success } = studio;
  const spaces = useMemo(() => index.getSpaces(), [index, success]);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const handleCreate = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const trimmedOwner = owner.trim() || "default";
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    createSpace(trimmedName, description.trim(), trimmedOwner, tags);
    setName("");
    setDescription("");
    setOwner("");
    setTagsInput("");
    setShowForm(false);
  };

  if (spaces.length === 0 && !showForm) {
    return (
      <>
        <section className="titleRow">
          <div>
            <h1>Spaces</h1>
            <p>Memory spaces organize data by project, team, or domain.</p>
          </div>
        </section>
        <EmptyState
          icon={Boxes}
          title="No spaces yet"
          description="Create your first memory space to store agent memories and artifacts."
          action={{ label: "Create Space", onClick: () => setShowForm(true) }}
        />
        {showForm && (
          <CreateSpaceForm
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            owner={owner}
            setOwner={setOwner}
            tagsInput={tagsInput}
            setTagsInput={setTagsInput}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <section className="titleRow">
        <div>
          <h1>Spaces</h1>
          <p>Memory spaces organize data by project, team, or domain.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #55d6be",
            background: showForm ? "#e8fbf7" : "#effbf8",
            color: "#08715f",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <Plus size={16} />
          {showForm ? "Cancel" : "Create Space"}
        </button>
      </section>
      {showForm && (
        <CreateSpaceForm
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          owner={owner}
          setOwner={setOwner}
          tagsInput={tagsInput}
          setTagsInput={setTagsInput}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{ background: "#fff", borderRadius: 8, overflow: "hidden" }}
        >
          <thead>
            <tr style={{ background: "#f7f9fb" }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Owner</th>
              <th style={thStyle}>Storage</th>
              <th style={thStyle}>Tags</th>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {spaces.map((space) => (
              <tr
                key={space.id}
                style={{
                  background:
                    activeSpace?.id === space.id ? "#f0fbf8" : "transparent",
                  cursor: "pointer",
                }}
              >
                <td style={tdStyle}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {activeSpace?.id === space.id && (
                      <CheckCircle2 size={16} style={{ color: "#08715f" }} />
                    )}
                    <div>
                      <strong style={{ fontSize: 14 }}>{space.name}</strong>
                      <div
                        style={{ fontSize: 12, color: "#637381", marginTop: 2 }}
                      >
                        {space.description.slice(0, 80)}
                        {space.description.length > 80 ? "..." : ""}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={tdStyle}>{space.owner}</td>
                <td style={tdStyle}>
                  <StatusBadge variant="storage" value={space.storageMode} />
                </td>
                <td style={{ ...tdStyle, fontSize: 12 }}>
                  {space.tags.length > 0 ? (
                    space.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          display: "inline-block",
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "#f3f4f6",
                          color: "#637381",
                          marginRight: 4,
                          marginBottom: 2,
                          fontSize: 11,
                        }}
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: "#c4cdd5" }}>—</span>
                  )}
                </td>
                <td style={{ ...tdStyle, fontSize: 12 }}>
                  <code style={{ fontSize: 11 }}>{shortId(space.id)}</code>{" "}
                  <CopyButton value={space.id} label="ID" />
                </td>
                <td style={{ ...tdStyle, fontSize: 12, color: "#637381" }}>
                  {new Date(space.createdAt).toLocaleDateString()}
                </td>
                <td style={tdStyle}>
                  {activeSpace?.id === space.id && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "#08715f",
                        fontWeight: 700,
                      }}
                    >
                      ACTIVE
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CreateSpaceForm({
  name,
  setName,
  description,
  setDescription,
  owner,
  setOwner,
  tagsInput,
  setTagsInput,
  onSubmit,
  onCancel,
}: {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  owner: string;
  setOwner: (v: string) => void;
  tagsInput: string;
  setTagsInput: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #dfe7ed",
        borderRadius: 8,
        padding: 20,
        marginBottom: 16,
        display: "grid",
        gap: 14,
        maxWidth: 540,
      }}
    >
      <div>
        <label style={lblStyle}>Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. overflow-agent-research"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={lblStyle}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this space for?"
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={lblStyle}>Owner</label>
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="default"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={lblStyle}>Tags (comma-separated)</label>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="research, demo"
            style={inputStyle}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={cancelBtnStyle}>
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={!name.trim()}
          style={{
            ...cancelBtnStyle,
            background: name.trim() ? "#55d6be" : "#c4cdd5",
            color: name.trim() ? "#06201b" : "#fff",
            border: name.trim() ? "1px solid #55d6be" : "1px solid #c4cdd5",
            cursor: name.trim() ? "pointer" : "not-allowed",
          }}
        >
          Create Space
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #d8e0e6",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};
const lblStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#637381",
  marginBottom: 4,
};
const cancelBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 6,
  border: "1px solid #d8e0e6",
  background: "#fff",
  color: "#637381",
  fontSize: 13,
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
};
const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderTop: "1px solid #edf1f4",
  fontSize: 13,
  verticalAlign: "middle",
};
