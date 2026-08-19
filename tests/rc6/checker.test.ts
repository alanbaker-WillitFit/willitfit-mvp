import { describe, expect, it } from "vitest";
import {
  assessRc6Checker,
  rc6AvailableBagTypes,
  rc6RuleNoMorePermissive,
  resolveRc6CheckerRule,
  type Rc6CheckerCatalogue,
} from "@/services/rc6/checker";
import type { Rc6AirlineRule } from "@/services/rc6/airlineRules";
import type { Rc6AirlineIdentity } from "@/services/rc6/airlines";

function fixedRule(overrides: Partial<Rc6AirlineRule> = {}): Rc6AirlineRule {
  return {
    ruleId: "TEST-CAB-001",
    airlineId: "TEST",
    fare: "Basic",
    bagType: "cabinBag",
    sizingRule: {
      method: "fixed-dimensions",
      dimensions: { heightCm: 55, widthCm: 40, depthCm: 20 },
    },
    weightLimitKg: 10,
    sourceReference: "https://example.com/baggage",
    lastChecked: "2026-08-19",
    ...overrides,
  };
}

function airline(overrides: Partial<Rc6AirlineIdentity> = {}): Rc6AirlineIdentity {
  return {
    airlineId: "TEST",
    airlineName: "Test Airways",
    iataCode: "TT",
    searchTerms: ["Test Airways", "TT"],
    country: "United Kingdom",
    websiteUrl: "https://example.com",
    baggageUrl: "https://example.com/baggage",
    logoReference: "",
    displayOrder: 1,
    lastReviewed: "2026-08-19",
    notes: "",
    slug: "test-airways",
    ...overrides,
  };
}

describe("RC6 checker orchestration", () => {
  it("resolves an explicit fare exactly", () => {
    const basic = fixedRule();
    const flex = fixedRule({
      ruleId: "TEST-CAB-002",
      fare: "Flex",
      sizingRule: {
        method: "fixed-dimensions",
        dimensions: { heightCm: 56, widthCm: 45, depthCm: 25 },
      },
    });

    const result = resolveRc6CheckerRule([basic, flex], "test", "cabinBag", " flex ");
    expect(result.state).toBe("RESOLVED");
    if (result.state === "RESOLVED") expect(result.rule.ruleId).toBe("TEST-CAB-002");
  });

  it("uses a real dominant published rule for the no-fare baseline", () => {
    const basic = fixedRule();
    const flex = fixedRule({
      ruleId: "TEST-CAB-002",
      fare: "Flex",
      sizingRule: {
        method: "fixed-dimensions",
        dimensions: { heightCm: 56, widthCm: 45, depthCm: 25 },
      },
      weightLimitKg: 12,
    });

    expect(rc6RuleNoMorePermissive(basic, flex)).toBe(true);
    const result = resolveRc6CheckerRule([flex, basic], "TEST", "cabinBag");
    expect(result.state).toBe("RESOLVED");
    if (result.state === "RESOLVED") expect(result.rule.ruleId).toBe("TEST-CAB-001");
  });

  it("requires fare selection when no real rule dominates the alternatives", () => {
    const smallerButHeavier = fixedRule({
      ruleId: "TEST-CAB-001",
      fare: "Basic",
      weightLimitKg: 12,
      sizingRule: {
        method: "fixed-dimensions",
        dimensions: { heightCm: 55, widthCm: 40, depthCm: 20 },
      },
    });
    const largerButLighter = fixedRule({
      ruleId: "TEST-CAB-002",
      fare: "Flex",
      weightLimitKg: 8,
      sizingRule: {
        method: "fixed-dimensions",
        dimensions: { heightCm: 56, widthCm: 45, depthCm: 25 },
      },
    });

    const result = resolveRc6CheckerRule([smallerButHeavier, largerButLighter], "TEST", "cabinBag");
    expect(result).toEqual({
      state: "FARE_REQUIRED",
      rule: null,
      fare: null,
      availableFares: ["Basic", "Flex"],
    });
  });

  it("treats strict lt as more restrictive than lte at the same linear limit", () => {
    const strict: Rc6AirlineRule = {
      ...fixedRule({ bagType: "checkedBag", weightLimitKg: 23 }),
      ruleId: "STRICT",
      sizingRule: { method: "linear-total", linearLimitCm: 158, operator: "lt" },
    };
    const inclusive: Rc6AirlineRule = {
      ...strict,
      ruleId: "INCLUSIVE",
      fare: "Flex",
      sizingRule: { method: "linear-total", linearLimitCm: 158, operator: "lte" },
    };

    expect(rc6RuleNoMorePermissive(strict, inclusive)).toBe(true);
    expect(rc6RuleNoMorePermissive(inclusive, strict)).toBe(false);
  });

  it("does not invent a baseline across different sizing methods", () => {
    const fixed = fixedRule({ bagType: "checkedBag" });
    const linear: Rc6AirlineRule = {
      ...fixed,
      ruleId: "TEST-CHK-002",
      fare: "Flex",
      sizingRule: { method: "linear-total", linearLimitCm: 158, operator: "lte" },
    };

    expect(resolveRc6CheckerRule([fixed, linear], "TEST", "checkedBag").state).toBe("FARE_REQUIRED");
  });

  it("reports available bag types from governed rules", () => {
    const rules = [
      fixedRule({ bagType: "personalItem", ruleId: "PER" }),
      fixedRule({ bagType: "cabinBag", ruleId: "CAB" }),
    ];
    expect(rc6AvailableBagTypes(rules, "test")).toEqual(["personalItem", "cabinBag"]);
  });

  it("assesses the resolved rule through the pure RC6 fit engine", () => {
    const rule = fixedRule();
    const catalogue: Rc6CheckerCatalogue = { airlines: [airline()], rules: [rule] };

    const result = assessRc6Checker({
      catalogue,
      airlineId: "TEST",
      bagType: "cabinBag",
      fare: "Basic",
      enteredDimensions: { heightCm: 55, widthCm: 40, depthCm: 20 },
      enteredWeightKg: 10,
    });

    expect("fit" in result).toBe(true);
    if ("fit" in result) {
      expect(result.rule.ruleId).toBe("TEST-CAB-001");
      expect(result.fit.verdict).toBe("fits");
    }
  });
});
