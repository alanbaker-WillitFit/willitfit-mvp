import { describe, expect, it } from "vitest";
import { selectedWeightLimit } from "../components/DimensionForm";
import { checkerPreset } from "../lib/checkerPreset";
import { airlineHasBagType } from "../lib/dimensions";
import { checkFit, resolveLimit } from "../lib/fitCalculator";
import { adaptBaggageRuleRow, mapRuntimeAirline, toCheckedSizingRule } from "../services/airlines";
import type { Airline, BaggageSizingRule, Dimensions } from "../types";

const fixedDimensions: Dimensions = { heightCm: 80, widthCm: 55, depthCm: 35 };
const fixedRule: BaggageSizingRule = { method: "fixed-dimensions", dimensions: fixedDimensions };
const linearLtRule: BaggageSizingRule = { method: "linear-total", linearLimitCm: 275, operator: "lt" };

function makeAirline(checkedBag: BaggageSizingRule = fixedRule): Airline {
  return {
    airlineId: "checked-test",
    airlineName: "Checked Test Air",
    slug: "checked-test-air",
    country: "GB",
    logoUrl: "",
    personalItem: { heightCm: 40, widthCm: 25, depthCm: 20 },
    cabinBag: { heightCm: 55, widthCm: 40, depthCm: 20 },
    checkedBag,
    weightLimitKg: 10,
    checkedWeightLimitKg: 23,
    fareClasses: [
      {
        fareClass: "Standard",
        personalItem: { heightCm: 40, widthCm: 25, depthCm: 20 },
        cabinBag: { heightCm: 55, widthCm: 40, depthCm: 20 },
        checkedBag: fixedRule,
        weightLimitKg: 10,
        checkedWeightLimitKg: 20,
      },
      {
        fareClass: "Flex",
        personalItem: null,
        cabinBag: { heightCm: 56, widthCm: 45, depthCm: 25 },
        checkedBag: { method: "linear-total", linearLimitCm: 300, operator: "lte" },
        weightLimitKg: 12,
        checkedWeightLimitKg: 32,
      },
    ],
    websiteUrl: "https://example.com",
    lastUpdated: "2026-07-30",
    status: "Live",
    hasCabinBag: true,
    hasPersonalItem: true,
    hasCheckedBag: true,
  };
}

const airline = makeAirline();
const linearAirline = makeAirline(linearLtRule);

function runtimeRule(overrides: Record<string, string> = {}) {
  return adaptBaggageRuleRow({
    "Rule ID": "EZY-CHK-275",
    "Airline ID": "EZY",
    Fare: "Standard",
    "Bag Type": "Checked",
    "Sizing Method": "Linear Total",
    "Linear Size cm": "275",
    "Limit Operator": "Less Than",
    "Length cm": "",
    "Width cm": "",
    "Depth cm": "",
    "Weight kg": "23",
    "Review Status": "Approved",
    Publish: "Yes",
    ...overrides,
  });
}

describe("selectedWeightLimit", () => {
  it("uses the airline checked-bag baseline when no fare is selected", () => {
    expect(selectedWeightLimit(airline, "checkedBag", null)).toBe(23);
  });

  it("uses the selected fare checked-bag weight limit", () => {
    expect(selectedWeightLimit(airline, "checkedBag", "Flex")).toBe(32);
  });

  it("matches fare names case-insensitively", () => {
    expect(selectedWeightLimit(airline, "checkedBag", "flex")).toBe(32);
  });

  it("uses the selected fare cabin-bag limit for non-checked baggage", () => {
    expect(selectedWeightLimit(airline, "cabinBag", "Flex")).toBe(12);
  });

  it("falls back to the airline baseline when the selected fare does not support the bag type", () => {
    expect(selectedWeightLimit(airline, "personalItem", "Flex")).toBe(10);
  });

  it("returns null when no airline is selected", () => {
    expect(selectedWeightLimit(null, "checkedBag", "Flex")).toBeNull();
  });
});

