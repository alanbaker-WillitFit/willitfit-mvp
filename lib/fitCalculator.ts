import {
  Airline,
  BagType,
  BaggageSizingRule,
  Dimensions,
  FitResult,
  FitVerdict,
  WeightVerdict,
} from "@/types";
import { airlineHasBagType, hasValidDimensions } from "@/lib/dimensions";

const CLOSE_FIT_THRESHOLD_CM = 2;

function orientations(d: Dimensions): Dimensions[] {
  const { heightCm: h, widthCm: w, depthCm: dp } = d;
  const perms: [number, number, number][] = [
    [h, w, dp], [h, dp, w], [w, h, dp],
    [w, dp, h], [dp, h, w], [dp, w, h],
  ];
  return perms.map(([heightCm, widthCm, depthCm]) => ({ heightCm, widthCm, depthCm }));
}

function diffAgainstLimit(user: Dimensions, limit: Dimensions): Dimensions {
  return {
    heightCm: user.heightCm - limit.heightCm,
    widthCm: user.widthCm - limit.widthCm,
    depthCm: user.depthCm - limit.depthCm,
  };
}

function maxOverage(diff: Dimensions): number {
  return Math.max(diff.heightCm, diff.widthCm, diff.depthCm);
}

function gradeOrientation(user: Dimensions, limit: Dimensions): { diff: Dimensions; score: number } {
  const diff = diffAgainstLimit(user, limit);
  return { diff, score: maxOverage(diff) };
}

function fixedRule(dimensions: Dimensions | null | undefined, bagType: BagType, airline: Airline): BaggageSizingRule {
  if (!dimensions || !hasValidDimensions(dimensions)) {
    throw new Error(`No valid ${bagType} allowance is available for ${airline.airlineName}.`);
  }
  return { method: "fixed-dimensions", dimensions };
}

function airlineSizingRule(airline: Airline, bagType: BagType): BaggageSizingRule {
  if (bagType === "checkedBag") {
    if (airline.checkedBag) return airline.checkedBag;
    if (airline.checkedWeightLimitKg !== null && airline.checkedWeightLimitKg !== undefined) {
      return { method: "weight-only" };
    }
    throw new Error(`No valid checkedBag allowance is available for ${airline.airlineName}.`);
  }
  return fixedRule(airline[bagType], bagType, airline);
}

function airlineWeightLimit(airline: Airline, bagType: BagType): number | null {
  return bagType === "checkedBag"
    ? airline.checkedWeightLimitKg ?? null
    : airline.weightLimitKg;
}

export function resolveLimit(
  airline: Airline,
  bagType: BagType,
  fareClass?: string | null
): { sizingRule: BaggageSizingRule; weightLimitKg: number | null; fareClass: string | null } {
  if (fareClass) {
    const match = airline.fareClasses.find(
      (fc) => fc.fareClass.toLowerCase() === fareClass.toLowerCase()
    );
    if (match) {
      const selectedRule = bagType === "checkedBag"
        ? match.checkedBag ?? (match.checkedWeightLimitKg !== null && match.checkedWeightLimitKg !== undefined
          ? { method: "weight-only" as const }
          : null)
        : match[bagType] && hasValidDimensions(match[bagType])
          ? { method: "fixed-dimensions" as const, dimensions: match[bagType] }
          : null;
      if (selectedRule) {
        const weightLimitKg = bagType === "checkedBag"
          ? match.checkedWeightLimitKg ?? null
          : match.weightLimitKg;
        return { sizingRule: selectedRule, weightLimitKg, fareClass: match.fareClass };
      }
    }
  }

  return {
    sizingRule: airlineSizingRule(airline, bagType),
    weightLimitKg: airlineWeightLimit(airline, bagType),
    fareClass: null,
  };
}

function resolveWeightVerdict(userWeightKg: number | null, weightLimitKg: number | null): WeightVerdict {
  if (weightLimitKg === null) return "not-published";
  if (userWeightKg === null) return "not-checked";
  return userWeightKg <= weightLimitKg ? "fits" : "no-fit";
}

