import { describe, expect, it, vi } from "vitest";
import { readWithBuildFallback } from "./publishingSnapshotFallback";

type TestSnapshot = { contractVersion: string; rows: unknown[] };
const valid = (value: TestSnapshot) => value.contractVersion === "1.0.0" && Array.isArray(value.rows);

describe("readWithBuildFallback", () => {
  it("uses CURRENT when valid", async () => {
    const read = vi.fn(async (slot: "current" | "previous") => slot === "current" ? { contractVersion: "1.0.0", rows: [1] } : { contractVersion: "1.0.0", rows: [2] });
    const result = await readWithBuildFallback<TestSnapshot>(read, valid);
    expect(result.slot).toBe("current");
    expect(result.value?.rows).toEqual([1]);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("falls back to PREVIOUS when CURRENT is corrupt", async () => {
    const read = vi.fn(async (slot: "current" | "previous") => slot === "current" ? { contractVersion: "BROKEN", rows: [] } : { contractVersion: "1.0.0", rows: [2] });
    const result = await readWithBuildFallback<TestSnapshot>(read, valid);
    expect(result.slot).toBe("previous");
    expect(result.value?.rows).toEqual([2]);
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("fails closed when both generations are invalid", async () => {
    const read = vi.fn(async () => ({ contractVersion: "BROKEN", rows: [] }));
    const result = await readWithBuildFallback<TestSnapshot>(read, valid);
    expect(result).toEqual({ value: null, slot: null });
    expect(read).toHaveBeenCalledTimes(2);
  });
});
