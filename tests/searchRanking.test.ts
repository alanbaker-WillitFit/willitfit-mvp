import { describe, expect, it } from "vitest";
import { editDistance, normaliseSearch, scoreSearchFields } from "@/lib/searchRanking";

describe("search ranking", () => {
  it("normalises punctuation and spacing", () => expect(normaliseSearch("  Cabin-bag!  ")).toBe("cabin bag"));
  it("calculates edit distance", () => expect(editDistance("ryanair", "ryanir")).toBe(1));
  it("tolerates a spelling error", () => expect(scoreSearchFields("ryanir", [{ value: "Ryanair", weight: 3 }])).toBeGreaterThan(0));
  it("ranks exact prefixes above fuzzy matches", () => {
    const exact = scoreSearchFields("easy", [{ value: "easyJet", weight: 3 }]);
    const fuzzy = scoreSearchFields("esyjet", [{ value: "easyJet", weight: 3 }]);
    expect(exact).toBeGreaterThan(fuzzy);
  });
});