function checkFixedDimensions(
  userDimensions: Dimensions,
  rule: Extract<BaggageSizingRule, { method: "fixed-dimensions" }>
): Pick<FitResult, "verdict" | "limit" | "overBy" | "spareCm" | "withinCm" | "orientationUsed"> {
  const limit = rule.dimensions;
  const candidateOrientations = orientations(userDimensions);
  let best = gradeOrientation(candidateOrientations[0]!, limit);
  let bestOrientation = candidateOrientations[0]!;

  for (const orientation of candidateOrientations.slice(1)) {
    const candidate = gradeOrientation(orientation, limit);
    const candidatePositiveTotal = Object.values(candidate.diff).reduce((sum, value) => sum + Math.max(0, value), 0);
    const bestPositiveTotal = Object.values(best.diff).reduce((sum, value) => sum + Math.max(0, value), 0);
    if (candidate.score < best.score || (candidate.score === best.score && candidatePositiveTotal < bestPositiveTotal)) {
      best = candidate;
      bestOrientation = orientation;
    }
  }

  if (best.score <= 0) {
    return {
      verdict: "fits",
      limit,
      overBy: {},
      spareCm: {
        heightCm: round1(-best.diff.heightCm),
        widthCm: round1(-best.diff.widthCm),
        depthCm: round1(-best.diff.depthCm),
      },
      withinCm: null,
      orientationUsed: bestOrientation,
    };
  }

  if (best.score <= CLOSE_FIT_THRESHOLD_CM) {
    return {
      verdict: "close",
      limit,
      overBy: {},
      spareCm: {},
      withinCm: round1(best.score),
      orientationUsed: bestOrientation,
    };
  }

  return {
    verdict: "no-fit",
    limit,
    overBy: {
      ...(best.diff.heightCm > 0 ? { heightCm: round1(best.diff.heightCm) } : {}),
      ...(best.diff.widthCm > 0 ? { widthCm: round1(best.diff.widthCm) } : {}),
      ...(best.diff.depthCm > 0 ? { depthCm: round1(best.diff.depthCm) } : {}),
    },
    spareCm: {},
    withinCm: null,
    orientationUsed: bestOrientation,
  };
}

function checkLinearTotal(
  userDimensions: Dimensions,
  rule: Extract<BaggageSizingRule, { method: "linear-total" }>
): Pick<FitResult, "verdict" | "userLinearTotalCm" | "linearLimitCm" | "linearOperator" | "linearMarginCm"> {
  const userLinearTotalCm = round1(userDimensions.heightCm + userDimensions.widthCm + userDimensions.depthCm);
  const rawMargin = rule.linearLimitCm - userLinearTotalCm;
  const linearMarginCm = round1(rawMargin);
  const passes = rule.operator === "lt"
    ? userLinearTotalCm < rule.linearLimitCm
    : userLinearTotalCm <= rule.linearLimitCm;

  let verdict: FitVerdict;
  if (!passes) verdict = "no-fit";
  else if (linearMarginCm <= CLOSE_FIT_THRESHOLD_CM) verdict = "close";
  else verdict = "fits";

  return {
    verdict,
    userLinearTotalCm,
    linearLimitCm: rule.linearLimitCm,
    linearOperator: rule.operator,
    linearMarginCm,
  };
}

export function checkFit(
  userDimensions: Dimensions,
  airline: Airline,
  bagType: BagType,
  fareClass?: string | null,
  userWeightKg: number | null = null
): FitResult {
  if (!hasValidDimensions(userDimensions)) {
    throw new Error("All three bag dimensions must be valid positive numbers.");
  }

  const { sizingRule, weightLimitKg, fareClass: resolvedFareClass } = resolveLimit(airline, bagType, fareClass);
  const fixedResult = sizingRule.method === "fixed-dimensions"
    ? checkFixedDimensions(userDimensions, sizingRule)
    : null;
  const linearResult = sizingRule.method === "linear-total"
    ? checkLinearTotal(userDimensions, sizingRule)
    : null;
  const weightVerdict = resolveWeightVerdict(userWeightKg, weightLimitKg);

  let verdict: FitVerdict;
  if (sizingRule.method === "weight-only") {
    verdict = weightVerdict === "no-fit" ? "no-fit" : "fits";
  } else {
    verdict = fixedResult?.verdict ?? linearResult?.verdict ?? "no-fit";
    if (weightVerdict === "no-fit") verdict = "no-fit";
  }

  return {
    verdict,
    airline,
    bagType,
    userDimensions,
    sizingRule,
    limit: fixedResult?.limit ?? null,
    userLinearTotalCm: linearResult?.userLinearTotalCm ?? null,
    linearLimitCm: linearResult?.linearLimitCm ?? null,
    linearOperator: linearResult?.linearOperator ?? null,
    linearMarginCm: linearResult?.linearMarginCm ?? null,
    weightLimitKg,
    userWeightKg,
    weightVerdict,
    fareClass: resolvedFareClass,
    overBy: fixedResult?.overBy ?? {},
    spareCm: fixedResult?.spareCm ?? {},
    withinCm: fixedResult?.withinCm ?? null,
    orientationUsed: fixedResult?.orientationUsed ?? null,
  };
}

export type ReverseFitVerdict = FitVerdict | "check-required";

export interface ReverseFareOutcome {
  fareClass: string | null;
  verdict: ReverseFitVerdict;
  result: FitResult | null;
  reason?: string;
}

export interface ReverseAirlineMatch {
  airline: Airline;
  bagType: BagType;
  bestVerdict: ReverseFitVerdict;
  outcomes: ReverseFareOutcome[];
}

