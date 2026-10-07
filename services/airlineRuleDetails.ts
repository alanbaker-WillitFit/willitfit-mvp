import { cache } from "react";
import { readFirstAvailableRuntimeTab, runtimePublished } from "./runtimeContent";
import { BAGGAGE_RULE_TABS } from "./runtimeSources";

export type AirlineRuleDetail = {
  ruleId: string;
  airlineId: string;
  fare: string;
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

type RuntimeRow = Record<string, string>;
function clean(v: unknown): string { return String(v ?? "").trim(); }
function num(v: unknown): number | null { const n = Number(clean(v)); return Number.isFinite(n) && n > 0 ? n : null; }
function field(row: RuntimeRow, ...names: string[]): string {
  for (const name of names) { const v = clean(row[name]); if (v) return v; }
  return "";
}
function mapRow(row: RuntimeRow): AirlineRuleDetail {
  return {
    ruleId: field(row, "Rule ID", "RuleID"),
    airlineId: field(row, "Airline ID", "AirlineID"),
    fare: field(row, "Fare", "Fare Class", "FareClass"),
    bagType: field(row, "Bag Type", "BagType"),
    lengthCm: num(field(row, "Length cm", "Height cm", "HeightCm")),
    widthCm: num(field(row, "Width cm", "WidthCm")),
    depthCm: num(field(row, "Depth cm", "DepthCm")),
    weightKg: num(field(row, "Weight kg", "Weight Limit kg", "WeightKg")),
    linearSizeCm: num(field(row, "Linear Size cm")),
    wheelsIncluded: field(row, "Wheels Included"),
    handlesIncluded: field(row, "Handles Included"),
    fitsUnderSeat: field(row, "Fits Under Seat"),
    softBagGuidance: field(row, "Soft Bag Guidance"),
    ruleWording: field(row, "Rule Wording"),
    sourceReference: field(row, "Source Reference", "Source URL", "Official Source URL"),
    lastChecked: field(row, "Last Checked", "Last Reviewed"),
    notes: field(row, "Notes"),
    sizingMethod: field(row, "Sizing Method"),
    limitOperator: field(row, "Limit Operator"),
  };
}
async function loadAll(): Promise<AirlineRuleDetail[]> {
  const { rows } = await readFirstAvailableRuntimeTab<RuntimeRow>(BAGGAGE_RULE_TABS);
  if (!rows) return [];
  return rows.filter(runtimePublished).map(mapRow).filter((r) => r.ruleId && r.airlineId && r.bagType);
}
export const getAllAirlineRuleDetails = cache(loadAll);
export async function getAirlineRuleDetails(airlineId: string): Promise<AirlineRuleDetail[]> {
  return (await getAllAirlineRuleDetails()).filter((r) => r.airlineId === airlineId);
}
