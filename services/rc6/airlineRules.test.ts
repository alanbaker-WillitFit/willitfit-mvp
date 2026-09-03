import { describe, expect, it } from "vitest";
import { getRc6AirlineRules, mapRc6AirlineRuleRow } from "./airlineRules";
import type { Rc6TabReader } from "./runtimeReader";

const row = {
  "Rule ID": "TEST-CAB-001",
  "Airline ID": "TST",
  Fare: "Economy | Basic",
  "Bag Type": "Cabin",
  "Length cm": "55",
  "Width cm": "40",
  "Depth cm": "23",
  "Weight kg": "8",
  "Linear Size cm": "118",
  "Source Reference": "https://example.com/baggage",
  "Last Checked": "2026-09-03",
  "Review Status": "Approved",
  Publish: "Yes",
  "Sizing Method": "fixed dimensions",
  "Limit Operator": "lte",
  "Entitlement Status": "Conditional",
  "Applicability Conditions": "Eligible fare only",
  "Weight Basis": "Per Bag",
  "Fare Description": "Basic fare with purchased cabin option",
  "Weight Status": "Published",
  "Weight Guidance": "Maximum 8 kg per bag",
};

describe("RC6 airline rule semantics", () => {
  it("projects baggage entitlement and weight semantics", () => {
    const mapped = mapRc6AirlineRuleRow(row);
    expect(mapped).toMatchObject({
      entitlementStatus: "Conditional",
      applicabilityConditions: "Eligible fare only",
      weightBasis: "Per Bag",
      fareDescription: "Basic fare with purchased cabin option",
      weightStatus: "Published",
      weightGuidance: "Maximum 8 kg per bag",
    });
  });

  it("does not reject legitimate growth above the historic 425-row cohort", async () => {
    const reader: Rc6TabReader = async () => ({
      state: "READY_WITH_ROWS",
      rows: Array.from({ length: 426 }, (_, index) => ({
        ...row,
        "Rule ID": `TEST-CAB-${String(index + 1).padStart(3, "0")}`,
      })),
    });
    const rules = await getRc6AirlineRules(reader);
    expect(rules).toHaveLength(426);
  });
});
