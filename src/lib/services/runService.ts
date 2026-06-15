// MemWal Studio - Run Service
// Agent run lifecycle management

import type {
  AgentRun,
  RunEvent,
  RunStatus,
  RunEventKind,
} from "../domain/types";
import type { LocalIndex } from "../index/localIndex";
import { generateId, isoNow } from "../domain/helpers";
import { AppError } from "../domain/types";

export interface RunServiceDeps {
  index: LocalIndex;
}

export function createRunService(deps: RunServiceDeps) {
  const { index } = deps;

  function startRun(
    spaceId: string,
    agentId: string,
    agentName: string,
    prompt: string,
  ): AgentRun {
    const now = isoNow();
    const run: AgentRun = {
      id: generateId("run"),
      spaceId,
      agentId,
      agentName,
      status: "running",
      prompt,
      events: [],
      memoryIds: [],
      artifactIds: [],
      startedAt: now,
      finishedAt: null,
      error: null,
    };
    index.addRun(run);
    return run;
  }

  function recordEvent(
    runId: string,
    kind: RunEventKind,
    data: string,
    linkedMemoryIds: string[] = [],
    linkedArtifactIds: string[] = [],
  ): RunEvent {
    const run = index.getRun(runId);
    if (!run) {
      throw new AppError("NOT_FOUND", `Run not found: ${runId}`);
    }

    const event: RunEvent = {
      id: generateId("evt"),
      runId,
      kind,
      timestamp: isoNow(),
      data,
      linkedMemoryIds,
      linkedArtifactIds,
    };

    const updatedEvents = [...run.events, event];
    index.updateRun(runId, { events: updatedEvents });
    return event;
  }

  function finishRun(
    runId: string,
    status: RunStatus,
    error?: string | null,
  ): AgentRun {
    const run = index.getRun(runId);
    if (!run) {
      throw new AppError("NOT_FOUND", `Run not found: ${runId}`);
    }

    const updates: Partial<AgentRun> = {
      status,
      finishedAt: isoNow(),
      error: error ?? null,
    };
    index.updateRun(runId, updates);
    return index.getRun(runId)!;
  }

  function getRuns(spaceId?: string): AgentRun[] {
    return index.getRuns(spaceId);
  }

  function getRun(id: string): AgentRun | undefined {
    return index.getRun(id);
  }

  return {
    startRun,
    recordEvent,
    finishRun,
    getRuns,
    getRun,
  };
}

export type RunService = ReturnType<typeof createRunService>;
