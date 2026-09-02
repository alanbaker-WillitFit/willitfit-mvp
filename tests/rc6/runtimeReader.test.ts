import { describe, expect, it } from "vitest";
import {
  canServeRc6Rows,
  isRc6AuthoritativeEmpty,
  readRc6Dataset,
} from "@/services/rc6/runtimeReader";

const validAirlineRow = {
  "Airline ID": "TEST",
  "Airline Name": "Test Air",
  "IATA Code": "TA",
  "Search Terms": "Test Air, TA",
  Country: "United Kingdom",
  "Website URL": "https://example.com",
  "Baggage URL": "https://example.com/baggage",
  "Display Order": "1",
  Active: "Yes",
  "Review Status": "Approved",
  "Last Reviewed": "2026-08-19",
  Publish: "Yes",
};

const validAirlineRuleRow = {
  "Rule ID": "EZY-CHK-20260801-001",
  "Airline ID": "EZY",
  Fare: "Purchased 15kg Hold Bag",
  "Bag Type": "Checked",
  "Length cm": "",
  "Width cm": "",
  "Depth cm": "",
  "Weight kg": "15",
  "Linear Size cm": "275",
  "Source Reference": "https://www.easyjet.com/en/help/baggage/hold-luggage",
  "Last Checked": "2026-08-01",
  "Review Status": "Approved",
  Publish: "Yes",
  "Sizing Method": "linear total",
  "Limit Operator": "lt",
};

describe("RC6 canonical Runtime reader", () => {
  it("reads only the canonical tab for a dataset", async () => {
    const calls: string[] = [];
    const result = await readRc6Dataset("airlines", async <T extends Record<string, string>>(tabName: string) => {
      calls.push(tabName);
      return [validAirlineRow] as unknown as T[];
    });

    expect(calls).toEqual(["02_Airlines"]);
    expect(result.state).toBe("READY_WITH_ROWS");
    expect(canServeRc6Rows(result)).toBe(true);
  });

  it("consumes airline rules only from the canonical RC6 tab when governed semantics are present", async () => {
    const calls: string[] = [];
    const result = await readRc6Dataset("airlineRules", async <T extends Record<string, string>>(tabName: string) => {
      calls.push(tabName);
      return [validAirlineRuleRow] as unknown as T[];
    });

    expect(calls).toEqual(["03_Airline Rules"]);
    expect(result.state).toBe("READY_WITH_ROWS");
    expect(canServeRc6Rows(result)).toBe(true);
  });

  it("fails closed if a future airline-rule projection drops governed sizing semantics", async () => {
    const { "Sizing Method": _method, "Limit Operator": _operator, ...withoutGovernedSemantics } = validAirlineRuleRow;
    const result = await readRc6Dataset("airlineRules", async <T extends Record<string, string>>() => [
      withoutGovernedSemantics,
    ] as unknown as T[]);

    expect(result.state).toBe("READ_OR_SCHEMA_FAILURE");
    expect(result.error).toContain("Sizing Method");
    expect(result.error).toContain("Limit Operator");
    expect(canServeRc6Rows(result)).toBe(false);
  });

  it("treats a successful zero-row read as authoritative empty", async () => {
    const result = await readRc6Dataset("offers", async <T extends Record<string, string>>() => [] as T[]);

    expect(result.state).toBe("AUTHORITATIVE_EMPTY");
    expect(result.rows).toEqual([]);
    expect(isRc6AuthoritativeEmpty(result)).toBe(true);
  });

  it("distinguishes a technical read failure from authoritative empty", async () => {
    const result = await readRc6Dataset("offers", async () => null);

    expect(result.state).toBe("READ_OR_SCHEMA_FAILURE");
    expect(result.rows).toEqual([]);
    expect(isRc6AuthoritativeEmpty(result)).toBe(false);
  });

  it("fails closed when a governed retained dataset has the wrong headers", async () => {
    const result = await readRc6Dataset("navigation", async <T extends Record<string, string>>() => [
      { Label: "WillItFly", URL: "https://www.will-it-fly.net" },
    ] as unknown as T[]);

    expect(result.state).toBe("READ_OR_SCHEMA_FAILURE");
    expect(result.error).toContain("missing required RC6 headers");
    expect(canServeRc6Rows(result)).toBe(false);
  });

  it("fails closed when the adapter throws", async () => {
    const result = await readRc6Dataset("airlines", async () => {
      throw new Error("network unavailable");
    });

    expect(result.state).toBe("READ_OR_SCHEMA_FAILURE");
    expect(result.error).toContain("network unavailable");
    expect(canServeRc6Rows(result)).toBe(false);
  });
});
