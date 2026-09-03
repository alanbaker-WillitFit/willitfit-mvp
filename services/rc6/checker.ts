import { assessRc6Fit, type Rc6Dimensions, type Rc6FitAssessment } from "./fitEngine";
import {
  getRc6AirlineRules,
  RC6_MIN_AIRLINE_RULES,
  rc6RulesForAirline,
  type Rc6AirlineRule,
  type Rc6BagType,
} from "./airlineRules";
import { getRc6Airlines, type Rc6AirlineIdentity } from "./airlines";
import type { Rc6TabReader } from "./runtimeReader";

export type Rc6CheckerCatalogue = Readonly<{
  airlines: readonly Rc6AirlineIdentity[];
  rules: readonly Rc6AirlineRule[];
}>;

export type Rc6RuleResolution =
  | Readonly<{ state: "RESOLVED"; rule: Rc6AirlineRule; fare: string }>
  | Readonly<{ state: "FARE_REQUIRED"; rule: null; fare: null; availableFares: readonly string[] }>
  | Readonly<{ state: "UNAVAILABLE"; rule: null; fare: null; availableFares: readonly string[] }>;

export type Rc6CheckerAssessment = Readonly<{
  airline: Rc6AirlineIdentity;
  rule: Rc6AirlineRule;
  fit: Rc6FitAssessment;
}>;

function normalise(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function sortedDimensions(rule: Rc6AirlineRule): readonly number[] | null {
  if (rule.sizingRule.method !== "fixed-dimensions") return null;
  return [rule.sizingRule.dimensions.heightCm, rule.sizingRule.dimensions.widthCm, rule.sizingRule.dimensions.depthCm].sort((a, b) => a - b);
}

function weightNoMorePermissive(left: Rc6AirlineRule, right: Rc6AirlineRule): boolean {
  if (left.weightLimitKg === null) return right.weightLimitKg === null;
  if (right.weightLimitKg === null) return true;
  return left.weightLimitKg <= right.weightLimitKg;
}

function sizingNoMorePermissive(left: Rc6AirlineRule, right: Rc6AirlineRule): boolean {
  if (left.sizingRule.method !== right.sizingRule.method) return false;
  if (left.sizingRule.method === "weight-only" && right.sizingRule.method === "weight-only") return true;
  if (left.sizingRule.method === "linear-total" && right.sizingRule.method === "linear-total") {
    if (left.sizingRule.linearLimitCm < right.sizingRule.linearLimitCm) return true;
    if (left.sizingRule.linearLimitCm > right.sizingRule.linearLimitCm) return false;
    return left.sizingRule.operator === "lt" || right.sizingRule.operator === "lte";
  }
  if (left.sizingRule.method === "fixed-dimensions" && right.sizingRule.method === "fixed-dimensions") {
    const leftDimensions = sortedDimensions(left)!;
    const rightDimensions = sortedDimensions(right)!;
    return leftDimensions.every((value, index) => value <= (rightDimensions[index] ?? Number.NEGATIVE_INFINITY));
  }
  return false;
}

export function rc6RuleNoMorePermissive(left: Rc6AirlineRule, right: Rc6AirlineRule): boolean {
  return sizingNoMorePermissive(left, right) && weightNoMorePermissive(left, right);
}

function distinctFares(rules: readonly Rc6AirlineRule[]): string[] {
  return [...new Set(rules.map((rule) => rule.fare).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function resolveRc6CheckerRule(rules: readonly Rc6AirlineRule[], airlineId: string, bagType: Rc6BagType, fare?: string | null): Rc6RuleResolution {
  const candidates = rc6RulesForAirline(rules, airlineId, bagType);
  const availableFares = distinctFares(candidates);
  if (candidates.length === 0) return { state: "UNAVAILABLE", rule: null, fare: null, availableFares };
  if (fare?.trim()) {
    const targetFare = normalise(fare);
    const matches = candidates.filter((rule) => normalise(rule.fare) === targetFare);
    if (matches.length !== 1) return { state: "UNAVAILABLE", rule: null, fare: null, availableFares };
    return { state: "RESOLVED", rule: matches[0]!, fare: matches[0]!.fare };
  }
  const dominant = candidates
    .filter((candidate) => candidates.every((other) => rc6RuleNoMorePermissive(candidate, other)))
    .sort((a, b) => a.fare.localeCompare(b.fare) || a.ruleId.localeCompare(b.ruleId));
  if (dominant.length === 0) return { state: "FARE_REQUIRED", rule: null, fare: null, availableFares };
  return { state: "RESOLVED", rule: dominant[0]!, fare: dominant[0]!.fare };
}

export function rc6AvailableBagTypes(rules: readonly Rc6AirlineRule[], airlineId: string): Rc6BagType[] {
  const bagTypes: Rc6BagType[] = ["personalItem", "cabinBag", "checkedBag"];
  return bagTypes.filter((bagType) => rc6RulesForAirline(rules, airlineId, bagType).length > 0);
}

export const RC6_MIN_AIRLINES = 114 as const;

export async function getRc6CheckerCatalogue(reader: Rc6TabReader): Promise<Rc6CheckerCatalogue | null> {
  const [airlines, rules] = await Promise.all([getRc6Airlines(reader), getRc6AirlineRules(reader)]);
  if (airlines.length < RC6_MIN_AIRLINES || rules.length < RC6_MIN_AIRLINE_RULES) return null;
  const airlineIds = new Set(airlines.map((airline) => airline.airlineId));
  if (rules.some((rule) => !airlineIds.has(rule.airlineId))) return null;
  return { airlines, rules };
}

export function assessRc6Checker(input: Readonly<{
  catalogue: Rc6CheckerCatalogue;
  airlineId: string;
  bagType: Rc6BagType;
  fare?: string | null;
  enteredDimensions: Rc6Dimensions;
  enteredWeightKg?: number | null;
}>): Rc6CheckerAssessment | Rc6RuleResolution {
  const airline = input.catalogue.airlines.find((candidate) => candidate.airlineId === input.airlineId.trim().toUpperCase());
  if (!airline) return { state: "UNAVAILABLE", rule: null, fare: null, availableFares: [] };
  const resolution = resolveRc6CheckerRule(input.catalogue.rules, airline.airlineId, input.bagType, input.fare);
  if (resolution.state !== "RESOLVED") return resolution;
  return {
    airline,
    rule: resolution.rule,
    fit: assessRc6Fit({
      enteredDimensions: input.enteredDimensions,
      sizingRule: resolution.rule.sizingRule,
      enteredWeightKg: input.enteredWeightKg ?? null,
      weightLimitKg: resolution.rule.weightLimitKg,
    }),
  };
}
