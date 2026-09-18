import { Airline, BagType, Dimensions } from "@/types";
import { resolveLimit } from "@/lib/fitCalculator";
import { hasFareSpecificVariation } from "@/lib/allowanceSemantics";

export function checkerPreset(
  airline: Airline,
  bagType: BagType,
  fareClass: string | null = null
): Dimensions | null {
  if (!fareClass && hasFareSpecificVariation(airline, bagType)) return null;
  try {
    const { sizingRule } = resolveLimit(airline, bagType, fareClass);
    return sizingRule.method === "fixed-dimensions" ? sizingRule.dimensions : null;
  } catch {
    return null;
  }
}
