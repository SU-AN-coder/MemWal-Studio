// MemWal Studio - Run Recorder
// Deterministic run recorder for demo agents
// Wraps RunService to provide a simplified recording interface

import type { RunService } from "../services/runService";
import type { RunEventKind, RunStatus, AgentRun } from "../domain/types";
import type { LocalIndex } from "../index/localIndex";

export class RunRecorder {
  private runId: string | null = null;
  private runService: RunService;
  private index: LocalIndex;

  constructor(runService: RunService, index: LocalIndex) {
    this.runService = runService;
    this.index = index;
  }

  start(
    spaceId: string,
    agentId: string,
    agentName: string,
    prompt: string,
  ): AgentRun {
    const run = this.runService.startRun(spaceId, agentId, agentName, prompt);
    this.runId = run.id;
    return run;
  }

  recordEvent(
    kind: RunEventKind,
    data: string,
    linkedMemoryIds?: string[],
    linkedArtifactIds?: string[],
  ): void {
    if (!this.runId) {
      throw new Error("RunRecorder: no active run. Call start() first.");
    }
    this.runService.recordEvent(
      this.runId,
      kind,
      data,
      linkedMemoryIds ?? [],
      linkedArtifactIds ?? [],
    );
  }

  finish(status: RunStatus): AgentRun {
    if (!this.runId) {
      throw new Error("RunRecorder: no active run. Call start() first.");
    }
    const run = this.runService.finishRun(this.runId, status);
    // Also update the run with the collected memory and artifact IDs
    // We defer to the services to have already tracked these
    this.runId = null;
    return run;
  }

  get currentRunId(): string | null {
    return this.runId;
  }
}
