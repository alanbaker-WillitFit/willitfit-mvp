import { describe, expect, it } from "vitest";
import {
  adaptAirlineRow,
  adaptBaggageRuleRow,
  mapRuntimeAirline,
  normaliseSearchPriority,
  sortAirlinesByPriority,
} from "../services/airlines";
import type { Airline } from "../types";

const airlineRow = adaptAirlineRow({
  "Airline ID": "AIR001",
  "Airline Name": "Example Air",
  "IATA Code": "EA",
  "Search Terms": "Example Airways, ExampleAir",
  Slug: "example-air",
  Country: "GB",
  "Baggage URL": "https://example.com/baggage",
  "Review Status": "Approved",
  "Last Reviewed": "2026-07-30",
  "Search Priority": "3",
});

describe("RC5 airline runtime mapping", () => {
  it("maps Mother-aligned checked-bag column aliases", () => {
    const rule = adaptBaggageRuleRow({
      "Rule ID": "R1",
      "Airline ID": "AIR001",
      "Fare Class": "Standard",
      "Bag Type": "Checked baggage",
      "Sizing Method": "Fixed Dimensions",
      "Height cm": "80",
      "Width cm": "55",
      "Depth cm": "35",
      "Weight Limit kg": "23",
      "Review Status": "Approved",
    });

    expect(rule).toMatchObject({
      FareClass: "Standard",
      SizingMethod: "Fixed Dimensions",
      HeightCm: "80",
      WidthCm: "55",
      DepthCm: "35",
      WeightKg: "23",
      Status: "Live",
    });
  });

  it("publishes checked dimensions and weight into the airline model", () => {
    const rules = [
      adaptBaggageRuleRow({
        "Rule ID": "R1",
        "Airline ID": "AIR001",
        Fare: "Standard",
        "Bag Type": "Personal item",
        "Length cm": "40",
        "Width cm": "25",
        "Depth cm": "20",
        "Review Status": "Approved",
      }),
      adaptBaggageRuleRow({
        "Rule ID": "R2",
        "Airline ID": "AIR001",
        Fare: "Standard",
        "Bag Type": "Cabin bag",
        "Length cm": "55",
        "Width cm": "40",
        "Depth cm": "20",
        "Weight kg": "10",
        "Review Status": "Approved",
      }),
      adaptBaggageRuleRow({
        "Rule ID": "R3",
        "Airline ID": "AIR001",
        Fare: "Standard",
        "Bag Type": "Hold luggage",
        "Sizing Method": "Fixed Dimensions",
        "Length cm": "80",
        "Width cm": "55",
        "Depth cm": "35",
        "Maximum Weight kg": "23",
        "Review Status": "Approved",
      }),
    ];

    const airline = mapRuntimeAirline(airlineRow, rules);

    expect(airline.hasCheckedBag).toBe(true);
    expect(airline.checkedBag).toEqual({
      method: "fixed-dimensions",
      dimensions: { heightCm: 80, widthCm: 55, depthCm: 35 },
    });
    expect(airline.checkedWeightLimitKg).toBe(23);
    expect(airline.searchPriority).toBe(3);
    expect(airline.iataCode).toBe("EA");
    expect(airline.searchTerms).toEqual(expect.arrayContaining(["Example Air", "EA", "Example Airways", "ExampleAir"]));

    expect(airline.fareClasses[0]).toMatchObject({
      fareClass: "Standard",
      checkedBag: {
        method: "fixed-dimensions",
        dimensions: { heightCm: 80, widthCm: 55, depthCm: 35 },
      },
      checkedWeightLimitKg: 23,
    });
  });

  it("publishes a governed weight-only checked rule", () => {
    const rules = [
      adaptBaggageRuleRow({
        "Rule ID": "R-WEIGHT",
        "Airline ID": "AIR001",
        "Bag Type": "Checked baggage",
        "Weight kg": "20",
        "Review Status": "Approved",
      }),
    ];

    const airline = mapRuntimeAirline(airlineRow, rules);

    expect(airline.hasCheckedBag).toBe(true);
    expect(airline.checkedBag).toEqual({ method: "weight-only" });
    expect(airline.checkedWeightLimitKg).toBe(20);
  });

  it("does not reinterpret an incomplete fixed-dimension rule as weight-only", () => {
    const rules = [
      adaptBaggageRuleRow({
        "Rule ID": "R4",
        "Airline ID": "AIR001",
        "Bag Type": "Checked baggage",
        "Sizing Method": "Fixed Dimensions",
        "Length cm": "80",
        "Width cm": "55",
        "Depth cm": "",
        "Weight kg": "23",
        "Review Status": "Approved",
      }),
    ];

    const airline = mapRuntimeAirline(airlineRow, rules);

    expect(airline.hasCheckedBag).toBe(false);
    expect(airline.checkedBag).toBeUndefined();
  });

  it("normalises invalid priority values to ten", () => {
    expect(normaliseSearchPriority("1")).toBe(1);
    expect(normaliseSearchPriority("9")).toBe(9);
    expect(normaliseSearchPriority("10")).toBe(10);
    expect(normaliseSearchPriority("0")).toBe(10);
    expect(normaliseSearchPriority("11")).toBe(10);
    expect(normaliseSearchPriority("")).toBe(10);
  });

  it("sorts priority one through nine before default priority ten", () => {
    const base: Airline = {
      airlineId: "x",
      airlineName: "Zulu Air",
      slug: "zulu-air",
      country: "GB",
      logoUrl: "",
      cabinBag: { heightCm: 55, widthCm: 40, depthCm: 20 },
      personalItem: { heightCm: 40, widthCm: 25, depthCm: 20 },
      weightLimitKg: null,
      fareClasses: [],
      websiteUrl: "",
      lastUpdated: "",
      status: "Live",
    };

    const sorted = sortAirlinesByPriority([
      { ...base, airlineId: "z", airlineName: "Zulu Air", searchPriority: 10 },
      { ...base, airlineId: "b", airlineName: "Bravo Air", searchPriority: 2 },
      { ...base, airlineId: "a", airlineName: "Alpha Air", searchPriority: 1 },
      { ...base, airlineId: "c", airlineName: "Charlie Air", searchPriority: 10 },
    ]);

    expect(sorted.map((airline) => airline.airlineName)).toEqual([
      "Alpha Air",
      "Bravo Air",
      "Charlie Air",
      "Zulu Air",
    ]);
  });
});
