export type Rc6FitVerdict = "fits" | "close" | "no-fit";
export type Rc6WeightVerdict = "fits" | "no-fit" | "not-checked" | "not-published";
export type Rc6LinearOperator = "lt" | "lte";
export type Rc6DimensionAxis = "heightCm" | "widthCm" | "depthCm";

export type Rc6Dimensions = Readonly<{
  heightCm: number;
  widthCm: number;
  depthCm: number;
}>;

export type Rc6SizingRule =
  | Readonly<{ method: "fixed-dimensions"; dimensions: Rc6Dimensions }>
  | Readonly<{ method: "linear-total"; linearLimitCm: number; operator: Rc6LinearOperator }>
  | Readonly<{ method: "weight-only" }>;

export type Rc6AxisAssessment = Readonly<{
  axis: Rc6DimensionAxis;
  enteredCm: number;
  limitCm: number;
  differenceCm: number;
  verdict: Rc6FitVerdict;
}>;

export type Rc6FitAssessment = Readonly<{
  verdict: Rc6FitVerdict;
  sizingRule: Rc6SizingRule;
  enteredDimensions: Rc6Dimensions;
  orientationUsed: Rc6Dimensions | null;
  axisAssessments: readonly Rc6AxisAssessment[];
  userLinearTotalCm: number | null;
  linearLimitCm: number | null;
  linearOperator: Rc6LinearOperator | null;
  linearMarginCm: number | null;
  weightLimitKg: number | null;
  enteredWeightKg: number | null;
  weightVerdict: Rc6WeightVerdict;
}>;

export const RC6_CHECKER_CLOSE_THRESHOLD_CM = 2;

const AXES: readonly Rc6DimensionAxis[] = ["heightCm", "widthCm", "depthCm"];

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function validPositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function validRc6Dimensions(dimensions: Rc6Dimensions): boolean {
  return AXES.every((axis) => validPositive(dimensions[axis]));
}

function axisVerdict(differenceCm: number): Rc6FitVerdict {
  if (differenceCm <= 0) return "fits";
  if (differenceCm <= RC6_CHECKER_CLOSE_THRESHOLD_CM) return "close";
  return "no-fit";
}

function verdictSeverity(verdict: Rc6FitVerdict): number {
  return verdict === "no-fit" ? 2 : verdict === "close" ? 1 : 0;
}

function worstVerdict(verdicts: readonly Rc6FitVerdict[]): Rc6FitVerdict {
  return verdicts.reduce<Rc6FitVerdict>((worst, current) =>
    verdictSeverity(current) > verdictSeverity(worst) ? current : worst,
  "fits");
}

function orientations(dimensions: Rc6Dimensions): Rc6Dimensions[] {
  const { heightCm: h, widthCm: w, depthCm: d } = dimensions;
  return [
    { heightCm: h, widthCm: w, depthCm: d },
    { heightCm: h, widthCm: d, depthCm: w },
    { heightCm: w, widthCm: h, depthCm: d },
    { heightCm: w, widthCm: d, depthCm: h },
    { heightCm: d, widthCm: h, depthCm: w },
    { heightCm: d, widthCm: w, depthCm: h },
  ];
}

function assessAxes(entered: Rc6Dimensions, limit: Rc6Dimensions): Rc6AxisAssessment[] {
  return AXES.map((axis) => {
    const differenceCm = round1(entered[axis] - limit[axis]);
    return {
      axis,
      enteredCm: entered[axis],
      limitCm: limit[axis],
      differenceCm,
      verdict: axisVerdict(differenceCm),
    };
  });
}

function orientationScore(assessments: readonly Rc6AxisAssessment[]): readonly [number, number, number] {
  const worst = Math.max(...assessments.map((assessment) => verdictSeverity(assessment.verdict)));
  const maxPositiveOverage = Math.max(0, ...assessments.map((assessment) => assessment.differenceCm));
  const totalPositiveOverage = assessments.reduce((total, assessment) => total + Math.max(0, assessment.differenceCm), 0);
  return [worst, maxPositiveOverage, totalPositiveOverage];
}

function lowerScore(left: readonly number[], right: readonly number[]): boolean {
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    if (leftValue !== rightValue) return leftValue < rightValue;
  }
  return false;
}

