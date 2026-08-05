import type { Airline, BagType, Dimensions } from "@/types";
import { getAirlines, sortAirlinesByPriority } from "./airlines";
import { hasValidDimensions } from "@/lib/dimensions";

export type SizeGuideKind = "personal-item" | "cabin-bag" | "checked-bag";

export interface SizeGuideGroup {
  key: string;
  dimensions: Dimensions;
  airlines: Airline[];
}

export interface CheckedGuideSupplement {
  linearTotals: Array<{ key: string; limitCm: number; operator: "lt" | "lte"; airlines: Airline[] }>;
  weightOnlyAirlines: Airline[];
}

export interface SizeGuideData {
  kind: SizeGuideKind;
  bagType: BagType;
  groups: SizeGuideGroup[];
  checkedSupplement: CheckedGuideSupplement | null;
  source: "sheet" | "fallback";
}

export const SIZE_GUIDE_CONFIG: Record<SizeGuideKind, {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  checkerLabel: string;
}> = {
  "personal-item": {
    title: "Personal Item Size Guide",
    description: "Compare published under-seat and personal-item dimensions across supported airlines.",
    image: "/assets/icons/personal-item-measurement-rc4.jpg",
    imageAlt: "White personal item bag with measurement arrows",
    checkerLabel: "Check my Personal Item",
  },
  "cabin-bag": {
    title: "Cabin Bag Size Guide",
    description: "Compare common published cabin-bag dimensions and see which airlines use each allowance.",
    image: "/assets/icons/cabin-bag-measurement-rc4.jpg",
    imageAlt: "White cabin bag with measurement arrows",
    checkerLabel: "Check my Cabin Bag",
  },
  "checked-bag": {
    title: "Checked Bag Size Guide",
    description: "Compare fixed checked-bag dimensions, linear-total rules and weight-only policies.",
    image: "/assets/icons/cabin-bag-measurement-rc4.jpg",
    imageAlt: "White checked bag with measurement arrows",
    checkerLabel: "Check my Checked Bag",
  },
};

function guideBagType(kind: SizeGuideKind): BagType {
  if (kind === "personal-item") return "personalItem";
  if (kind === "cabin-bag") return "cabinBag";
  return "checkedBag";
}

function fixedDimensions(airline: Airline, kind: SizeGuideKind): Dimensions | null {
  if (kind === "personal-item") return hasValidDimensions(airline.personalItem) ? airline.personalItem : null;
  if (kind === "cabin-bag") return hasValidDimensions(airline.cabinBag) ? airline.cabinBag : null;
  if (airline.checkedBag?.method !== "fixed-dimensions") return null;
  return airline.checkedBag.dimensions;
}

function dimensionKey(dimensions: Dimensions): string {
  return `${dimensions.heightCm}x${dimensions.widthCm}x${dimensions.depthCm}`;
}

function groupFixedDimensions(airlines: Airline[], kind: SizeGuideKind): SizeGuideGroup[] {
  const groups = new Map<string, SizeGuideGroup>();

  for (const airline of airlines) {
    const dimensions = fixedDimensions(airline, kind);
    if (!dimensions) continue;
    const key = dimensionKey(dimensions);
    const existing = groups.get(key);
    if (existing) existing.airlines.push(airline);
    else groups.set(key, { key, dimensions, airlines: [airline] });
  }

  return Array.from(groups.values())
    .map((group) => ({ ...group, airlines: sortAirlinesByPriority(group.airlines) }))
    .sort((left, right) =>
      right.airlines.length - left.airlines.length ||
      left.dimensions.heightCm - right.dimensions.heightCm ||
      left.dimensions.widthCm - right.dimensions.widthCm ||
      left.dimensions.depthCm - right.dimensions.depthCm
    );
}

function checkedSupplement(airlines: Airline[]): CheckedGuideSupplement {
  const linear = new Map<string, { key: string; limitCm: number; operator: "lt" | "lte"; airlines: Airline[] }>();
  const weightOnlyAirlines: Airline[] = [];

  for (const airline of airlines) {
    const rule = airline.checkedBag;
    if (rule?.method === "linear-total") {
      const key = `${rule.operator}-${rule.linearLimitCm}`;
      const existing = linear.get(key);
      if (existing) existing.airlines.push(airline);
      else linear.set(key, { key, limitCm: rule.linearLimitCm, operator: rule.operator, airlines: [airline] });
    } else if (rule?.method === "weight-only") {
      weightOnlyAirlines.push(airline);
    }
  }

  return {
    linearTotals: Array.from(linear.values())
      .map((group) => ({ ...group, airlines: sortAirlinesByPriority(group.airlines) }))
      .sort((left, right) => right.airlines.length - left.airlines.length || left.limitCm - right.limitCm),
    weightOnlyAirlines: sortAirlinesByPriority(weightOnlyAirlines),
  };
}

export async function getSizeGuide(kind: SizeGuideKind): Promise<SizeGuideData> {
  const { airlines, source } = await getAirlines();
  return {
    kind,
    bagType: guideBagType(kind),
    groups: groupFixedDimensions(airlines, kind),
    checkedSupplement: kind === "checked-bag" ? checkedSupplement(airlines) : null,
    source,
  };
}
