import { describe, expect, it } from "vitest";
import {
  SPECIAL_BAGGAGE_CATEGORY_IDS,
  mapSpecialBaggageResult,
  validateSpecialBaggageCatalogue,
} from "@/services/specialBaggage";
import type { SpecialBaggageResult } from "@/types";

function publishedResult(index: number): SpecialBaggageResult {
  const categoryId = SPECIAL_BAGGAGE_CATEGORY_IDS[index]!;
  return {
    resultId: `SBR${String(index + 1).padStart(3, "0")}`,
    rank: index + 1,
    categoryId,
    category: categoryId,
    linkedItemIds: [`SB${String(index + 1).padStart(3, "0")}`],
    title: categoryId,
    summary: "Summary",
    preparationGuidance: "Prepare",
    feeGuidance: "Check fees",
    policyLinkLabel: "Review airline policy",
    policyLinkSource: "02_Airlines > Baggage URL",
    mobilityOrMedical: false,
    reviewStatus: "Approved",
    published: true,
    notes: "",
    source: "sheet",
  };
}

describe("special baggage runtime mapping", () => {
  it("maps a governed result row", () => {
    const result = mapSpecialBaggageResult({
      "Result ID": "SBR001",
      "Result Rank": "1",
      "Result Category": "Buggies and prams",
      "Linked Item IDs": "SB017",
      "Result Title": "Buggies and prams",
      "Result Summary": "Summary",
      "Preparation Guidance": "Prepare",
      "Fee Guidance": "Check fees",
      "Policy Link Label": "Review airline policy",
      "Policy Link Source": "02_Airlines > Baggage URL",
      "Mobility or Medical Result": "FALSE",
      "Review Status": "Approved",
      Publish: "TRUE",
      Notes: "",
    });

    expect(result).toMatchObject({
      resultId: "SBR001",
      rank: 1,
      categoryId: "buggies-prams",
      linkedItemIds: ["SB017"],
      published: true,
    });
  });

  it("fails closed when any governed category is missing", () => {
    const incomplete = SPECIAL_BAGGAGE_CATEGORY_IDS.slice(0, 13).map((_, index) => publishedResult(index));
    expect(validateSpecialBaggageCatalogue(incomplete)).toEqual([]);
  });

  it("accepts exactly the fourteen unique governed categories", () => {
    const complete = SPECIAL_BAGGAGE_CATEGORY_IDS.map((_, index) => publishedResult(index));
    expect(validateSpecialBaggageCatalogue(complete)).toHaveLength(14);
    expect(validateSpecialBaggageCatalogue(complete).map((item) => item.rank)).toEqual(
      Array.from({ length: 14 }, (_, index) => index + 1)
    );
  });

  it("fails closed when a governed category is duplicated", () => {
    const duplicate = SPECIAL_BAGGAGE_CATEGORY_IDS.map((_, index) => publishedResult(index));
    duplicate[13] = { ...duplicate[13]!, categoryId: duplicate[12]!.categoryId };
    expect(validateSpecialBaggageCatalogue(duplicate)).toEqual([]);
  });
});
