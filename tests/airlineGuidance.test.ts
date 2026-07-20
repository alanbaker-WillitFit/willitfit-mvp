import { describe, expect, it } from "vitest";
import { buildAirlineGuidance } from "@/components/AirlineGuidance";
import type { Airline, TravelTip } from "@/types";

const airline: Airline = {
  airlineId: "a1", airlineName: "Test Air", slug: "test-air", country: "GB", logoUrl: "",
  personalItem: { heightCm: 40, widthCm: 30, depthCm: 20 },
  cabinBag: { heightCm: 55, widthCm: 40, depthCm: 20 }, weightLimitKg: 10,
  fareClasses: [
    { fareClass: "Basic", cabinBag: null, personalItem: { heightCm: 40, widthCm: 30, depthCm: 20 }, weightLimitKg: null },
    { fareClass: "Plus", cabinBag: { heightCm: 55, widthCm: 40, depthCm: 20 }, personalItem: { heightCm: 40, widthCm: 30, depthCm: 20 }, weightLimitKg: 10 },
  ],
  websiteUrl: "https://example.com", lastUpdated: "2026-07-01", status: "Live", notes: "Check your booking.",
};

const tip: TravelTip = { tipId: "t1", title: "Pack carefully", slug: "pack-carefully", content: "Keep soft items away from external pockets.", category: "Packing", seoKeyword: "", cta: "", status: "Live" };

describe("buildAirlineGuidance", () => {
  it("includes airline notes, fare guidance and contextual tips", () => {
    const result = buildAirlineGuidance(airline, [tip]);
    expect(result).toContain("Check your booking.");
    expect(result.some((item) => item.includes("varies by fare"))).toBe(true);
    expect(result).toContain(tip.content);
  });

  it("deduplicates repeated guidance", () => {
    const duplicateTip = { ...tip, content: airline.notes ?? "" };
    const result = buildAirlineGuidance(airline, [duplicateTip]);
    expect(result.filter((item) => item === airline.notes)).toHaveLength(1);
  });
});
