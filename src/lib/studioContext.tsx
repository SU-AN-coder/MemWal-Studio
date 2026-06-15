// MemWal Studio - Studio Context
// React context providing the full Studio state to the UI layer

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import { LocalIndex } from "./index/localIndex";
import { WalrusStorageAdapter } from "./storage/walrusStorageAdapter";
import { MemWalStorageAdapter } from "./storage/memwalStorageAdapter";
import type { MemoryStorageAdapter } from "./storage/types";
import {
  createMemoryService,
  type MemoryService,
} from "./services/memoryService";
import {
  createArtifactService,
  type ArtifactService,
} from "./services/artifactService";
import { createRunService, type RunService } from "./services/runService";
import {
  createAccessService,
  type AccessService,
} from "./services/accessService";
import { createGraphService, type GraphService } from "./services/graphService";
import { createAuditService, type AuditService } from "./services/auditService";
import { RunRecorder } from "./agent-sdk/runRecorder";
import { runResearchAgent, runStrategyAgent } from "./agent-sdk/demoAgents";
import { generateId } from "./domain/helpers";
import type {
  MemorySpace,
  MemoryItem,
  Artifact,
  AgentRun,
  AccessGrant,
  AuditReport,
  StorageMode,
} from "./domain/types";

export interface StudioState {
  index: LocalIndex;
  storage: MemoryStorageAdapter;
  memoryService: MemoryService;
  artifactService: ArtifactService;
  runService: RunService;
  accessService: AccessService;
  graphService: GraphService;
  auditService: AuditService;
  activeSpace: MemorySpace | undefined;
  storageMode: StorageMode;
  loading: boolean;
  error: string | null;
  success: string | null;
}

export interface StudioActions {
  createSpace: (
    name: string,
    description: string,
    owner: string,
    tags: string[],
  ) => MemorySpace;
  runResearchAgentDemo: () => Promise<{
    runId: string | null;
    memories: MemoryItem[];
    artifacts: Artifact[];
  }>;
  runStrategyAgentDemo: () => Promise<{
    runId: string | null;
    memories: MemoryItem[];
    artifacts: Artifact[];
  }>;
  grantAccess: (input: {
    spaceId: string;
    agentId: string;
    agentName: string;
    permission: "read" | "write" | "admin";
    granterAgentId: string;
    expiresAtMs?: number | null;
  }) => AccessGrant;
  revokeAccess: (grantId: string) => AccessGrant;
  exportReport: () => AuditReport;
  resetAll: () => void;
  setStorageMode: (mode: StorageMode) => void;
}

