import type { Airline, BagType, Dimensions } from "@/types";
import { getCachedAirlines } from "./airlines";
import { readFirstAvailableRuntimeTab, runtimePublished } from "./runtimeContent";
import { AIRLINE_TABS, BAGGAGE_RULE_TABS } from "./runtimeSources";
import { slugify, toNumber } from "./googleSheets";

type GuideBagType = Extract<BagType, "personalItem" | "cabinBag" | "checkedBag">;
type RuntimeRow = Record<string, string>;

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
  ruleType?: "fixed_dimensions" | "linear_total";
  explanatoryLabel?: string;
}

export interface SizeGuideModel {
  bagType: GuideBagType;
  groups: SizeGuideGroup[];
  source: "sheet" | "fallback";
}

function value(row: RuntimeRow, ...names: string[]): string {
  for (const name of names) {
    const candidate = String(row[name] ?? "").trim();
    if (candidate) return candidate;
  }
  return "";
}

function normalise(input: string): string {
  return input.trim().toLowerCase();
}

function dimensionsFor(airline: Airline, bagType: GuideBagType): Dimensions | null {
  if (bagType === "personalItem") return airline.hasPersonalItem === false ? null : airline.personalItem;
  if (bagType === "cabinBag") return airline.hasCabinBag === false ? null : airline.cabinBag;
  return airline.hasCheckedBag === false ? null : airline.checkedBag ?? null;
}

function validDimensions(input: Dimensions | null): input is Dimensions {
  return Boolean(
    input &&
      Number.isFinite(input.heightCm) && input.heightCm > 0 &&
      Number.isFinite(input.widthCm) && input.widthCm > 0 &&
      Number.isFinite(input.depthCm) && input.depthCm > 0
  );
}

function inches(cm: number): string {
  return (cm / 2.54).toFixed(1);
}

function sortedAirlines(airlines: SizeGuideAirline[]): SizeGuideAirline[] {
  return [...airlines].sort((a, b) => a.airlineName.localeCompare(b.airlineName));
}

function sortGroups(groups: SizeGuideGroup[]): SizeGuideGroup[] {
  return groups.sort((a, b) => b.airlineCount - a.airlineCount || a.metricLabel.localeCompare(b.metricLabel));
}

export async function getSizeGuide(bagType: GuideBagType): Promise<SizeGuideModel> {
  if (bagType === "checkedBag") return getCheckedSizeGuide();

  const { airlines, source } = await getCachedAirlines();
  const grouped = new Map<string, { dimensions: Dimensions; airlines: SizeGuideAirline[] }>();

  for (const airline of airlines) {
    const dimensions = dimensionsFor(airline, bagType);
    if (!validDimensions(dimensions) || !airline.airlineId || !airline.airlineName || !airline.slug) continue;

    const key = `${dimensions.heightCm}|${dimensions.widthCm}|${dimensions.depthCm}`;
    const current = grouped.get(key) ?? { dimensions, airlines: [] };
    if (!current.airlines.some((entry) => entry.airlineId === airline.airlineId)) {
      current.airlines.push({ airlineId: airline.airlineId, airlineName: airline.airlineName, slug: airline.slug });
    }
    grouped.set(key, current);
  }

  const groups = Array.from(grouped.entries()).map(([key, entry]) => {
    const { heightCm, widthCm, depthCm } = entry.dimensions;
    const airlinesForGroup = sortedAirlines(entry.airlines);
    return {
      key,
      metricLabel: `${heightCm} × ${widthCm} × ${depthCm} cm`,
      imperialLabel: `${inches(heightCm)} × ${inches(widthCm)} × ${inches(depthCm)} in`,
      airlineCount: airlinesForGroup.length,
      airlines: airlinesForGroup,
      ruleType: "fixed_dimensions" as const,
    };
  });

  return { bagType, groups: sortGroups(groups), source };
}

