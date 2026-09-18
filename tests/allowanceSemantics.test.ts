import { describe, expect, it } from "vitest";
import { fareSupportsBagType, hasFareSpecificVariation } from "../lib/allowanceSemantics";
import type { Airline } from "../types";

function baseAirline(): Airline {
  return {
    airlineId: "TST", airlineName: "Test Air", slug: "test-air", country: "GB", logoUrl: "",
    personalItem: { heightCm: 40, widthCm: 30, depthCm: 20 },
    cabinBag: { heightCm: 55, widthCm: 40, depthCm: 20 },
    weightLimitKg: 10, checkedWeightLimitKg: 23, fareClasses: [], websiteUrl: "https://example.com",
    lastUpdated: "2026-09-18", status: "Live", hasCabinBag: true, hasPersonalItem: true, hasCheckedBag: true,
  };
}

describe("allowance semantics", () => {
  it("detects size or weight variation between fares", () => {
    const airline = baseAirline();
    airline.fareClasses = [
      { fareClass: "Basic", cabinBag: { heightCm: 45, widthCm: 35, depthCm: 18 }, personalItem: airline.personalItem, weightLimitKg: 8 },
      { fareClass: "Plus", cabinBag: { heightCm: 55, widthCm: 40, depthCm: 20 }, personalItem: airline.personalItem, weightLimitKg: 10 },
    ];
    expect(hasFareSpecificVariation(airline, "cabinBag")).toBe(true);
    expect(hasFareSpecificVariation(airline, "personalItem")).toBe(false);
  });

  it("treats entitlement present on one fare and absent on another as variation", () => {
    const airline = baseAirline();
    airline.fareClasses = [
      { fareClass: "Basic", cabinBag: null, personalItem: airline.personalItem, weightLimitKg: null },
      { fareClass: "Plus", cabinBag: airline.cabinBag, personalItem: airline.personalItem, weightLimitKg: 10 },
    ];
    expect(hasFareSpecificVariation(airline, "cabinBag")).toBe(true);
    expect(fareSupportsBagType(airline.fareClasses[0]!, "cabinBag")).toBe(false);
    expect(fareSupportsBagType(airline.fareClasses[1]!, "cabinBag")).toBe(true);
  });
});
