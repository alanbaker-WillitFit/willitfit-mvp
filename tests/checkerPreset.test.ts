import { describe, expect, it } from "vitest";
import { checkerPreset } from "@/lib/checkerPreset";
import { Airline } from "@/types";

const first: Airline = {
  airlineId: "first", airlineName: "First Air", slug: "first-air", country: "GB", logoUrl: "",
  cabinBag: { heightCm: 55, widthCm: 40, depthCm: 20 }, personalItem: { heightCm: 40, widthCm: 30, depthCm: 15 }, weightLimitKg: 10,
  fareClasses: [{ fareClass: "Plus", cabinBag: { heightCm: 60, widthCm: 45, depthCm: 25 }, personalItem: { heightCm: 45, widthCm: 35, depthCm: 20 }, weightLimitKg: 12 }],
  notes: "", websiteUrl: "", lastUpdated: "2026-07-20", status: "Live",
};
const second: Airline = { ...first, airlineId: "second", airlineName: "Second Air", slug: "second-air", cabinBag: { heightCm: 50, widthCm: 35, depthCm: 18 } };

describe("checker allowance presets", () => {
  it("loads the newly selected airline allowance", () => {
    expect(checkerPreset(second, "cabinBag")).toEqual({ heightCm: 50, widthCm: 35, depthCm: 18 });
  });
  it("loads the newly selected bag-type allowance", () => {
    expect(checkerPreset(first, "personalItem")).toEqual({ heightCm: 40, widthCm: 30, depthCm: 15 });
  });
  it("loads the selected fare allowance", () => {
    expect(checkerPreset(first, "cabinBag", "Plus")).toEqual({ heightCm: 60, widthCm: 45, depthCm: 25 });
  });
});
