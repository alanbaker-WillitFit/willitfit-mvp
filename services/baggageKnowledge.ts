import certifiedRules from "@/data/certified/03_Airline_Rules.json";
import { slugify } from "@/services/googleSheets";

type RawRow = Record<string, string>;

export type EnrichedRule = {
  ruleId: string;
  airlineId: string;
  fare: string;
  fareSlug: string;
  bagType: string;
  lengthCm: number | null;
  widthCm: number | null;
  depthCm: number | null;
  weightKg: number | null;
  linearSizeCm: number | null;
  wheelsIncluded: string;
  handlesIncluded: string;
  fitsUnderSeat: string;
  softBagGuidance: string;
  ruleWording: string;
  sourceReference: string;
  lastChecked: string;
  notes: string;
  sizingMethod: string;
  limitOperator: string;
};

function rows(matrix: unknown[][]): RawRow[] {
  const [head, ...body] = matrix;
  const headers = (head ?? []).map((v) => String(v ?? "").trim());
  return body.map((row) => Object.fromEntries(headers.map((h, i) => [h, String(row?.[i] ?? "").trim()])));
}

function num(value: string): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function published(row: RawRow): boolean {
  return ["yes","true","1","published","live"].includes((row["Publish"] ?? "").toLowerCase()) &&
    ["approved","published","live"].includes((row["Review Status"] ?? "").toLowerCase());
}

export const ENRICHED_RULES: EnrichedRule[] = rows(certifiedRules as unknown[][])
  .filter(published)
  .map((row) => ({
    ruleId: row["Rule ID"] ?? "",
    airlineId: row["Airline ID"] ?? "",
    fare: row["Fare"] || "Standard",
    fareSlug: slugify(row["Fare"] || "standard"),
    bagType: row["Bag Type"] ?? "",
    lengthCm: num(row["Length cm"] ?? ""),
    widthCm: num(row["Width cm"] ?? ""),
    depthCm: num(row["Depth cm"] ?? ""),
    weightKg: num(row["Weight kg"] ?? ""),
    linearSizeCm: num(row["Linear Size cm"] ?? ""),
    wheelsIncluded: row["Wheels Included"] ?? "",
    handlesIncluded: row["Handles Included"] ?? "",
    fitsUnderSeat: row["Fits Under Seat"] ?? "",
    softBagGuidance: row["Soft Bag Guidance"] ?? "",
    ruleWording: row["Rule Wording"] ?? "",
    sourceReference: row["Source Reference"] ?? "",
    lastChecked: row["Last Checked"] ?? "",
    notes: row["Notes"] ?? "",
    sizingMethod: row["Sizing Method"] ?? "",
    limitOperator: row["Limit Operator"] ?? "",
  }))
  .filter((r) => r.ruleId && r.airlineId);

export function getRulesForAirline(airlineId: string): EnrichedRule[] {
  return ENRICHED_RULES.filter((r) => r.airlineId === airlineId);
}

export function getFareGroups(airlineId: string): Array<{ fare: string; fareSlug: string; rules: EnrichedRule[] }> {
  const grouped = new Map<string, EnrichedRule[]>();
  for (const rule of getRulesForAirline(airlineId)) {
    const key = rule.fare || "Standard";
    grouped.set(key, [...(grouped.get(key) ?? []), rule]);
  }
  const used = new Map<string, number>();
  return Array.from(grouped, ([fare, rules]) => ({ fare, rules }))
    .sort((a,b) => a.fare.localeCompare(b.fare))
    .map(({ fare, rules }) => {
      const base = slugify(fare) || "standard";
      const occurrence = (used.get(base) ?? 0) + 1;
      used.set(base, occurrence);
      const fareSlug = occurrence === 1 ? base : `${base}-${occurrence}`;
      return { fare, fareSlug, rules };
    });
}

export function getFareGroup(airlineId: string, fareSlug: string) {
  return getFareGroups(airlineId).find((g) => g.fareSlug === fareSlug) ?? null;
}

export function dimensionKey(rule: EnrichedRule): string | null {
  if (!rule.lengthCm || !rule.widthCm || !rule.depthCm) return null;
  return [rule.lengthCm, rule.widthCm, rule.depthCm]
    .map((n) => Number.isInteger(n) ? String(n) : String(n).replace(".", "-"))
    .join("x");
}

export function sizePageKey(rule: EnrichedRule): string | null {
  const dims = dimensionKey(rule);
  return dims ? `${slugify(rule.bagType)}--${dims}` : null;
}

export function dimensionLabel(rule: EnrichedRule): string | null {
  if (!rule.lengthCm || !rule.widthCm || !rule.depthCm) return null;
  return `${rule.lengthCm} x ${rule.widthCm} x ${rule.depthCm} cm`;
}

export type SizeGroup = {
  key: string;
  label: string;
  bagType: string;
  rules: EnrichedRule[];
};

export function getSizeGroups(): SizeGroup[] {
  const grouped = new Map<string, EnrichedRule[]>();
  for (const rule of ENRICHED_RULES) {
    const key = dimensionKey(rule);
    if (!key) continue;
    const compound = sizePageKey(rule)!;
    grouped.set(compound, [...(grouped.get(compound) ?? []), rule]);
  }
  return Array.from(grouped, ([compound, rules]) => {
    const first = rules[0]!;
    return {
      key: compound,
      label: dimensionLabel(first)!,
      bagType: first.bagType,
      rules,
    };
  }).sort((a,b) => b.rules.length - a.rules.length || a.key.localeCompare(b.key));
}

export function getSizeGroup(key: string): SizeGroup | null {
  return getSizeGroups().find((g) => g.key === key) ?? null;
}

export function getRuleStats() {
  const airlineIds = new Set(ENRICHED_RULES.map((r) => r.airlineId));
  const fares = new Set(ENRICHED_RULES.map((r) => `${r.airlineId}::${r.fare}`));
  const sources = ENRICHED_RULES.filter((r) => Boolean(r.sourceReference)).length;
  const reviewed = ENRICHED_RULES.filter((r) => Boolean(r.lastChecked)).length;
  return { rules: ENRICHED_RULES.length, airlines: airlineIds.size, fares: fares.size, sources, reviewed };
}
