// MemWal Studio - Access Service
// Access control for memory spaces

import type { AccessGrant, Permission } from "../domain/types";
import type { LocalIndex } from "../index/localIndex";
import { generateId, isoNow } from "../domain/helpers";
import { createAccessGrantInputSchema } from "../domain/schemas";
import { AppError } from "../domain/types";

export interface AccessServiceDeps {
  index: LocalIndex;
}

export function createAccessService(deps: AccessServiceDeps) {
  const { index } = deps;

  function grantAccess(input: unknown): AccessGrant {
    const parsed = createAccessGrantInputSchema.parse(input);
    const now = isoNow();

    const grant: AccessGrant = {
      id: generateId("grant"),
      spaceId: parsed.spaceId,
      agentId: parsed.agentId,
      agentName: parsed.agentName,
      permission: parsed.permission,
      status: "active",
      granterAgentId: parsed.granterAgentId,
      grantedAt: now,
      revokedAt: null,
      expiresAtMs: parsed.expiresAtMs,
      suiTxDigest: null,
      grantTxDigest: null,
      revokeTxDigest: null,
    };

    index.addGrant(grant);
    return grant;
  }

  function revokeAccess(grantId: string): AccessGrant {
    const grant = index.getGrant(grantId);
    if (!grant) {
      throw new AppError("NOT_FOUND", `Access grant not found: ${grantId}`);
    }

    const updated: Partial<AccessGrant> = {
      status: "revoked",
      revokedAt: isoNow(),
    };
    index.updateGrant(grantId, updated);
    return index.getGrant(grantId)!;
  }

  function checkAccess(
    spaceId: string,
    agentId: string,
    permission: Permission,
  ): boolean {
    const grants = index.getGrants(spaceId);
    const now = Date.now();

    return grants.some((grant) => {
      if (grant.agentId !== agentId) return false;
      if (grant.status !== "active") return false;

      // Check expiration
      if (grant.expiresAtMs !== null && grant.expiresAtMs < now) {
        return false;
      }

      // Permission hierarchy: admin > write > read
      if (grant.permission === "admin") return true;
      if (grant.permission === "write" && permission !== "admin") return true;
      if (grant.permission === "read" && permission === "read") return true;

      return false;
    });
  }

  function getGrants(spaceId?: string): AccessGrant[] {
    return index.getGrants(spaceId);
  }

  return {
    grantAccess,
    revokeAccess,
    checkAccess,
    getGrants,
  };
}

export type AccessService = ReturnType<typeof createAccessService>;
