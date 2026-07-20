import { Airline } from "@/types";
import { resolveLimit } from "@/lib/fitCalculator";

export function checkerPreset(airline: Airline, bagType: "cabinBag" | "personalItem", fareClass: string | null = null) {
  return resolveLimit(airline, bagType, fareClass).limit;
}
