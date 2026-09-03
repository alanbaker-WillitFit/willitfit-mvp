import { describe, expect, it } from "vitest";
import {
  getRc6AirlineRules,
  mapRc6AirlineRuleRow,
  rc6RulesForAirline,
} from "@/services/rc6/airlineRules";

type RuntimeRow = Record<string, string>;

function ruleRow(overrides: Partial<RuntimeRow> = {}): RuntimeRow {
  return {
    "Rule ID": "TEST-CAB-001",
    "Airline ID": "TEST",
    Fare: "Standard",
    "Bag Type": "Cabin",
    "Length cm": "55",
    "Width cm": "40",
    "Depth cm": "20",
    "Weight kg": "10",
    "Linear Size cm": "115",
    "Wheels Included": "Yes",
    "Handles Included": "Yes",
    "Fits Under Seat": "No",
    "Soft Bag Guidance": "",
    "Rule Wording": "1 cabin bag",
    "Source Reference": "https://example.com/baggage",
    "Last Checked": "2026-08-19",
    "Review Status": "Approved",
    Publish: "Yes",
    Notes: "",
    "Sizing Method": "fixed dimensions",
    "Limit Operator": "lte",
    ...overrides,
  };
}

describe("RC6 airline rule mapper", () => {
  it("maps a fixed-dimension rule only from governed sizing fields", () => {
    const result = mapRc6AirlineRuleRow(ruleRow());
    expect(result?.sizingRule).toEqual({ method: "fixed-dimensions", dimensions: { heightCm: 55, widthCm: 40, depthCm: 20 } });
    expect(result?.weightLimitKg).toBe(10);
  });

  it("maps easyJet strict linear-total semantics as lt", () => {
    const result = mapRc6AirlineRuleRow(ruleRow({
      "Rule ID": "EZY-CHK-20260801-001", "Airline ID": "EZY", Fare: "Purchased 15kg Hold Bag", "Bag Type": "Checked",
      "Length cm": "", "Width cm": "", "Depth cm": "", "Weight kg": "15", "Linear Size cm": "275", "Sizing Method": "linear total", "Limit Operator": "lt",
    }));
    expect(result?.sizingRule).toEqual({ method: "linear-total", linearLimitCm: 275, operator: "lt" });
  });

  it("maps inclusive linear-total semantics as lte", () => {
    const result = mapRc6AirlineRuleRow(ruleRow({
      "Rule ID": "KLM-CHK-20260801-001", "Airline ID": "KLM", "Bag Type": "Checked",
      "Length cm": "", "Width cm": "", "Depth cm": "", "Weight kg": "23", "Linear Size cm": "158", "Sizing Method": "linear total", "Limit Operator": "lte",
    }));
    expect(result?.sizingRule).toEqual({ method: "linear-total", linearLimitCm: 158, operator: "lte" });
  });

  it("does not infer a sizing method or operator from prose", () => {
    expect(mapRc6AirlineRuleRow(ruleRow({
      "Sizing Method": "", "Limit Operator": "", "Rule Wording": "Maximum combined dimensions must be under 275 cm", "Linear Size cm": "275",
    }))).toBeNull();
  });

  it("rejects inconsistent fixed-dimension operator semantics", () => {
    expect(mapRc6AirlineRuleRow(ruleRow({ "Limit Operator": "lt" }))).toBeNull();
  });

  it("rejects unpublished rows instead of silently retaining them", () => {
    expect(mapRc6AirlineRuleRow(ruleRow({ Publish: "No" }))).toBeNull();
  });

  it("requires the complete 425-rule governed catalogue", async () => {
    const rows = Array.from({ length: 425 }, (_, index) => ruleRow({ "Rule ID": `TEST-CAB-${String(index + 1).padStart(3, "0")}` }));
    const result = await getRc6AirlineRules(async <T extends Record<string, string>>() => rows as unknown as T[]);
    expect(result).toHaveLength(425);
  });

  it("fails closed when the governed catalogue is incomplete", async () => {
    const rows = Array.from({ length: 424 }, (_, index) => ruleRow({ "Rule ID": `TEST-CAB-${String(index + 1).padStart(3, "0")}` }));
    const result = await getRc6AirlineRules(async <T extends Record<string, string>>() => rows as unknown as T[]);
    expect(result).toEqual([]);
  });

  it("permits governed catalogue growth above the certified minimum", async () => {
    const rows = Array.from({ length: 426 }, (_, index) => ruleRow({ "Rule ID": `TEST-CAB-${String(index + 1).padStart(3, "0")}` }));
    const result = await getRc6AirlineRules(async <T extends Record<string, string>>() => rows as unknown as T[]);
    expect(result).toHaveLength(426);
  });

  it("fails closed on duplicate governed rule IDs", async () => {
    const rows = Array.from({ length: 425 }, (_, index) => ruleRow({ "Rule ID": `TEST-CAB-${String(index + 1).padStart(3, "0")}` }));
    rows[424] = ruleRow({ "Rule ID": "TEST-CAB-001" });
    const result = await getRc6AirlineRules(async <T extends Record<string, string>>() => rows as unknown as T[]);
    expect(result).toEqual([]);
  });

  it("filters rules by airline and baggage type without changing rule semantics", () => {
    const cabin = mapRc6AirlineRuleRow(ruleRow({ "Rule ID": "BA-CAB", "Airline ID": "BAW" }))!;
    const checked = mapRc6AirlineRuleRow(ruleRow({ "Rule ID": "BA-CHK", "Airline ID": "BAW", "Bag Type": "Checked" }))!;
    const other = mapRc6AirlineRuleRow(ruleRow({ "Rule ID": "EZY-CAB", "Airline ID": "EZY" }))!;
    expect(rc6RulesForAirline([cabin, checked, other], "baw", "checkedBag")).toEqual([checked]);
  });
});
