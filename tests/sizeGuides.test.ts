import { afterEach, describe, expect, it, vi } from "vitest";
import type { Airline } from "../types";
import { getSizeGuide } from "../services/sizeGuides";
import * as airlineService from "../services/airlines";

function airline(overrides: Partial<Airline>): Airline {
  return {
    airlineId: "base",
    airlineName: "Base Air",
    slug: "base-air",
    country: "GB",
    logoUrl: "",
    personalItem: { heightCm: 40, widthCm: 30, depthCm: 20 },
    cabinBag: { heightCm: 55, widthCm: 40, depthCm: 20 },
    weightLimitKg: null,
    fareClasses: [],
    websiteUrl: "",
    lastUpdated: "",
    status: "Live",
    searchPriority: 10,
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("size guide grouping", () => {
  it("groups exact cabin dimensions and keeps priority ordering", async () => {
    vi.spyOn(airlineService, "getAirlines").mockResolvedValue({
      source: "sheet",
      airlines: [
        airline({ airlineId: "b", airlineName: "Bravo", slug: "bravo", searchPriority: 2 }),
        airline({ airlineId: "a", airlineName: "Alpha", slug: "alpha", searchPriority: 1 }),
        airline({ airlineId: "c", airlineName: "Charlie", slug: "charlie", cabinBag: { heightCm: 56, widthCm: 45, depthCm: 25 } }),
      ],
    });

    const guide = await getSizeGuide("cabin-bag");
    expect(guide.groups).toHaveLength(2);
    expect(guide.groups[0]!.airlines.map((item) => item.airlineName)).toEqual(["Alpha", "Bravo"]);
  });

  it("separates checked fixed, linear-total and weight-only rules", async () => {
    vi.spyOn(airlineService, "getAirlines").mockResolvedValue({
      source: "sheet",
      airlines: [
        airline({ airlineId: "fixed", airlineName: "Fixed", slug: "fixed", checkedBag: { method: "fixed-dimensions", dimensions: { heightCm: 80, widthCm: 55, depthCm: 35 } }, checkedWeightLimitKg: 23, hasCheckedBag: true }),
        airline({ airlineId: "linear", airlineName: "Linear", slug: "linear", checkedBag: { method: "linear-total", linearLimitCm: 158, operator: "lte" }, checkedWeightLimitKg: 23, hasCheckedBag: true }),
        airline({ airlineId: "weight", airlineName: "Weight", slug: "weight", checkedBag: { method: "weight-only" }, checkedWeightLimitKg: 20, hasCheckedBag: true }),
      ],
    });

    const guide = await getSizeGuide("checked-bag");
    expect(guide.groups).toHaveLength(1);
    expect(guide.checkedSupplement?.linearTotals).toHaveLength(1);
    expect(guide.checkedSupplement?.weightOnlyAirlines.map((item) => item.airlineName)).toEqual(["Weight"]);
  });
});