function weightVerdict(enteredWeightKg: number | null, weightLimitKg: number | null): Rc6WeightVerdict {
  if (weightLimitKg === null) return "not-published";
  if (enteredWeightKg === null) return "not-checked";
  return enteredWeightKg <= weightLimitKg ? "fits" : "no-fit";
}

export function assessRc6Fit(input: Readonly<{
  enteredDimensions: Rc6Dimensions;
  sizingRule: Rc6SizingRule;
  enteredWeightKg?: number | null;
  weightLimitKg?: number | null;
}>): Rc6FitAssessment {
  const enteredWeightKg = input.enteredWeightKg ?? null;
  const weightLimitKg = input.weightLimitKg ?? null;

  if (!validRc6Dimensions(input.enteredDimensions)) {
    throw new Error("All three bag dimensions must be valid positive numbers.");
  }
  if (enteredWeightKg !== null && !validPositive(enteredWeightKg)) {
    throw new Error("Entered bag weight must be a valid positive number when supplied.");
  }
  if (weightLimitKg !== null && !validPositive(weightLimitKg)) {
    throw new Error("Published weight limit must be a valid positive number when supplied.");
  }

  const resolvedWeightVerdict = weightVerdict(enteredWeightKg, weightLimitKg);

  if (input.sizingRule.method === "weight-only") {
    return {
      verdict: resolvedWeightVerdict === "no-fit" ? "no-fit" : "fits",
      sizingRule: input.sizingRule,
      enteredDimensions: input.enteredDimensions,
      orientationUsed: null,
      axisAssessments: [],
      userLinearTotalCm: null,
      linearLimitCm: null,
      linearOperator: null,
      linearMarginCm: null,
      weightLimitKg,
      enteredWeightKg,
      weightVerdict: resolvedWeightVerdict,
    };
  }

  if (input.sizingRule.method === "linear-total") {
    if (!validPositive(input.sizingRule.linearLimitCm)) {
      throw new Error("Linear baggage limit must be a valid positive number.");
    }
    const total = round1(input.enteredDimensions.heightCm + input.enteredDimensions.widthCm + input.enteredDimensions.depthCm);
    const margin = round1(input.sizingRule.linearLimitCm - total);
    const passes = input.sizingRule.operator === "lt"
      ? total < input.sizingRule.linearLimitCm
      : total <= input.sizingRule.linearLimitCm;
    const dimensionVerdict: Rc6FitVerdict = !passes
      ? "no-fit"
      : margin <= RC6_CHECKER_CLOSE_THRESHOLD_CM
        ? "close"
        : "fits";
    const verdict = resolvedWeightVerdict === "no-fit" ? "no-fit" : dimensionVerdict;

    return {
      verdict,
      sizingRule: input.sizingRule,
      enteredDimensions: input.enteredDimensions,
      orientationUsed: null,
      axisAssessments: [],
      userLinearTotalCm: total,
      linearLimitCm: input.sizingRule.linearLimitCm,
      linearOperator: input.sizingRule.operator,
      linearMarginCm: margin,
      weightLimitKg,
      enteredWeightKg,
      weightVerdict: resolvedWeightVerdict,
    };
  }

  if (!validRc6Dimensions(input.sizingRule.dimensions)) {
    throw new Error("Published fixed baggage dimensions must be valid positive numbers.");
  }

  let bestOrientation = orientations(input.enteredDimensions)[0]!;
  let bestAssessments = assessAxes(bestOrientation, input.sizingRule.dimensions);
  let bestScore = orientationScore(bestAssessments);

  for (const candidate of orientations(input.enteredDimensions).slice(1)) {
    const assessments = assessAxes(candidate, input.sizingRule.dimensions);
    const score = orientationScore(assessments);
    if (lowerScore(score, bestScore)) {
      bestOrientation = candidate;
      bestAssessments = assessments;
      bestScore = score;
    }
  }

  const dimensionVerdict = worstVerdict(bestAssessments.map((assessment) => assessment.verdict));
  const verdict = resolvedWeightVerdict === "no-fit" ? "no-fit" : dimensionVerdict;

  return {
    verdict,
    sizingRule: input.sizingRule,
    enteredDimensions: input.enteredDimensions,
    orientationUsed: bestOrientation,
    axisAssessments: bestAssessments,
    userLinearTotalCm: null,
    linearLimitCm: null,
    linearOperator: null,
    linearMarginCm: null,
    weightLimitKg,
    enteredWeightKg,
    weightVerdict: resolvedWeightVerdict,
  };
}
