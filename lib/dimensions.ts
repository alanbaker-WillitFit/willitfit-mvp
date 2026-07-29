import { Airline, BagType, Dimensions } from "@/types";

export type DimensionField = "heightCm" | "widthCm" | "depthCm";

export const MIN_BAG_DIMENSION_CM = 1;
export const MAX_BAG_DIMENSION_CM = 150;
export const DIMENSION_INPUT_PATTERN = /^\d{0,3}(?:\.\d{0,1})?$/;

export function sanitiseDimensionInput(value: string): string {
  if (/^\s*-/.test(value)) return "";
  const normalised = value.trim().replace(/,/g, ".").replace(/[^\d.]/g, "");
  const [whole = "", ...fractionParts] = normalised.split(".");
  const wholeDigits = whole.slice(0, 3);
  const fractionDigits = fractionParts.join("").slice(0, 1);
  const hadDecimalPoint = normalised.includes(".");

  if (hadDecimalPoint) return `${wholeDigits}.${fractionDigits}`;
  return wholeDigits;
}

export function normaliseDimensionOnBlur(value: string): string {
  if (value === "" || value === ".") return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return String(Math.round(numeric * 10) / 10);
}

export function dimensionError(value: string): string | null {
  if (value.trim() === "") return "Enter this measurement.";
  if (!DIMENSION_INPUT_PATTERN.test(value)) return "Use up to one decimal place.";

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "Enter a valid number.";
  if (numeric < MIN_BAG_DIMENSION_CM || numeric > MAX_BAG_DIMENSION_CM) {
    return `Enter a value between ${MIN_BAG_DIMENSION_CM}–${MAX_BAG_DIMENSION_CM} cm.`;
  }
  return null;
}

export function hasValidDimensions(
  value: Partial<Dimensions> | null | undefined
): value is Dimensions {
  return Boolean(
    value &&
      [value.heightCm, value.widthCm, value.depthCm].every(
        (dimension) =>
          typeof dimension === "number" &&
          Number.isFinite(dimension) &&
          dimension >= MIN_BAG_DIMENSION_CM &&
          dimension <= MAX_BAG_DIMENSION_CM
      )
  );
}

export function airlineHasBagType(airline: Airline, bagType: BagType): boolean {
  const explicit =
    bagType === "cabinBag"
      ? airline.hasCabinBag
      : bagType === "personalItem"
        ? airline.hasPersonalItem
        : airline.hasCheckedBag;

  return explicit ?? hasValidDimensions(airline[bagType]);
}
