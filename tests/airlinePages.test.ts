import { describe, expect, it } from "vitest";
import { selectRelatedAirlines } from "@/services/airlinePages";
import type { Airline } from "@/types";

function airline(overrides: Partial<Airline>): Airline {
  return {
    airlineId: "base",
    airlineName: "Base Air",
    slug: "base-air",
    country: "UK",
    logoUrl: "",
    personalItem: { heightCm: 40, widthCm: 30, depthCm: 20 },
    cabinBag: { heightCm: 55, widthCm: 40, depthCm: 20 },
    weightLimitKg: 10,
    fareClasses: [],
    websiteUrl: "https://example.com",
    lastUpdated: "2026-07-10",
    status: "Live",
    ...overrides,
  };
}

describe("selectRelatedAirlines", () => {
  it("excludes the current airline", () => {
    const current = airline({ airlineId: "a" });
    expect(selectRelatedAirlines(current, [current])).toEqual([]);
  });

  it("prefers airlines from the same country", () => {
    const current = airline({ airlineId: "a", country: "UK" });
    const sameCountry = airline({ airlineId: "b", airlineName: "Same", slug: "same", country: "UK" });
    const other = airline({ airlineId: "c", airlineName: "Other", slug: "other", country: "FR" });
    expect(selectRelatedAirlines(current, [other, sameCountry], 1)[0]?.airlineId).toBe("b");
  });

  it("respects the requested result limit", () => {
    const current = airline({ airlineId: "a" });
    const candidates = ["b", "c", "d"].map((id) => airline({ airlineId: id, airlineName: id, slug: id }));
    expect(selectRelatedAirlines(current, candidates, 2)).toHaveLength(2);
  });
});