export async function getCheckedSizeGuide(): Promise<SizeGuideModel> {
  const [airlineRead, ruleRead] = await Promise.all([
    readFirstAvailableRuntimeTab<RuntimeRow>(AIRLINE_TABS),
    readFirstAvailableRuntimeTab<RuntimeRow>(BAGGAGE_RULE_TABS),
  ]);

  if (!airlineRead.rows || !ruleRead.rows) {
    const { airlines, source } = await getCachedAirlines();
    return buildCheckedFallback(airlines, source);
  }

  const airlineById = new Map<string, SizeGuideAirline>();
  for (const row of airlineRead.rows.filter(runtimePublished)) {
    const airlineId = value(row, "Airline ID", "AirlineID");
    const airlineName = value(row, "Airline Name", "AirlineName");
    if (!airlineId || !airlineName) continue;
    airlineById.set(airlineId, {
      airlineId,
      airlineName,
      slug: slugify(value(row, "Slug") || airlineName),
    });
  }

  const grouped = new Map<string, { group: Omit<SizeGuideGroup, "airlineCount" | "airlines">; airlines: SizeGuideAirline[] }>();

  for (const row of ruleRead.rows.filter(runtimePublished)) {
    const bagType = normalise(value(row, "Bag Type", "BagType"));
    if (!bagType.includes("checked") && !bagType.includes("hold") && !bagType.includes("check-in")) continue;

    const airline = airlineById.get(value(row, "Airline ID", "AirlineID"));
    if (!airline) continue;

    const linearTotal = toNumber(value(
      row,
      "Linear Total cm",
      "Linear Total Cm",
      "LinearTotalCm",
      "Maximum Linear Dimension cm",
      "Combined Dimensions cm",
      "Total Dimensions cm"
    ), NaN);

    const heightCm = toNumber(value(row, "Length cm", "Height cm", "HeightCm"), NaN);
    const widthCm = toNumber(value(row, "Width cm", "WidthCm"), NaN);
    const depthCm = toNumber(value(row, "Depth cm", "DepthCm"), NaN);

    let key = "";
    let group: Omit<SizeGuideGroup, "airlineCount" | "airlines"> | null = null;

    if (Number.isFinite(linearTotal) && linearTotal > 0) {
      key = `linear|${linearTotal}`;
      group = {
        key,
        metricLabel: `${linearTotal} cm linear total`,
        imperialLabel: `${inches(linearTotal)} in combined`,
        ruleType: "linear_total",
        explanatoryLabel: "Length + width + depth must stay within the published total.",
      };
    } else if ([heightCm, widthCm, depthCm].every((dimension) => Number.isFinite(dimension) && dimension > 0)) {
      key = `fixed|${heightCm}|${widthCm}|${depthCm}`;
      group = {
        key,
        metricLabel: `${heightCm} × ${widthCm} × ${depthCm} cm`,
        imperialLabel: `${inches(heightCm)} × ${inches(widthCm)} × ${inches(depthCm)} in`,
        ruleType: "fixed_dimensions",
      };
    }

    if (!group) continue;
    const current = grouped.get(key) ?? { group, airlines: [] };
    if (!current.airlines.some((entry) => entry.airlineId === airline.airlineId)) current.airlines.push(airline);
    grouped.set(key, current);
  }

  const groups = Array.from(grouped.values()).map(({ group, airlines }) => {
    const airlinesForGroup = sortedAirlines(airlines);
    return { ...group, airlineCount: airlinesForGroup.length, airlines: airlinesForGroup };
  });

  return { bagType: "checkedBag", groups: sortGroups(groups), source: "sheet" };
}

function buildCheckedFallback(airlines: Airline[], source: "sheet" | "fallback"): SizeGuideModel {
  const grouped = new Map<string, { dimensions: Dimensions; airlines: SizeGuideAirline[] }>();
  for (const airline of airlines) {
    const dimensions = dimensionsFor(airline, "checkedBag");
    if (!validDimensions(dimensions) || !airline.airlineId || !airline.airlineName || !airline.slug) continue;
    const key = `fixed|${dimensions.heightCm}|${dimensions.widthCm}|${dimensions.depthCm}`;
    const current = grouped.get(key) ?? { dimensions, airlines: [] };
    if (!current.airlines.some((entry) => entry.airlineId === airline.airlineId)) {
      current.airlines.push({ airlineId: airline.airlineId, airlineName: airline.airlineName, slug: airline.slug });
    }
    grouped.set(key, current);
  }

  const groups = Array.from(grouped.entries()).map(([key, entry]) => {
    const { heightCm, widthCm, depthCm } = entry.dimensions;
    const airlinesForGroup = sortedAirlines(entry.airlines);
    return {
      key,
      metricLabel: `${heightCm} × ${widthCm} × ${depthCm} cm`,
      imperialLabel: `${inches(heightCm)} × ${inches(widthCm)} × ${inches(depthCm)} in`,
      airlineCount: airlinesForGroup.length,
      airlines: airlinesForGroup,
      ruleType: "fixed_dimensions" as const,
    };
  });

  return { bagType: "checkedBag", groups: sortGroups(groups), source };
}
