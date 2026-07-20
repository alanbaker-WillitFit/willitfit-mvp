import { Airline, Dimensions, FitResult, FitVerdict } from "@/types";
import { hasValidDimensions } from "@/lib/dimensions";

const CLOSE_FIT_THRESHOLD_CM = 2;

/**
 * Bags aren't rigid boxes — a 55×40×20 bag can usually be presented to a
 * sizer cage as 40×55×20 just as easily. We try every axis permutation of
 * the user's three measurements and keep whichever orientation is most
 * favourable against the airline's limit, then grade that best orientation.
 * This mirrors how a gate agent actually tests a bag, rather than penalising
 * someone for typing height/width/depth in a different order than the
 * airline lists them.
 */
function orientations(d: Dimensions): Dimensions[] {
  const { heightCm: h, widthCm: w, depthCm: dp } = d;
  const perms: [number, number, number][] = [
    [h, w, dp],
    [h, dp, w],
    [w, h, dp],
    [w, dp, h],
    [dp, h, w],
    [dp, w, h],
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

/**
 * Scores how good an orientation is: the largest overage across the three
 * axes, where negative means "under the limit by this much". Lower is
 * always better — we want the orientation that is most under (or least
 * over) the limit.
 */
function gradeOrientation(user: Dimensions, limit: Dimensions): { diff: Dimensions; score: number } {
  const diff = diffAgainstLimit(user, limit);
  return { diff, score: maxOverage(diff) };
}

/**
 * Resolves which allowance to check against. If a fareClass is given and the
 * airline actually has data for it, use that fare class's specific figures.
 * Otherwise fall back to the airline's conservative minimum (the smallest
 * allowance across all its fare classes) — this is also what's used when the
 * person hasn't picked a seat type at all.
 */
export function resolveLimit(
  airline: Airline,
  bagType: "cabinBag" | "personalItem",
  fareClass?: string | null
): { limit: Dimensions; weightLimitKg: number | null; fareClass: string | null } {
  if (fareClass) {
    const match = airline.fareClasses.find(
      (fc) => fc.fareClass.toLowerCase() === fareClass.toLowerCase()
    );
    const selectedLimit = match?.[bagType] ?? null;
    if (match && selectedLimit && hasValidDimensions(selectedLimit)) {
      return { limit: selectedLimit, weightLimitKg: match.weightLimitKg, fareClass: match.fareClass };
    }
  }

  return { limit: airline[bagType], weightLimitKg: airline.weightLimitKg, fareClass: null };
}

export function checkFit(
  userDimensions: Dimensions,
  airline: Airline,
  bagType: "cabinBag" | "personalItem",
  fareClass?: string | null
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
    // Headroom per axis (limit minus bag) — this is the "Allowance Remaining"
    // figure shown to the user, so it should always be >= 0 here by definition.
    spareCm = {
      heightCm: round1(-best.diff.heightCm),
      widthCm: round1(-best.diff.widthCm),
      depthCm: round1(-best.diff.depthCm),
    };
  } else if (best.score <= CLOSE_FIT_THRESHOLD_CM) {
    verdict = "close";
    withinCm = Math.round(best.score * 10) / 10;
  } else {
    verdict = "no-fit";
    overBy = {
      ...(best.diff.heightCm > 0 ? { heightCm: round1(best.diff.heightCm) } : {}),
      ...(best.diff.widthCm > 0 ? { widthCm: round1(best.diff.widthCm) } : {}),
      ...(best.diff.depthCm > 0 ? { depthCm: round1(best.diff.depthCm) } : {}),
    };
  }

  return {
    verdict,
    airline,
    bagType,
    userDimensions,
    limit,
    weightLimitKg,
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
