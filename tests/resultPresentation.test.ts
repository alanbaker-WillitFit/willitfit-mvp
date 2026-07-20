import { describe, expect, it } from "vitest";
import { buildDimensionComparison, formatDifference, wasRotated } from "../lib/resultPresentation";
import { checkFit } from "../lib/fitCalculator";
import type { Airline } from "../types";

const airline: Airline = {
  airlineId: "test", airlineName: "Test Air", slug: "test-air", country: "GB", logoUrl: "",
  cabinBag: { heightCm: 55, widthCm: 40, depthCm: 20 },
  personalItem: { heightCm: 40, widthCm: 25, depthCm: 20 },
  weightLimitKg: 10, fareClasses: [], websiteUrl: "https://example.com",
  lastUpdated: "2026-07-10", status: "Live",
};

describe("result presentation", () => {
  it("builds signed per-axis margin rows", () => {
    const result = checkFit({ heightCm: 56, widthCm: 39, depthCm: 20 }, airline, "cabinBag");
    expect(buildDimensionComparison(result).map((row) => row.differenceCm)).toEqual([1, -1, 0]);
  });

  it("reports when the best-fit orientation rotated the entered dimensions", () => {
    const result = checkFit({ heightCm: 40, widthCm: 55, depthCm: 20 }, airline, "cabinBag");
    expect(wasRotated(result)).toBe(true);
  });

  it("does not report rotation when entered and checked axes match", () => {
    const result = checkFit({ heightCm: 55, widthCm: 40, depthCm: 20 }, airline, "cabinBag");
    expect(wasRotated(result)).toBe(false);
  });

  it("formats positive, negative and zero differences", () => {
    expect(formatDifference(1.5)).toBe("+1.5");
    expect(formatDifference(-2)).toBe("-2");
    expect(formatDifference(0)).toBe("0");
  });
});
