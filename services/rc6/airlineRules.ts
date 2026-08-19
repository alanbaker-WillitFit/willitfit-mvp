import type { Rc6LinearOperator, Rc6SizingRule } from "./fitEngine";
import { readRc6Dataset, type Rc6TabReader } from "./runtimeReader";

type RuntimeRow = Record<string, string>;

export type Rc6BagType = "personalItem" | "cabinBag" | "checkedBag";

export type Rc6AirlineRule = Readonly<{
  ruleId: string;
  airlineId: string;
  fare: string;
  bagType: Rc6BagType;
  sizingRule: Rc6SizingRule;
  weightLimitKg: number | null;
  sourceReference: string;
  lastChecked: string;
}>;

function text(row: RuntimeRow, field: string): string {
  return String(row[field] ?? "").trim();
}

function positiveNumber(row: RuntimeRow, field: string): number | null {
  const raw = text(row, field);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function published(row: RuntimeRow): boolean {
  return text(row, "Review Status").toLowerCase() === "approved" && text(row, "Publish").toLowerCase() === "yes";
}

function bagType(value: string): Rc6BagType | null {
  switch (value.trim().toLowerCase()) {
    case "personal":
      return "personalItem";
    case "cabin":
      return "cabinBag";
    case "checked":
      return "checkedBag";
    default:
      return null;
  }
}

function linearOperator(value: string): Rc6LinearOperator | null {
  const normalised = value.trim().toLowerCase();
  return normalised === "lt" || normalised === "lte" ? normalised : null;
}

export function mapRc6AirlineRuleRow(row: RuntimeRow): Rc6AirlineRule | null {
  if (!published(row)) return null;

  const ruleId = text(row, "Rule ID");
  const airlineId = text(row, "Airline ID").toUpperCase();
  const fare = text(row, "Fare");
  const resolvedBagType = bagType(text(row, "Bag Type"));
  const sourceReference = text(row, "Source Reference");
  const lastChecked = text(row, "Last Checked");
  const method = text(row, "Sizing Method").toLowerCase();
  const operator = linearOperator(text(row, "Limit Operator"));
  const weightLimitKg = positiveNumber(row, "Weight kg");

  if (!ruleId || !airlineId || !fare || !resolvedBagType || !/^https:\/\//i.test(sourceReference) || !lastChecked) {
    return null;
  }

  let sizingRule: Rc6SizingRule;

  if (method === "fixed dimensions") {
    const lengthCm = positiveNumber(row, "Length cm");
    const widthCm = positiveNumber(row, "Width cm");
    const depthCm = positiveNumber(row, "Depth cm");
    if (lengthCm === null || widthCm === null || depthCm === null || operator !== "lte") return null;
    sizingRule = {
      method: "fixed-dimensions",
      dimensions: { heightCm: lengthCm, widthCm, depthCm },
    };
  } else if (method === "linear total") {
    const linearLimitCm = positiveNumber(row, "Linear Size cm");
    if (linearLimitCm === null || operator === null) return null;
    sizingRule = { method: "linear-total", linearLimitCm, operator };
  } else if (method === "weight only") {
    if (weightLimitKg === null || text(row, "Limit Operator")) return null;
    sizingRule = { method: "weight-only" };
  } else {
    return null;
  }

  return {
    ruleId,
    airlineId,
    fare,
    bagType: resolvedBagType,
    sizingRule,
    weightLimitKg,
    sourceReference,
    lastChecked,
  };
}

export async function getRc6AirlineRules(reader: Rc6TabReader): Promise<Rc6AirlineRule[]> {
  const result = await readRc6Dataset<RuntimeRow>("airlineRules", reader);
  if (result.state !== "READY_WITH_ROWS") return [];

  const mapped: Rc6AirlineRule[] = [];
  for (const row of result.rows) {
    const rule = mapRc6AirlineRuleRow(row);
    if (!rule) return [];
    mapped.push(rule);
  }

  if (mapped.length !== 425) return [];

  const ids = new Set<string>();
  for (const rule of mapped) {
    if (ids.has(rule.ruleId)) return [];
    ids.add(rule.ruleId);
  }

  return mapped;
}

export function rc6RulesForAirline(
  rules: readonly Rc6AirlineRule[],
  airlineId: string,
  bagTypeFilter?: Rc6BagType,
): Rc6AirlineRule[] {
  const target = airlineId.trim().toUpperCase();
  return rules.filter((rule) => rule.airlineId === target && (!bagTypeFilter || rule.bagType === bagTypeFilter));
}
