import { Airline, FareClassAllowance, Dimensions, SheetStatus } from "@/types";
import { cache } from "react";
import { hasValidDimensions } from "@/lib/dimensions";
import { getSheetRows, toNumber, slugify } from "./googleSheets";
import { FALLBACK_AIRLINES } from "@/data/fallback";

type AirlineRow = {
  AirlineID: string; AirlineName: string; Slug: string; Country: string;
  AirlineType: string; OfficialBaggageURL: string; Status: string;
  LastChecked: string; Notes: string;
};

type BaggageRuleRow = {
  RuleID: string; AirlineID: string; FareClass: string; BagType: string;
  IncludedInFare: string; HeightCm: string; WidthCm: string; DepthCm: string;
  WeightKg: string; Quantity: string; Storage: string; PriorityAllowed: string;
  PaidUpgradeRequired?: string; Status?: string; Notes?: string;
};

function normalise(value: string | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

export function parseStatus(value: string | undefined): SheetStatus {
  const status = normalise(value);
  if (status === "live" || status === "active" || status === "approved" || status === "published") return "Live";
  if (status === "archived" || status === "inactive" || status === "retired") return "Archived";
  return "Draft";
}

function isLiveRule(rule: BaggageRuleRow): boolean {
  return parseStatus(rule.Status) === "Live";
}

function isCabinBag(rule: BaggageRuleRow): boolean {
  return normalise(rule.BagType).includes("cabin");
}

function isPersonalItem(rule: BaggageRuleRow): boolean {
  const bagType = normalise(rule.BagType);
  return bagType.includes("personal") || bagType.includes("underseat") || bagType.includes("handbag");
}

function toDimensions(rule: BaggageRuleRow | undefined): Dimensions | null {
  if (!rule) return null;
  const dimensions = {
    heightCm: toNumber(rule.HeightCm, NaN),
    widthCm: toNumber(rule.WidthCm, NaN),
    depthCm: toNumber(rule.DepthCm, NaN),
  };
  return hasValidDimensions(dimensions) ? dimensions : null;
}

function toWeight(rule: BaggageRuleRow | undefined): number | null {
  if (!rule?.WeightKg) return null;
  const weight = toNumber(rule.WeightKg, NaN);
  return Number.isFinite(weight) && weight > 0 ? weight : null;
}

function selectBaseline(rules: BaggageRuleRow[]): Dimensions {
  const candidates = rules
    .map((rule) => ({ rule, dimensions: toDimensions(rule) }))
    .filter((entry): entry is { rule: BaggageRuleRow; dimensions: Dimensions } => entry.dimensions !== null);

  if (candidates.length === 0) return { heightCm: 0, widthCm: 0, depthCm: 0 };

  // Select one real published allowance rather than combining axes from different rows.
  candidates.sort((a, b) => {
    const av = a.dimensions.heightCm * a.dimensions.widthCm * a.dimensions.depthCm;
    const bv = b.dimensions.heightCm * b.dimensions.widthCm * b.dimensions.depthCm;
    if (av !== bv) return av - bv;
    const at = [a.dimensions.heightCm, a.dimensions.widthCm, a.dimensions.depthCm].sort((x, y) => x - y);
    const bt = [b.dimensions.heightCm, b.dimensions.widthCm, b.dimensions.depthCm].sort((x, y) => x - y);
    return at[0]! - bt[0]! || at[1]! - bt[1]! || at[2]! - bt[2]!;
  });

  return candidates[0]!.dimensions;
}

function minWeight(rules: BaggageRuleRow[]): number | null {
  const weights = rules.map((r) => toNumber(r.WeightKg, NaN)).filter((n) => Number.isFinite(n) && n > 0);
  return weights.length > 0 ? Math.min(...weights) : null;
}

function buildFareClasses(rules: BaggageRuleRow[]): FareClassAllowance[] {
  const fareClassNames = new Set(
    rules.map((r) => r.FareClass?.trim()).filter((v): v is string => Boolean(v))
  );

  return Array.from(fareClassNames).map((fareClass) => {
    const classRules = rules.filter((r) => r.FareClass?.trim() === fareClass);
    const cabinRule = classRules.find(isCabinBag);
    const personalRule = classRules.find(isPersonalItem);
    return {
      fareClass,
      cabinBag: toDimensions(cabinRule),
      personalItem: toDimensions(personalRule),
      weightLimitKg: toWeight(cabinRule),
    };
  });
}

function isHttpsUrl(value: string): boolean {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

function duplicateValues(values: string[]): Set<string> {
  const seen = new Set<string>(); const duplicates = new Set<string>();
  for (const value of values) { if (seen.has(value)) duplicates.add(value); else seen.add(value); }
  return duplicates;
}

function mapRows(airline: AirlineRow, baggageRows: BaggageRuleRow[]): Airline {
  const airlineId = airline.AirlineID.trim();
  const airlineRules = baggageRows.filter((rule) => rule.AirlineID.trim() === airlineId && isLiveRule(rule));
  const cabinRules = airlineRules.filter(isCabinBag);
  const personalRules = airlineRules.filter(isPersonalItem);

  return {
    airlineId,
    airlineName: airline.AirlineName.trim(),
    slug: slugify(airline.Slug || airline.AirlineName),
    country: airline.Country?.trim() || "",
    logoUrl: "",
    personalItem: selectBaseline(personalRules),
    cabinBag: selectBaseline(cabinRules),
    weightLimitKg: minWeight(cabinRules),
    fareClasses: buildFareClasses(airlineRules),
    websiteUrl: isHttpsUrl(airline.OfficialBaggageURL) ? airline.OfficialBaggageURL.trim() : "",
    lastUpdated: airline.LastChecked?.trim() || "",
    status: parseStatus(airline.Status),
    notes: airline.Notes?.trim() || "",
  };
}

export async function getAirlines(): Promise<{ airlines: Airline[]; source: "sheet" | "fallback" }> {
  const [airlineRows, baggageRows] = await Promise.all([
    getSheetRows<AirlineRow>("01_Airlines"),
    getSheetRows<BaggageRuleRow>("02_Baggage_Rules"),
  ]);

  if (!airlineRows || !baggageRows || airlineRows.length === 0 || baggageRows.length === 0) {
    return { airlines: FALLBACK_AIRLINES, source: "fallback" };
  }

  const liveRows = airlineRows.filter((a) => a.AirlineID?.trim() && a.AirlineName?.trim() && parseStatus(a.Status) === "Live");
  const duplicateIds = duplicateValues(liveRows.map((a) => a.AirlineID.trim()));
  const duplicateSlugs = duplicateValues(liveRows.map((a) => slugify(a.Slug || a.AirlineName)));

  if (duplicateIds.size || duplicateSlugs.size) {
    console.error("[airlines] Duplicate published airline data", {
      ids: Array.from(duplicateIds), slugs: Array.from(duplicateSlugs),
    });
  }

  const airlines = liveRows
    .filter((a) => !duplicateIds.has(a.AirlineID.trim()) && !duplicateSlugs.has(slugify(a.Slug || a.AirlineName)))
    .map((a) => mapRows(a, baggageRows))
    .filter((a) => a.slug && hasValidDimensions(a.cabinBag) && hasValidDimensions(a.personalItem));

  return airlines.length > 0 ? { airlines, source: "sheet" } : { airlines: FALLBACK_AIRLINES, source: "fallback" };
}

export const getCachedAirlines = cache(getAirlines);

export async function getAirlineBySlug(slug: string): Promise<{ airline: Airline | null; source: "sheet" | "fallback" }> {
  const { airlines, source } = await getCachedAirlines();
  return { airline: airlines.find((a) => a.slug === slug) ?? null, source };
}

export async function getAllAirlineSlugs(): Promise<string[]> {
  const { airlines } = await getCachedAirlines();
  return Array.from(new Set(airlines.map((a) => a.slug)));
}
