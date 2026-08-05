import { describe, expect, it } from "vitest";
import { checkFit, resolveLimit } from "../lib/fitCalculator";
import type { Airline } from "../types";

const checkedBagDimensions = {
  heightCm: 80,
  widthCm: 55,
  depthCm: 35,
};

const priorityCheckedBagDimensions = {
  heightCm: 85,
  widthCm: 60,
  depthCm: 40,
};

const airline: Airline = {
  airlineId: "test",
  airlineName: "Test Air",
  slug: "test-air",
  country: "GB",
  logoUrl: "",
  cabinBag: {
    heightCm: 55,
    widthCm: 40,
    depthCm: 20,
  },
  personalItem: {
    heightCm: 40,
    widthCm: 25,
    depthCm: 20,
  },
  checkedBag: {
    method: "fixed-dimensions",
    dimensions: checkedBagDimensions,
  },
  weightLimitKg: 10,
  checkedWeightLimitKg: 23,
  fareClasses: [
    {
      fareClass: "Priority",
      cabinBag: {
        heightCm: 56,
        widthCm: 45,
        depthCm: 25,
      },
      personalItem: null,
      checkedBag: {
        method: "fixed-dimensions",
        dimensions: priorityCheckedBagDimensions,
      },
      weightLimitKg: 12,
      checkedWeightLimitKg: 32,
    },
  ],
  websiteUrl: "https://example.com",
  lastUpdated: "2026-07-10",
  status: "Live",
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

  it("checks a published checked-bag allowance", () => {
    const result = checkFit(checkedBagDimensions, airline, "checkedBag");
    expect(result.verdict).toBe("fits");
    expect(result.sizingRule).toEqual(airline.checkedBag);
    expect(result.limit).toEqual(checkedBagDimensions);
    expect(result.weightLimitKg).toBe(23);
  });

  it("fails the overall result when checked-bag weight exceeds the limit", () => {
    const result = checkFit(checkedBagDimensions, airline, "checkedBag", null, 23.1);
    expect(result.verdict).toBe("no-fit");
    expect(result.weightVerdict).toBe("no-fit");
  });

  it("passes checked-bag weight at the exact published limit", () => {
    const result = checkFit(checkedBagDimensions, airline, "checkedBag", null, 23);
    expect(result.verdict).toBe("fits");
    expect(result.weightVerdict).toBe("fits");
  });

  it("reports weight as not checked when no user weight is supplied", () => {
    const result = checkFit(checkedBagDimensions, airline, "checkedBag");
    expect(result.weightVerdict).toBe("not-checked");
  });

  it("reports weight as not published when the airline has no checked limit", () => {
    const withoutCheckedWeight: Airline = { ...airline, checkedWeightLimitKg: null };
    const result = checkFit(checkedBagDimensions, withoutCheckedWeight, "checkedBag", null, 20);
    expect(result.verdict).toBe("fits");
    expect(result.weightVerdict).toBe("not-published");
  });

  it("uses a complete selected fare allowance", () => {
    expect(resolveLimit(airline, "cabinBag", "Priority").fareClass).toBe("Priority");
  });

  it("uses checked-bag dimensions and weight from the selected fare", () => {
    const result = resolveLimit(airline, "checkedBag", "Priority");
    expect(result.fareClass).toBe("Priority");
    expect(result.sizingRule).toEqual(airline.fareClasses[0]!.checkedBag);
    expect(result.weightLimitKg).toBe(32);
  });

  it("falls back when the selected fare has no allowance for that bag type", () => {
    const result = resolveLimit(airline, "personalItem", "Priority");
    expect(result.fareClass).toBeNull();
    expect(result.sizingRule).toEqual({ method: "fixed-dimensions", dimensions: airline.personalItem });
  });

  it("uses a weight-only rule when checked dimensions are not published", () => {
    const weightOnlyAirline: Airline = {
      ...airline,
      checkedBag: undefined,
      hasCheckedBag: false,
      checkedWeightLimitKg: 20,
      fareClasses: [],
    };

    const result = checkFit(
      { heightCm: 70, widthCm: 50, depthCm: 30 },
      weightOnlyAirline,
      "checkedBag",
      null,
      19
    );

    expect(result.sizingRule).toEqual({ method: "weight-only" });
    expect(result.limit).toBeNull();
    expect(result.weightVerdict).toBe("fits");
    expect(result.verdict).toBe("fits");
  });

  it("fails a weight-only result when the entered weight is over the limit", () => {
    const weightOnlyAirline: Airline = {
      ...airline,
      checkedBag: undefined,
      hasCheckedBag: false,
      checkedWeightLimitKg: 20,
      fareClasses: [],
    };

    const result = checkFit(
      { heightCm: 70, widthCm: 50, depthCm: 30 },
      weightOnlyAirline,
      "checkedBag",
      null,
      20.1
    );

    expect(result.weightVerdict).toBe("no-fit");
    expect(result.verdict).toBe("no-fit");
  });

  it("throws clearly when neither checked dimensions nor weight are available", () => {
    const withoutCheckedBag: Airline = {
      ...airline,
      checkedBag: undefined,
      checkedWeightLimitKg: null,
      hasCheckedBag: false,
    };

    expect(() => resolveLimit(withoutCheckedBag, "checkedBag")).toThrow("No valid checkedBag allowance");
  });
});
