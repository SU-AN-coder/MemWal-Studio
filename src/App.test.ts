import { describe, expect, it } from "vitest";
import { getProofScore } from "./App";

describe("proof readiness label", () => {
  it("keeps real evidence separate from local mock fallback", () => {
    expect(getProofScore("REAL")).toBe("2/7 wired");
    expect(getProofScore("MOCK")).toBe("mock excluded");
  });
});
