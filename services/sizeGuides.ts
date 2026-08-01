import type { Airline, BagType, Dimensions } from "@/types";
import { getCachedAirlines } from "./airlines";

type GuideBagType = Extract<BagType, "personalItem" | "cabinBag" | "checkedBag">;

export interface SizeGuideAirline {
  airlineId: string;
  airlineName: string;
  slug: string;
}

export interface SizeGuideGroup {
  key: string;
  metricLabel: string;
  imperialLabel: string;
  airlineCount: number;
  airlines: SizeGuideAirline[];
}

export interface SizeGuideModel {
  bagType: GuideBagType;
  groups: SizeGuideGroup[];
  source: "sheet" | "fallback";
}

function dimensionsFor(airline: Airline, bagType: GuideBagType): Dimensions | null {
  if (bagType === "personalItem") return airline.hasPersonalItem === false ? null : airline.personalItem;
  if (bagType === "cabinBag") return airline.hasCabinBag === false ? null : airline.cabinBag;
  return airline.hasCheckedBag === false ? null : airline.checkedBag ?? null;
}

function validDimensions(value: Dimensions | null): value is Dimensions {
  return Boolean(
    value &&
      Number.isFinite(value.heightCm) && value.heightCm > 0 &&
      Number.isFinite(value.widthCm) && value.widthCm > 0 &&
      Number.isFinite(value.depthCm) && value.depthCm > 0
  );
}

function inches(cm: number): string {
  return (cm / 2.54).toFixed(1);
}

export async function getSizeGuide(bagType: GuideBagType): Promise<SizeGuideModel> {
  const { airlines, source } = await getCachedAirlines();
  const grouped = new Map<string, { dimensions: Dimensions; airlines: SizeGuideAirline[] }>();

  for (const airline of airlines) {
    const dimensions = dimensionsFor(airline, bagType);
    if (!validDimensions(dimensions) || !airline.airlineId || !airline.airlineName || !airline.slug) continue;

    const key = `${dimensions.heightCm}|${dimensions.widthCm}|${dimensions.depthCm}`;
    const current = grouped.get(key) ?? { dimensions, airlines: [] };
    if (!current.airlines.some((entry) => entry.airlineId === airline.airlineId)) {
      current.airlines.push({
        airlineId: airline.airlineId,
        airlineName: airline.airlineName,
        slug: airline.slug,
      });
    }
    grouped.set(key, current);
  }

  const groups = Array.from(grouped.entries())
    .map(([key, value]) => {
      const { heightCm, widthCm, depthCm } = value.dimensions;
      const sortedAirlines = [...value.airlines].sort((a, b) => a.airlineName.localeCompare(b.airlineName));
      return {
        key,
        metricLabel: `${heightCm} × ${widthCm} × ${depthCm} cm`,
        imperialLabel: `${inches(heightCm)} × ${inches(widthCm)} × ${inches(depthCm)} in`,
        airlineCount: sortedAirlines.length,
        airlines: sortedAirlines,
      };
    })
    .sort((a, b) => b.airlineCount - a.airlineCount || a.metricLabel.localeCompare(b.metricLabel));

  return { bagType, groups, source };
}
