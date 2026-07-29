import { Airline, BagType, Dimensions, FitResult, FitVerdict, WeightVerdict } from "@/types";
import { hasValidDimensions } from "@/lib/dimensions";

const CLOSE_FIT_THRESHOLD_CM = 2;

function orientations(d: Dimensions): Dimensions[] {
  const { heightCm: h, widthCm: w, depthCm: dp } = d;
  const perms: [number, number, number][] = [
    [h, w, dp], [h, dp, w], [w, h, dp],
    [w, dp, h], [dp, h, w], [dp, w, h],
  ];
  return perms.map(([heightCm, widthCm, depthCm]) => ({ heightCm, widthCm, depthCm }));
}

function diffAgainstLimit(user: Dimensions, limit: Dimensions) {
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

function airlineLimit(airline: Airline, bagType: BagType): Dimensions {
  const limit = airline[bagType];
  if (!limit || !hasValidDimensions(limit)) {
    throw new Error(`No valid ${bagType} allowance is available for ${airline.airlineName}.`);
  }
  return limit;
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
): { limit: Dimensions; weightLimitKg: number | null; fareClass: string | null } {
  if (fareClass) {
    const match = airline.fareClasses.find(
      (fc) => fc.fareClass.toLowerCase() === fareClass.toLowerCase()
    );
    const selectedLimit = match?.[bagType] ?? null;
    if (match && selectedLimit && hasValidDimensions(selectedLimit)) {
      const weightLimitKg = bagType === "checkedBag"
        ? match.checkedWeightLimitKg ?? null
        : match.weightLimitKg;
      return { limit: selectedLimit, weightLimitKg, fareClass: match.fareClass };
    }
  }

  return {
    limit: airlineLimit(airline, bagType),
    weightLimitKg: airlineWeightLimit(airline, bagType),
    fareClass: null,
  };
}

function resolveWeightVerdict(userWeightKg: number | null, weightLimitKg: number | null): WeightVerdict {
  if (weightLimitKg === null) return "not-published";
  if (userWeightKg === null) return "not-checked";
  return userWeightKg <= weightLimitKg ? "fits" : "no-fit";
}

export function checkFit(
  userDimensions: Dimensions,
  airline: Airline,
  bagType: BagType,
  fareClass?: string | null,
  userWeightKg: number | null = null
): FitResult {
  const { limit, weightLimitKg, fareClass: resolvedFareClass } = resolveLimit(airline, bagType, fareClass);

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

  let verdict: FitVerdict;
  let overBy: Partial<Dimensions> = {};
  let spareCm: Partial<Dimensions> = {};
  let withinCm: number | null = null;

  if (best.score <= 0) {
    verdict = "fits";
    spareCm = {
      heightCm: round1(-best.diff.heightCm),
      widthCm: round1(-best.diff.widthCm),
      depthCm: round1(-best.diff.depthCm),
    };
  } else if (best.score <= CLOSE_FIT_THRESHOLD_CM) {
    verdict = "close";
    withinCm = round1(best.score);
  } else {
    verdict = "no-fit";
    overBy = {
      ...(best.diff.heightCm > 0 ? { heightCm: round1(best.diff.heightCm) } : {}),
      ...(best.diff.widthCm > 0 ? { widthCm: round1(best.diff.widthCm) } : {}),
      ...(best.diff.depthCm > 0 ? { depthCm: round1(best.diff.depthCm) } : {}),
    };
  }

  const weightVerdict = resolveWeightVerdict(userWeightKg, weightLimitKg);
  if (weightVerdict === "no-fit") verdict = "no-fit";

  return {
    verdict,
    airline,
    bagType,
    userDimensions,
    limit,
    weightLimitKg,
    userWeightKg,
    weightVerdict,
    fareClass: resolvedFareClass,
    overBy,
    spareCm,
    withinCm,
    orientationUsed: bestOrientation,
  };
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