describe("checked baggage sizing rules", () => {
  it("preserves existing fixed-dimension orientation behaviour", () => {
    const result = checkFit({ heightCm: 55, widthCm: 80, depthCm: 35 }, airline, "checkedBag");
    expect(result.verdict).toBe("fits");
    expect(result.sizingRule.method).toBe("fixed-dimensions");
    expect(result.orientationUsed).toEqual(fixedDimensions);
    expect(result.limit).toEqual(fixedDimensions);
  });

  it("passes 274.9 under a strict 275 cm limit", () => {
    const result = checkFit({ heightCm: 100, widthCm: 100, depthCm: 74.9 }, linearAirline, "checkedBag");
    expect(result.verdict).toBe("close");
    expect(result.userLinearTotalCm).toBe(274.9);
    expect(result.linearMarginCm).toBe(0.1);
  });

  it("fails exactly 275 under a strict 275 cm limit", () => {
    const result = checkFit({ heightCm: 100, widthCm: 100, depthCm: 75 }, linearAirline, "checkedBag");
    expect(result.verdict).toBe("no-fit");
    expect(result.linearMarginCm).toBe(0);
  });

  it("fails above a strict linear limit", () => {
    const result = checkFit({ heightCm: 100, widthCm: 100, depthCm: 76 }, linearAirline, "checkedBag");
    expect(result.verdict).toBe("no-fit");
    expect(result.linearMarginCm).toBe(-1);
  });

  it("passes equality for an lte fare-specific rule", () => {
    const result = checkFit({ heightCm: 100, widthCm: 100, depthCm: 100 }, airline, "checkedBag", "Flex");
    expect(result.verdict).toBe("close");
    expect(result.linearOperator).toBe("lte");
    expect(result.linearMarginCm).toBe(0);
    expect(result.fareClass).toBe("Flex");
  });

  it("fails closed when a user dimension is missing or invalid", () => {
    expect(() => checkFit({ heightCm: 100, widthCm: 100, depthCm: 0 }, linearAirline, "checkedBag"))
      .toThrow("All three bag dimensions");
  });

  it("keeps weight evaluation separate and lets weight failure override size pass", () => {
    const result = checkFit({ heightCm: 80, widthCm: 55, depthCm: 35 }, linearAirline, "checkedBag", null, 24);
    expect(result.userLinearTotalCm).toBe(170);
    expect(result.weightVerdict).toBe("no-fit");
    expect(result.verdict).toBe("no-fit");
  });

  it("does not preload a linear total into a dimension field", () => {
    expect(checkerPreset(linearAirline, "checkedBag")).toBeNull();
    expect(checkerPreset(airline, "checkedBag")).toEqual(fixedDimensions);
  });

  it("uses a fare-specific linear rule instead of the fixed baseline", () => {
    const resolved = resolveLimit(airline, "checkedBag", "Flex");
    expect(resolved.sizingRule).toEqual({ method: "linear-total", linearLimitCm: 300, operator: "lte" });
  });

  it("leaves cabin and personal-item fixed-dimension behaviour unchanged", () => {
    expect(checkFit({ heightCm: 55, widthCm: 40, depthCm: 20 }, airline, "cabinBag").verdict).toBe("fits");
    expect(checkFit({ heightCm: 40, widthCm: 25, depthCm: 20 }, airline, "personalItem").verdict).toBe("fits");
  });
});

describe("runtime checked-rule parsing", () => {
  it("builds a valid linear-total rule", () => {
    expect(toCheckedSizingRule(runtimeRule())).toEqual(linearLtRule);
  });

  it("rejects a blank linear limit", () => {
    expect(toCheckedSizingRule(runtimeRule({ "Linear Size cm": "" }))).toBeNull();
  });

  it("rejects zero and negative linear limits", () => {
    expect(toCheckedSizingRule(runtimeRule({ "Linear Size cm": "0" }))).toBeNull();
    expect(toCheckedSizingRule(runtimeRule({ "Linear Size cm": "-1" }))).toBeNull();
  });

  it("rejects an unknown sizing method", () => {
    expect(toCheckedSizingRule(runtimeRule({ "Sizing Method": "Mystery" }))).toBeNull();
  });

  it("rejects an unknown operator", () => {
    expect(toCheckedSizingRule(runtimeRule({ "Limit Operator": "Approximately" }))).toBeNull();
  });

  it("rejects partial or artificial fixed dimensions on a linear rule", () => {
    expect(toCheckedSizingRule(runtimeRule({ "Length cm": "275" }))).toBeNull();
  });

  it("accepts fixed dimensions only when all three values are valid", () => {
    expect(toCheckedSizingRule(runtimeRule({
      "Sizing Method": "Fixed Dimensions",
      "Linear Size cm": "170",
      "Limit Operator": "",
      "Length cm": "80",
      "Width cm": "55",
      "Depth cm": "35",
    }))).toEqual(fixedRule);

    expect(toCheckedSizingRule(runtimeRule({
      "Sizing Method": "Fixed Dimensions",
      "Linear Size cm": "170",
      "Limit Operator": "",
      "Length cm": "80",
      "Width cm": "",
      "Depth cm": "35",
    }))).toBeNull();
  });

  it("makes checked baggage available from a linear rule without artificial dimensions", () => {
    const mapped = mapRuntimeAirline({
      AirlineID: "EZY",
      AirlineName: "easyJet",
      Slug: "easyjet",
      Country: "GB",
      OfficialBaggageURL: "https://example.com",
      Status: "Live",
      LastChecked: "2026-07-31",
      Notes: "",
    }, [runtimeRule()]);

    expect(mapped.hasCheckedBag).toBe(true);
    expect(mapped.checkedBag).toEqual(linearLtRule);
    expect(airlineHasBagType(mapped, "checkedBag")).toBe(true);
    expect(mapped.checkedBag && "dimensions" in mapped.checkedBag).toBe(false);
  });
});
