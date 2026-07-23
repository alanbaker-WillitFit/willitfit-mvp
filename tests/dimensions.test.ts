import { describe, expect, it } from "vitest";
import {
  dimensionError,
  normaliseDimensionOnBlur,
  sanitiseDimensionInput,
  airlineHasBagType,
} from "../lib/dimensions";
import type { Airline } from "@/types";

describe("sanitiseDimensionInput", () => {
  it.each([
    ["55", "55"],
    ["55.5", "55.5"],
    ["55,5", "55.5"],
    [" 55 cm ", "55"],
    ["1.2.3", "1.2"],
    ["1234", "123"],
    ["55.55", "55.5"],
    ["abc", ""],
    ["-1", ""],
  ])("normalises %s to %s", (input, expected) => {
    expect(sanitiseDimensionInput(input)).toBe(expected);
  });
});

describe("normaliseDimensionOnBlur", () => {
  it.each([
    ["55.", "55"],
    ["055", "55"],
    ["55.0", "55"],
    ["55.5", "55.5"],
    ["", ""],
    [".", ""],
  ])("normalises %s to %s", (input, expected) => {
    expect(normaliseDimensionOnBlur(input)).toBe(expected);
  });
});

describe("dimensionError", () => {
  it("requires a value", () => {
    expect(dimensionError("")).toBe("Enter this measurement.");
  });

  it.each(["1", "55", "150", "55.5"])("accepts %s", (value) => {
    expect(dimensionError(value)).toBeNull();
  });

  it.each(["0", "0.5", "150.1"])("rejects out-of-range value %s", (value) => {
    expect(dimensionError(value)).toContain("between 1–150 cm");
  });
});

describe("partial baggage availability", () => {
  const airline = {
    cabinBag: { heightCm: 55, widthCm: 40, depthCm: 20 },
    personalItem: { heightCm: 0, widthCm: 0, depthCm: 0 },
    hasCabinBag: true,
    hasPersonalItem: false,
  } as Airline;

  it("keeps the complete type available without treating the missing type as data", () => {
    expect(airlineHasBagType(airline, "cabinBag")).toBe(true);
    expect(airlineHasBagType(airline, "personalItem")).toBe(false);
  });
});
