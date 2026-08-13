import { describe, expect, it } from "vitest";
import { selectedWeightLimit } from "../components/DimensionForm";
import type { Airline } from "../types";

const airline: Airline = {
  airlineId: "checked-test",
  airlineName: "Checked Test Air",
  slug: "checked-test-air",
  country: "GB",
  logoUrl: "",
  personalItem: { heightCm: 40, widthCm: 25, depthCm: 20 },
  cabinBag: { heightCm: 55, widthCm: 40, depthCm: 20 },
  checkedBag: { heightCm: 80, widthCm: 55, depthCm: 35 },
  weightLimitKg: 10,
  checkedWeightLimitKg: 23,
  fareClasses: [
    {
      fareClass: "Standard",
      personalItem: { heightCm: 40, widthCm: 25, depthCm: 20 },
      cabinBag: { heightCm: 55, widthCm: 40, depthCm: 20 },
      checkedBag: { heightCm: 80, widthCm: 55, depthCm: 35 },
      weightLimitKg: 10,
      checkedWeightLimitKg: 20,
    },
    {
      fareClass: "Flex",
      personalItem: null,
      cabinBag: { heightCm: 56, widthCm: 45, depthCm: 25 },
      checkedBag: { heightCm: 85, widthCm: 60, depthCm: 40 },
      weightLimitKg: 12,
      checkedWeightLimitKg: 32,
    },
  ],
  websiteUrl: "https://example.com",
  lastUpdated: "2026-07-30",
  status: "Live",
};

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

  it("returns null when the published checked-bag limit is unavailable", () => {
    const unpublished: Airline = { ...airline, checkedWeightLimitKg: null };
    expect(selectedWeightLimit(unpublished, "checkedBag", null)).toBeNull();
  });
});
