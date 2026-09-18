import type { Airline, BagType, BaggageSizingRule, Dimensions, FareClassAllowance } from "@/types";
import { hasValidDimensions } from "@/lib/dimensions";

function dimensionsSignature(value: Dimensions | null | undefined): string {
  return value && hasValidDimensions(value)
    ? `${value.heightCm}x${value.widthCm}x${value.depthCm}`
    : "none";
}

function checkedRuleSignature(rule: BaggageSizingRule | null | undefined): string {
  if (!rule) return "none";
  if (rule.method === "fixed-dimensions") return `fixed:${dimensionsSignature(rule.dimensions)}`;
  if (rule.method === "linear-total") return `linear:${rule.operator}:${rule.linearLimitCm}`;
  return "weight-only";
}

function fareSignature(fare: FareClassAllowance, bagType: BagType): string {
  if (bagType === "checkedBag") {
    const weight = fare.checkedWeightLimitKg ?? null;
    const supports = Boolean(fare.checkedBag || weight !== null);
    return supports ? `${checkedRuleSignature(fare.checkedBag)}|w:${weight ?? "none"}` : "unavailable";
  }

  const dims = fare[bagType];
  const supports = Boolean(dims && hasValidDimensions(dims));
  if (!supports) return "unavailable";
  return bagType === "cabinBag"
    ? `${dimensionsSignature(dims)}|w:${fare.weightLimitKg ?? "none"}`
    : dimensionsSignature(dims);
}

export function hasFareSpecificVariation(airline: Airline, bagType: BagType): boolean {
  if (airline.fareClasses.length < 2) return false;
  return new Set(airline.fareClasses.map((fare) => fareSignature(fare, bagType))).size > 1;
}

export function fareSupportsBagType(fare: FareClassAllowance, bagType: BagType): boolean {
  if (bagType === "checkedBag") {
    return Boolean(fare.checkedBag || fare.checkedWeightLimitKg !== null);
  }
  return Boolean(fare[bagType] && hasValidDimensions(fare[bagType]));
}

export function universalWeightLimitKg(airline: Airline, bagType: BagType): number | null {
  if (hasFareSpecificVariation(airline, bagType)) return null;
  if (bagType === "checkedBag") return airline.checkedWeightLimitKg ?? null;
  if (bagType === "cabinBag") return airline.weightLimitKg;
  return null;
}
