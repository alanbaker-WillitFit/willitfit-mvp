import { describe, expect, it } from "vitest";
import { getPreprodCandidate, getPreprodCandidates, getPublishableCandidates, MASTER_ESTATE_BASELINE } from "@/lib/masterEstatePreprod";

describe("Master Estate V1 pre-production contract", () => {
  it("locks the governing baseline counts", () => {
    expect(MASTER_ESTATE_BASELINE.uniqueCanonicalFiles).toBe(14819);
    expect(MASTER_ESTATE_BASELINE.exactDuplicateInstances).toBe(27707);
    expect(MASTER_ESTATE_BASELINE.uniqueUrls).toBe(123289);
  });
  it("keeps all initial FIT pages on publication hold", () => {
    expect(getPreprodCandidates("FIT").length).toBeGreaterThan(0);
    expect(getPublishableCandidates("FIT")).toHaveLength(0);
  });
  it("resolves candidates by slug", () => {
    const first = getPreprodCandidates("FIT")[0];
    expect(first).toBeDefined();
    expect(getPreprodCandidate("FIT", first!.slug)?.pageId).toBe(first!.pageId);
  });
});
