import { Airline, BagType, Dimensions } from "@/types";
import { resolveLimit } from "@/lib/fitCalculator";

export function checkerPreset(
  airline: Airline,
  bagType: BagType,
  fareClass: string | null = null
): Dimensions | null {
  const { sizingRule } = resolveLimit(airline, bagType, fareClass);
  return sizingRule.method === "fixed-dimensions" ? sizingRule.dimensions : null;
}
