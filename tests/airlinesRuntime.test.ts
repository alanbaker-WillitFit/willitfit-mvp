import { describe, expect, it } from "vitest";
import { adaptAirlineRow, adaptBaggageRuleRow, mapRuntimeAirline } from "../services/airlines";

const airlineRow = adaptAirlineRow({
  "Airline ID": "AIR001",
  "Airline Name": "Example Air",
  Slug: "example-air",
  Country: "GB",
  "Baggage URL": "https://example.com/baggage",
  "Review Status": "Approved",
  "Last Reviewed": "2026-07-30",
});

describe("RC5 airline runtime mapping", () => {
  it("maps Mother-aligned checked-bag column aliases", () => {
    const rule = adaptBaggageRuleRow({
      "Rule ID": "R1",
      "Airline ID": "AIR001",
      "Fare Class": "Standard",
      "Bag Type": "Checked baggage",
      "Height cm": "80",
      "Width cm": "55",
      "Depth cm": "35",
      "Weight Limit kg": "23",
      "Review Status": "Approved",
    });

    expect(rule).toMatchObject({
      FareClass: "Standard",
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
        "Length cm": "80",
        "Width cm": "55",
        "Depth cm": "35",
        "Maximum Weight kg": "23",
        "Review Status": "Approved",
      }),
    ];

    const airline = mapRuntimeAirline(airlineRow, rules);

    expect(airline.hasCheckedBag).toBe(true);
    expect(airline.checkedBag).toEqual({ heightCm: 80, widthCm: 55, depthCm: 35 });
    expect(airline.checkedWeightLimitKg).toBe(23);
    expect(airline.fareClasses[0]).toMatchObject({
      fareClass: "Standard",
      checkedBag: { heightCm: 80, widthCm: 55, depthCm: 35 },
      checkedWeightLimitKg: 23,
    });
  });

  it("does not expose checked baggage when dimensions are incomplete", () => {
    const rules = [adaptBaggageRuleRow({
      "Rule ID": "R4",
      "Airline ID": "AIR001",
      "Bag Type": "Checked baggage",
      "Length cm": "80",
      "Width cm": "55",
      "Depth cm": "",
      "Weight kg": "23",
      "Review Status": "Approved",
    })];

    const airline = mapRuntimeAirline(airlineRow, rules);
    expect(airline.hasCheckedBag).toBe(false);
    expect(airline.checkedBag).toBeUndefined();
  });
});