export type StudioContextValue = StudioState & StudioActions;

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: ReactNode }) {
  // Create stable index instance
  const [index] = useState(() => new LocalIndex());

  // Storage mode state - persisted in LocalIndex
  const [storageMode, setStorageMode] = useState<StorageMode>(() =>
    index.getStorageMode(),
  );

  // Build the storage adapter based on current mode
  const storage = useMemo<MemoryStorageAdapter>(() => {
    switch (storageMode) {
      case "MEMWAL":
        return new MemWalStorageAdapter();
      case "WALRUS": {
        const publisherUrl = localStorage.getItem("WALRUS_PUBLISHER_URL") ?? "";
        const aggregatorUrl =
          localStorage.getItem("WALRUS_AGGREGATOR_URL") ?? "";
        return new WalrusStorageAdapter(publisherUrl, aggregatorUrl);
      }
      default:
        return new MemWalStorageAdapter();
    }
  }, [storageMode]);

  // Services depend on index + storage mode
  const memoryService = useMemo(
    () => createMemoryService({ index, storageMode }),
    [index, storageMode],
  );
  const artifactService = useMemo(
    () => createArtifactService({ index, storageMode }),
    [index, storageMode],
  );
  const runService = useMemo(() => createRunService({ index }), [index]);
  const accessService = useMemo(() => createAccessService({ index }), [index]);
  const graphService = useMemo(() => createGraphService({ index }), [index]);
  const auditService = useMemo(() => createAuditService({ index }), [index]);

  const [activeSpace, setActiveSpace] = useState<MemorySpace | undefined>(() =>
    index.getActiveSpace(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Persist storage mode changes to the index
  const handleSetStorageMode = useCallback(
    (mode: StorageMode) => {
      setStorageMode(mode);
      index.setStorageMode(mode);
    },
    [index],
  );

  // Sync active space changes back to index
  useEffect(() => {
    if (activeSpace) {
      index.setActiveSpace(activeSpace.id);
    } else {
      index.setActiveSpace(null);
    }
  }, [activeSpace, index]);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const result = await fn();
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const createSpace = useCallback(
    (
      name: string,
      description: string,
      owner: string,
      tags: string[],
    ): MemorySpace => {
      const space = memoryService.createMemorySpace({
        name,
        description,
        owner,
        tags,
      });
      setActiveSpace(space);
      setSuccess(`Space "${space.name}" created successfully`);
      return space;
    },
    [memoryService],
  );

  const runResearchAgentDemo = useCallback(async () => {
    if (!activeSpace) {
      throw new Error("No active space. Create a space first.");
    }
    return withLoading(async () => {
      const agentId = generateId("agent");
      const recorder = new RunRecorder(runService, index);
      const result = await runResearchAgent(
        activeSpace.id,
        agentId,
        recorder,
        memoryService,
        artifactService,
        storage,
      );
      setSuccess("Research Agent demo completed successfully");
      return result;
    });
  }, [
    activeSpace,
    withLoading,
    runService,
    index,
    memoryService,
    artifactService,
    storage,
  ]);

  const runStrategyAgentDemo = useCallback(async () => {
    if (!activeSpace) {
      throw new Error("No active space. Create a space first.");
    }
    return withLoading(async () => {
      const agentId = generateId("agent");
      const recorder = new RunRecorder(runService, index);
      const result = await runStrategyAgent(
        activeSpace.id,
        agentId,
        recorder,
        memoryService,
        artifactService,
        storage,
      );
      setSuccess("Strategy Agent demo completed successfully");
      return result;
    });
  }, [
    activeSpace,
    withLoading,
    runService,
    index,
    memoryService,
    artifactService,
    storage,
  ]);

  const grantAccessAction = useCallback(
    (input: {
      spaceId: string;
      agentId: string;
      agentName: string;
      permission: "read" | "write" | "admin";
      granterAgentId: string;
      expiresAtMs?: number | null;
    }): AccessGrant => {
      const grant = accessService.grantAccess(input);
      setSuccess(`Access granted to ${input.agentName} (${input.permission})`);
      return grant;
    },
    [accessService],
  );

  const revokeAccessAction = useCallback(
    (grantId: string): AccessGrant => {
      const grant = accessService.revokeAccess(grantId);
      setSuccess(`Access revoked for ${grant.agentName}`);
      return grant;
    },
    [accessService],
  );

  const exportReport = useCallback((): AuditReport => {
    if (!activeSpace) {
      throw new Error("No active space to generate report for.");
    }
    const report = auditService.generateAuditReport(activeSpace);
    setSuccess("Audit report generated");
    return report;
  }, [activeSpace, auditService]);

  const resetAll = useCallback(() => {
    memoryService.resetAllData(storage);
    setActiveSpace(undefined);
    setError(null);
    setSuccess(null);
  }, [memoryService, storage]);

  const value = useMemo<StudioContextValue>(
    () => ({
      index,
      storage,
      memoryService,
      artifactService,
      runService,
      accessService,
      graphService,
      auditService,
      activeSpace,
      storageMode,
      loading,
      error,
      success,
      createSpace,
      runResearchAgentDemo,
      runStrategyAgentDemo,
      grantAccess: grantAccessAction,
      revokeAccess: revokeAccessAction,
      exportReport,
      resetAll,
      setStorageMode: handleSetStorageMode,
    }),
    [
      index,
      storage,
      memoryService,
      artifactService,
      runService,
      accessService,
      graphService,
      auditService,
      activeSpace,
      storageMode,
      loading,
      error,
      success,
      createSpace,
      runResearchAgentDemo,
      runStrategyAgentDemo,
      grantAccessAction,
      revokeAccessAction,
      exportReport,
      resetAll,
      handleSetStorageMode,
    ],
  );

  return (
    <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
  );
}

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) {
    throw new Error("useStudio must be used within a StudioProvider");
  }
  return ctx;
}