function fareSupportsBagType(airline: Airline, fareIndex: number, bagType: BagType): boolean {
  const fare = airline.fareClasses[fareIndex];
  if (!fare) return false;
  if (bagType === "checkedBag") {
    return Boolean(fare.checkedBag || (fare.checkedWeightLimitKg !== null && fare.checkedWeightLimitKg !== undefined));
  }
  return hasValidDimensions(fare[bagType]);
}

function reverseOutcome(
  userDimensions: Dimensions,
  airline: Airline,
  bagType: BagType,
  fareClass: string | null,
): ReverseFareOutcome | null {
  try {
    const resolved = resolveLimit(airline, bagType, fareClass);
    if (resolved.sizingRule.method === "weight-only") {
      return {
        fareClass: resolved.fareClass ?? fareClass,
        verdict: "check-required",
        result: null,
        reason: "This allowance is published by weight only, so dimensions alone cannot confirm a fit.",
      };
    }
    const result = checkFit(userDimensions, airline, bagType, fareClass, null);
    return { fareClass: result.fareClass ?? fareClass, verdict: result.verdict, result };
  } catch {
    return null;
  }
}

export function findAirlineAllowancesForBag(
  userDimensions: Dimensions,
  airlines: Airline[],
  bagType: BagType,
): ReverseAirlineMatch[] {
  if (!hasValidDimensions(userDimensions)) {
    throw new Error("All three bag dimensions must be valid positive numbers.");
  }

  const verdictOrder: Record<ReverseFitVerdict, number> = {
    fits: 0,
    close: 1,
    "check-required": 2,
    "no-fit": 3,
  };

  const matches: ReverseAirlineMatch[] = [];

  for (const airline of airlines) {
    if (!airlineHasBagType(airline, bagType)) continue;

    const fareOutcomes = airline.fareClasses
      .map((fare, index) => fareSupportsBagType(airline, index, bagType)
        ? reverseOutcome(userDimensions, airline, bagType, fare.fareClass)
        : null)
      .filter((outcome): outcome is ReverseFareOutcome => outcome !== null);

    const outcomes = fareOutcomes.length > 0
      ? fareOutcomes
      : [reverseOutcome(userDimensions, airline, bagType, null)].filter(
          (outcome): outcome is ReverseFareOutcome => outcome !== null,
        );

    if (outcomes.length === 0) continue;
    outcomes.sort((left, right) => verdictOrder[left.verdict] - verdictOrder[right.verdict]);
    matches.push({ airline, bagType, bestVerdict: outcomes[0]!.verdict, outcomes });
  }

  return matches.sort((left, right) => {
    const verdictDifference = verdictOrder[left.bestVerdict] - verdictOrder[right.bestVerdict];
    if (verdictDifference) return verdictDifference;
    const priorityDifference = (left.airline.searchPriority ?? 10) - (right.airline.searchPriority ?? 10);
    return priorityDifference || left.airline.airlineName.localeCompare(right.airline.airlineName);
  });
}

/**
 * Compatibility wrapper retained for callers that only need the conservative
 * baseline FitResult list. Fare-aware reverse journeys should use
 * findAirlineAllowancesForBag instead.
 */
export function findAirlinesForBag(
  userDimensions: Dimensions,
  airlines: Airline[],
  bagType: BagType,
  userWeightKg: number | null = null
): FitResult[] {
  if (!hasValidDimensions(userDimensions)) {
    throw new Error("All three bag dimensions must be valid positive numbers.");
  }

  const results: FitResult[] = [];
  for (const airline of airlines) {
    if (!airlineHasBagType(airline, bagType)) continue;

    try {
      const { sizingRule } = resolveLimit(airline, bagType, null);
      if (sizingRule.method === "weight-only") continue;
      results.push(checkFit(userDimensions, airline, bagType, null, userWeightKg));
    } catch {
      // Fail closed: an incomplete or conflicting rule must never become a positive match.
    }
  }

  const verdictOrder: Record<FitVerdict, number> = { fits: 0, close: 1, "no-fit": 2 };
  return results.sort((left, right) => {
    const verdictDifference = verdictOrder[left.verdict] - verdictOrder[right.verdict];
    if (verdictDifference) return verdictDifference;
    const priorityDifference = (left.airline.searchPriority ?? 10) - (right.airline.searchPriority ?? 10);
    return priorityDifference || left.airline.airlineName.localeCompare(right.airline.airlineName);
  });
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function isValidDimensions(d: Partial<Dimensions>): d is Dimensions {
  return hasValidDimensions(d);
}

export const VERDICT_COPY: Record<FitVerdict, { label: string; tone: "good" | "warn" | "bad" }> = {
  fits: { label: "Good to Go", tone: "good" },
  close: { label: "Close to the Limit", tone: "warn" },
  "no-fit": { label: "Too Large", tone: "bad" },
};
