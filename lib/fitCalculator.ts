import { Airline, Dimensions, FitResult, FitVerdict } from "@/types";

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

export function checkFit(
  userDimensions: Dimensions,
  airline: Airline,
  bagType: "cabinBag" | "personalItem"
): FitResult {
  const limit = bagType === "cabinBag" ? airline.cabinBag : airline.personalItem;

  let best = gradeOrientation(orientations(userDimensions)[0]!, limit);
  let bestOrientation = orientations(userDimensions)[0]!;

  for (const orientation of orientations(userDimensions)) {
    const candidate = gradeOrientation(orientation, limit);
    if (candidate.score < best.score) {
      best = candidate;
      bestOrientation = orientation;
    }
  }

  let verdict: FitVerdict;
  let overBy: Partial<Dimensions> = {};
  let withinCm: number | null = null;

  if (best.score <= 0) {
    verdict = "fits";
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
    overBy,
    withinCm,
    orientationUsed: bestOrientation,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function isValidDimensions(d: Partial<Dimensions>): d is Dimensions {
  return (
    typeof d.heightCm === "number" &&
    typeof d.widthCm === "number" &&
    typeof d.depthCm === "number" &&
    [d.heightCm, d.widthCm, d.depthCm].every((n) => Number.isFinite(n) && n > 0 && n <= 300)
  );
}

export const VERDICT_COPY: Record<FitVerdict, { label: string; tone: "good" | "warn" | "bad" }> = {
  fits: { label: "Fits", tone: "good" },
  close: { label: "Close fit — check carefully", tone: "warn" },
  "no-fit": { label: "Does not fit", tone: "bad" },
};
