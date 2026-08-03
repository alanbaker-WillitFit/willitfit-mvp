import { Airline, FareClassAllowance, Dimensions, SheetStatus } from "@/types";
import { cache } from "react";
import { hasValidDimensions } from "@/lib/dimensions";
import { toNumber, slugify } from "./googleSheets";
import { FALLBACK_AIRLINES } from "@/data/runtimeFallbacks";
import { readFirstAvailableRuntimeTab, runtimePublished } from "./runtimeContent";
import { AIRLINE_TABS, BAGGAGE_RULE_TABS } from "./runtimeSources";
export { AIRLINE_TABS, BAGGAGE_RULE_TABS } from "./runtimeSources";

type RuntimeRow = Record<string, string>;
type GovernedBagType = "personal" | "cabin" | "checked";
type AirlineRow = RuntimeRow & {
  AirlineID: string; AirlineName: string; Slug: string; Country: string;
  OfficialBaggageURL: string; Status: string; LastChecked: string; Notes: string;
};
type BaggageRuleRow = RuntimeRow & {
  RuleID: string; AirlineID: string; FareClass: string; BagType: string;
  HeightCm: string; WidthCm: string; DepthCm: string; WeightKg: string; Status?: string;
};

function value(row: RuntimeRow, ...names: string[]): string {
  for (const name of names) {
    const candidate = String(row[name] ?? "").trim();
    if (candidate) return candidate;
  }
  return "";
}

export function adaptAirlineRow(row: RuntimeRow): AirlineRow {
  return {
    ...row,
    AirlineID: value(row, "Airline ID", "AirlineID"),
    AirlineName: value(row, "Airline Name", "AirlineName"),
    Slug: value(row, "Slug"),
    Country: value(row, "Country"),
    OfficialBaggageURL: value(row, "Baggage URL", "Website URL", "OfficialBaggageURL"),
    Status: runtimePublished(row) ? "Live" : value(row, "Status", "Review Status"),
    LastChecked: value(row, "Last Reviewed", "Last Checked", "LastChecked"),
    Notes: value(row, "Notes"),
  };
}

export function adaptBaggageRuleRow(row: RuntimeRow): BaggageRuleRow {
  return {
    ...row,
    RuleID: value(row, "Rule ID", "RuleID"),
    AirlineID: value(row, "Airline ID", "AirlineID"),
    FareClass: value(row, "Fare", "FareClass"),
    BagType: value(row, "Bag Type", "BagType"),
    HeightCm: value(row, "Length cm", "HeightCm"),
    WidthCm: value(row, "Width cm", "WidthCm"),
    DepthCm: value(row, "Depth cm", "DepthCm"),
    WeightKg: value(row, "Weight kg", "WeightKg"),
    Status: runtimePublished(row) ? "Live" : value(row, "Status", "Review Status"),
  };
}

function normalise(value: string | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

export function parseStatus(value: string | undefined): SheetStatus {
  const status = normalise(value);
  if (status === "live" || status === "active" || status === "approved" || status === "published") return "Live";
  if (status === "archived" || status === "inactive" || status === "retired") return "Archived";
  return "Draft";
}

export function parseGovernedBagType(value: string | undefined): GovernedBagType | null {
  const bagType = normalise(value);
  if (bagType === "personal" || bagType === "personal item") return "personal";
  if (bagType === "cabin" || bagType === "cabin bag") return "cabin";
  if (bagType === "checked" || bagType === "checked bag") return "checked";
  return null;
}

function isLiveRule(rule: BaggageRuleRow): boolean {
  return parseStatus(rule.Status) === "Live";
}

function isCabinBag(rule: BaggageRuleRow): boolean {
  return parseGovernedBagType(rule.BagType) === "cabin";
}

function isPersonalItem(rule: BaggageRuleRow): boolean {
  return parseGovernedBagType(rule.BagType) === "personal";
}

function isCheckedBag(rule: BaggageRuleRow): boolean {
  return parseGovernedBagType(rule.BagType) === "checked";
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
    const checkedRule = classRules.find(isCheckedBag);
    return {
      fareClass,
      cabinBag: toDimensions(cabinRule),
      personalItem: toDimensions(personalRule),
      checkedBag: toDimensions(checkedRule),
      weightLimitKg: toWeight(cabinRule),
      checkedWeightLimitKg: toWeight(checkedRule),
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
  const checkedRules = airlineRules.filter(isCheckedBag);

  const personalItem = selectBaseline(personalRules);
  const cabinBag = selectBaseline(cabinRules);
  const checkedBag = selectBaseline(checkedRules);
  const hasCheckedBag = hasValidDimensions(checkedBag);

  return {
    airlineId,
    airlineName: airline.AirlineName.trim(),
    slug: slugify(airline.Slug || airline.AirlineName),
    country: airline.Country?.trim() || "",
    logoUrl: "",
    personalItem,
    cabinBag,
    ...(hasCheckedBag ? { checkedBag } : {}),
    weightLimitKg: minWeight(cabinRules),
    checkedWeightLimitKg: minWeight(checkedRules),
    fareClasses: buildFareClasses(airlineRules),
    websiteUrl: isHttpsUrl(airline.OfficialBaggageURL) ? airline.OfficialBaggageURL.trim() : "",
    lastUpdated: airline.LastChecked?.trim() || "",
    status: parseStatus(airline.Status),
    notes: airline.Notes?.trim() || "",
    hasCabinBag: hasValidDimensions(cabinBag),
    hasPersonalItem: hasValidDimensions(personalItem),
    hasCheckedBag,
  };
}

export async function getAirlines(): Promise<{ airlines: Airline[]; source: "sheet" | "fallback" }> {
  const [airlineRead, baggageRead] = await Promise.all([
    readFirstAvailableRuntimeTab<RuntimeRow>(AIRLINE_TABS),
    readFirstAvailableRuntimeTab<RuntimeRow>(BAGGAGE_RULE_TABS),
  ]);
  const airlineRows = airlineRead.rows?.filter(runtimePublished).map(adaptAirlineRow) ?? null;
  const publishedBaggageRows = baggageRead.rows?.filter(runtimePublished).map(adaptBaggageRuleRow) ?? null;

  if (!airlineRows || !publishedBaggageRows) {
    return { airlines: FALLBACK_AIRLINES, source: "fallback" };
  }

  const duplicateRuleIds = duplicateValues(
    publishedBaggageRows.map((rule) => rule.RuleID.trim()).filter(Boolean)
  );
  const invalidRules = publishedBaggageRows.filter((rule) =>
    !rule.RuleID.trim() || !rule.AirlineID.trim() || parseGovernedBagType(rule.BagType) === null
  );

  if (duplicateRuleIds.size || invalidRules.length) {
    console.error("[airlines] Invalid published baggage rules", {
      duplicateRuleIds: Array.from(duplicateRuleIds),
      invalidRuleIds: invalidRules.map((rule) => rule.RuleID || "<blank>"),
    });
  }

  const baggageRows = publishedBaggageRows.filter((rule) =>
    Boolean(rule.RuleID.trim()) &&
    Boolean(rule.AirlineID.trim()) &&
    parseGovernedBagType(rule.BagType) !== null &&
    !duplicateRuleIds.has(rule.RuleID.trim())
  );

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
    .filter((a) => a.slug && (a.hasCabinBag || a.hasPersonalItem || a.hasCheckedBag));

  return { airlines, source: "sheet" };
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
