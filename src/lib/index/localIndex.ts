// MemWal Studio - Local Index
// Fast in-memory cache for UI queries, backed by localStorage for persistence
// This is a cache, not a trust root. Walrus/MemWal is the source of truth.

import type {
  MemorySpace,
  AgentProfile,
  MemoryItem,
  Artifact,
  AgentRun,
  AccessGrant,
} from "../domain/types";

interface IndexState {
  spaces: MemorySpace[];
  agents: AgentProfile[];
  memories: MemoryItem[];
  artifacts: Artifact[];
  runs: AgentRun[];
  grants: AccessGrant[];
  activeSpaceId: string | null;
  storageMode: "WALRUS" | "MEMWAL";
}

const STORAGE_KEY = "memwal_studio_index";

export class LocalIndex {
  private state: IndexState;

  constructor() {
    this.state = this.load();
  }

  private load(): IndexState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<IndexState>;
        return {
          spaces: parsed.spaces ?? [],
          agents: parsed.agents ?? [],
          memories: parsed.memories ?? [],
          artifacts: parsed.artifacts ?? [],
          runs: parsed.runs ?? [],
          grants: parsed.grants ?? [],
          activeSpaceId: parsed.activeSpaceId ?? null,
          storageMode:
            parsed.storageMode === "WALRUS" || parsed.storageMode === "MEMWAL"
              ? parsed.storageMode
              : "MEMWAL",
        };
      }
    } catch {
      // Corrupted or missing, start fresh
    }
    return {
      spaces: [],
      agents: [],
      memories: [],
      artifacts: [],
      runs: [],
      grants: [],
      activeSpaceId: null,
      storageMode: "MEMWAL",
    };
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // localStorage full or unavailable
    }
  }

  // === Spaces ===
  getSpaces(): MemorySpace[] { return this.state.spaces; }
  getSpace(id: string): MemorySpace | undefined {
    return this.state.spaces.find((s) => s.id === id);
  }
  getActiveSpace(): MemorySpace | undefined {
    return this.state.activeSpaceId ? this.getSpace(this.state.activeSpaceId) : undefined;
  }
  getActiveSpaceId(): string | null { return this.state.activeSpaceId; }
  setActiveSpace(id: string | null): void {
    this.state.activeSpaceId = id;
    this.save();
  }
  addSpace(space: MemorySpace): void {
    this.state.spaces.push(space);
    this.save();
  }
  updateSpace(id: string, updates: Partial<MemorySpace>): void {
    const idx = this.state.spaces.findIndex((s) => s.id === id);
    if (idx >= 0) {
      this.state.spaces[idx] = { ...this.state.spaces[idx], ...updates };
      this.save();
    }
  }

  // === Agents ===
  getAgents(): AgentProfile[] { return this.state.agents; }
  getAgent(id: string): AgentProfile | undefined {
    return this.state.agents.find((a) => a.id === id);
  }
  addAgent(agent: AgentProfile): void {
    this.state.agents.push(agent);
    this.save();
  }

  // === Memories ===
  getMemories(spaceId?: string): MemoryItem[] {
    if (spaceId) return this.state.memories.filter((m) => m.spaceId === spaceId);
    return this.state.memories;
  }
  getMemory(id: string): MemoryItem | undefined {
    return this.state.memories.find((m) => m.id === id);
  }
  addMemory(memory: MemoryItem): void {
    this.state.memories.push(memory);
    this.save();
  }
  updateMemory(id: string, updates: Partial<MemoryItem>): void {
    const idx = this.state.memories.findIndex((m) => m.id === id);
    if (idx >= 0) {
      this.state.memories[idx] = { ...this.state.memories[idx], ...updates };
      this.save();
    }
  }
  searchMemories(query: string, spaceId?: string): MemoryItem[] {
    const lower = query.toLowerCase();
    return this.state.memories.filter((m) => {
      if (spaceId && m.spaceId !== spaceId) return false;
      return (
        m.title.toLowerCase().includes(lower) ||
        m.content.toLowerCase().includes(lower) ||
        m.tags.some((t) => t.toLowerCase().includes(lower))
      );
    });
  }
  filterMemories(filters: {
    spaceId?: string;
    type?: string;
    agentId?: string;
    runId?: string;
    tags?: string[];
  }): MemoryItem[] {
    return this.state.memories.filter((m) => {
      if (filters.spaceId && m.spaceId !== filters.spaceId) return false;
      if (filters.type && m.type !== filters.type) return false;
      if (filters.agentId && m.agentId !== filters.agentId) return false;
      if (filters.runId && m.runId !== filters.runId) return false;
      if (filters.tags && filters.tags.length > 0) {
        if (!filters.tags.some((t) => m.tags.includes(t))) return false;
      }
      return true;
    });
  }

  // === Artifacts ===
  getArtifacts(spaceId?: string): Artifact[] {
    if (spaceId) return this.state.artifacts.filter((a) => a.spaceId === spaceId);
    return this.state.artifacts;
  }
  getArtifact(id: string): Artifact | undefined {
    return this.state.artifacts.find((a) => a.id === id);
  }
  addArtifact(artifact: Artifact): void {
    this.state.artifacts.push(artifact);
    this.save();
  }

  // === Runs ===
  getRuns(spaceId?: string): AgentRun[] {
    if (spaceId) return this.state.runs.filter((r) => r.spaceId === spaceId);
    return this.state.runs;
  }
  getRun(id: string): AgentRun | undefined {
    return this.state.runs.find((r) => r.id === id);
  }
  addRun(run: AgentRun): void {
    this.state.runs.push(run);
    this.save();
  }
  updateRun(id: string, updates: Partial<AgentRun>): void {
    const idx = this.state.runs.findIndex((r) => r.id === id);
    if (idx >= 0) {
      this.state.runs[idx] = { ...this.state.runs[idx], ...updates };
      this.save();
    }
  }

  // === Access Grants ===
  getGrants(spaceId?: string): AccessGrant[] {
    if (spaceId) return this.state.grants.filter((g) => g.spaceId === spaceId);
    return this.state.grants;
  }
  getGrant(id: string): AccessGrant | undefined {
    return this.state.grants.find((g) => g.id === id);
  }
  addGrant(grant: AccessGrant): void {
    this.state.grants.push(grant);
    this.save();
  }
  updateGrant(id: string, updates: Partial<AccessGrant>): void {
    const idx = this.state.grants.findIndex((g) => g.id === id);
    if (idx >= 0) {
      this.state.grants[idx] = { ...this.state.grants[idx], ...updates };
      this.save();
    }
  }

  // === Storage Mode ===
  getStorageMode(): "WALRUS" | "MEMWAL" {
    return this.state.storageMode;
  }
  setStorageMode(mode: "WALRUS" | "MEMWAL"): void {
    this.state.storageMode = mode;
    this.save();
  }

  // === Full State Operations ===
  clear(): void {
    this.state = {
      spaces: [],
      agents: [],
      memories: [],
      artifacts: [],
      runs: [],
      grants: [],
      activeSpaceId: null,
      storageMode: "MEMWAL",
    };
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  getAllState(): IndexState {
    return JSON.parse(JSON.stringify(this.state)) as IndexState;
  }
}
