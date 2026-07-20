import { describe, expect, it } from "vitest";
import { checkFit, resolveLimit } from "../lib/fitCalculator";
import type { Airline } from "../types";

const airline: Airline = {
  airlineId: "test", airlineName: "Test Air", slug: "test-air", country: "GB", logoUrl: "",
  cabinBag: { heightCm: 55, widthCm: 40, depthCm: 20 },
  personalItem: { heightCm: 40, widthCm: 25, depthCm: 20 },
  weightLimitKg: 10,
  fareClasses: [{
    fareClass: "Priority",
    cabinBag: { heightCm: 56, widthCm: 45, depthCm: 25 },
    personalItem: null,
    weightLimitKg: 12,
  }],
  websiteUrl: "https://example.com", lastUpdated: "2026-07-10", status: "Live",
};

describe("checkFit", () => {
  it("passes an exact fit", () => {
    expect(checkFit({ heightCm: 55, widthCm: 40, depthCm: 20 }, airline, "cabinBag").verdict).toBe("fits");
  });
  it("accepts a rotated bag", () => {
    expect(checkFit({ heightCm: 40, widthCm: 55, depthCm: 20 }, airline, "cabinBag").verdict).toBe("fits");
  });
  it("marks up to 2 cm over as close", () => {
    expect(checkFit({ heightCm: 57, widthCm: 40, depthCm: 20 }, airline, "cabinBag").verdict).toBe("close");
  });
  it("rejects more than 2 cm over", () => {
    expect(checkFit({ heightCm: 57.1, widthCm: 40, depthCm: 20 }, airline, "cabinBag").verdict).toBe("no-fit");
  });
  it("does not falsely pass a three-digit dimension", () => {
    expect(checkFit({ heightCm: 100, widthCm: 40, depthCm: 20 }, airline, "cabinBag").verdict).toBe("no-fit");
  });
  it("uses a complete selected fare allowance", () => {
    expect(resolveLimit(airline, "cabinBag", "Priority").fareClass).toBe("Priority");
  });
  it("falls back when the selected fare has no allowance for that bag type", () => {
    const result = resolveLimit(airline, "personalItem", "Priority");
    expect(result.fareClass).toBeNull();
    expect(result.limit).toEqual(airline.personalItem);
  });
});
