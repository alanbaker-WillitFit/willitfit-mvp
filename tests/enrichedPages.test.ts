import { describe, expect, it } from "vitest";
import { ENRICHED_RULES, getFareGroups, getRuleStats, getSizeGroups } from "@/services/baggageKnowledge";
import { getAirlineReferences } from "@/services/airlines";

describe("RC6 enriched page estate", () => {
  it("retains the certified baggage-rule cardinality", () => {
    const stats = getRuleStats();
    expect(stats.rules).toBe(425);
    expect(stats.airlines).toBe(114);
    expect(stats.fares).toBe(364);
    expect(stats.sources).toBe(425);
    expect(stats.reviewed).toBe(425);
  });

  it("builds fare pages only from governed published rules", async () => {
    const { airlines } = await getAirlineReferences();
    expect(airlines).toHaveLength(114);
    const farePages = airlines.reduce((sum, airline) => sum + getFareGroups(airline.airlineId).length, 0);
    expect(farePages).toBe(364);
    expect(ENRICHED_RULES.every(rule => rule.ruleId && rule.airlineId && rule.fare)).toBe(true);
  });

  it("creates exact-size comparison groups only when all three dimensions exist", () => {
    const groups = getSizeGroups();
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.every(group => group.rules.length > 0)).toBe(true);
    expect(groups.every(group => group.rules.every(rule => rule.lengthCm && rule.widthCm && rule.depthCm))).toBe(true);
  });
});
