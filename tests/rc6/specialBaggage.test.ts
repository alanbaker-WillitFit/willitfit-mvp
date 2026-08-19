import { describe, expect, it } from "vitest";
import {
  getRc6SpecialBaggageReferenceItems,
  getRc6SpecialBaggageResults,
} from "@/services/rc6/specialBaggage";
import type { Rc6TabReader } from "@/services/rc6/runtimeReader";

type Row = Record<string, string>;

function readerFor(rowsByTab: Record<string, Row[]>): Rc6TabReader {
  return async <T extends Row>(tabName: string): Promise<T[] | null> => {
    const rows = rowsByTab[tabName];
    return rows ? (rows as T[]) : null;
  };
}

function resultRow(index: number, overrides: Partial<Row> = {}): Row {
  const rank = index + 1;
  return {
    "Result ID": `SBR${String(rank).padStart(3, "0")}`,
    "Result Rank": String(rank),
    "Result Category": `Category ${rank}`,
    "Linked Item IDs": `SB${String(rank).padStart(3, "0")}`,
    "Result Title": `Title ${rank}`,
    "Result Summary": `Summary ${rank}`,
    "Preparation Guidance": `Preparation ${rank}`,
    "Fee Guidance": `Fee ${rank}`,
    "Policy Link Label": "Review airline policy",
    "Policy Link Source": `REF-${rank}`,
    "Mobility or Medical Result": rank === 3 ? "TRUE" : "FALSE",
    "Review Status": "Approved",
    Publish: "TRUE",
    Notes: "Governed RC6 test row",
    ...overrides,
  };
}

function referenceRow(index: number, overrides: Partial<Row> = {}): Row {
  const rank = index + 1;
  return {
    "Item ID": `SB${String(rank).padStart(3, "0")}`,
    "Item Rank": String(rank),
    Category: "Special baggage",
    "Item Name": `Item ${rank}`,
    "Item Subtype": "",
    "Typical Shape": "Test shape",
    "Handling Classification": "Special Baggage",
    "Special Handling Guidance": "Check airline policy.",
    "Advance Notification Usually Required": "FALSE",
    "Special Packaging Usually Required": "TRUE",
    "Battery or Dangerous Goods Consideration": "FALSE",
    "Mobility or Medical Equipment": "FALSE",
    "Airline-Level Validation Required": "TRUE",
    "Result Category": `Category ${Math.min(rank, 21)}`,
    "Review Status": "In Review",
    Publish: "FALSE",
    Notes: "Reference only",
    ...overrides,
  };
}

describe("RC6 Special Baggage", () => {
  it("accepts the governed 21-result catalogue without an RC5 category allowlist", async () => {
    const rows = Array.from({ length: 21 }, (_, index) => resultRow(index));
    const results = await getRc6SpecialBaggageResults(readerFor({ "04.1_Special Baggage Results": rows }));

    expect(results).toHaveLength(21);
    expect(results[0]?.resultId).toBe("SBR001");
    expect(results[20]?.resultId).toBe("SBR021");
    expect(results[2]?.mobilityOrMedical).toBe(true);
  });

  it("fails closed when one governed result is missing", async () => {
    const rows = Array.from({ length: 20 }, (_, index) => resultRow(index));
    const results = await getRc6SpecialBaggageResults(readerFor({ "04.1_Special Baggage Results": rows }));

    expect(results).toEqual([]);
  });

  it("fails closed on duplicate result IDs or ranks", async () => {
    const rows = Array.from({ length: 21 }, (_, index) => resultRow(index));
    rows[20] = resultRow(20, { "Result ID": "SBR020", "Result Rank": "20" });
    const results = await getRc6SpecialBaggageResults(readerFor({ "04.1_Special Baggage Results": rows }));

    expect(results).toEqual([]);
  });

  it("fails closed when any of the 21 governed rows is unpublished", async () => {
    const rows = Array.from({ length: 21 }, (_, index) => resultRow(index));
    rows[10] = resultRow(10, { Publish: "FALSE" });
    const results = await getRc6SpecialBaggageResults(readerFor({ "04.1_Special Baggage Results": rows }));

    expect(results).toEqual([]);
  });

  it("keeps the 24-item source catalogue separate from public result publication", async () => {
    const rows = Array.from({ length: 24 }, (_, index) => referenceRow(index));
    const items = await getRc6SpecialBaggageReferenceItems(readerFor({ "04_Special Baggage All": rows }));

    expect(items).toHaveLength(24);
    expect(items.every((item) => item.published === false)).toBe(true);
    expect(items[0]?.airlineLevelValidationRequired).toBe(true);
  });

  it("fails closed when the result schema is malformed", async () => {
    const results = await getRc6SpecialBaggageResults(readerFor({
      "04.1_Special Baggage Results": [{ "Result ID": "SBR001", Publish: "TRUE" }],
    }));

    expect(results).toEqual([]);
  });
});
