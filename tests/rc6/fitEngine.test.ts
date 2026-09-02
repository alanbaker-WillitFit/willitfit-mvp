import { describe, expect, it } from "vitest";
import { assessRc6Fit } from "@/services/rc6/fitEngine";

const fixedRule = {
  method: "fixed-dimensions" as const,
  dimensions: { heightCm: 40, widthCm: 30, depthCm: 20 },
};

describe("RC6 fit engine", () => {
  it("passes an exact fixed-dimension fit", () => {
    const result = assessRc6Fit({
      enteredDimensions: { heightCm: 40, widthCm: 30, depthCm: 20 },
      sizingRule: fixedRule,
    });

    expect(result.verdict).toBe("fits");
    expect(result.axisAssessments.map((axis) => axis.verdict)).toEqual(["fits", "fits", "fits"]);
  });

  it("keeps independent axis states and uses the worst as overall", () => {
    const result = assessRc6Fit({
      enteredDimensions: { heightCm: 42, widthCm: 31, depthCm: 23 },
      sizingRule: fixedRule,
    });

    expect(result.axisAssessments.map((axis) => axis.verdict)).toEqual(["close", "close", "no-fit"]);
    expect(result.verdict).toBe("no-fit");
  });

  it("treats exact, +1 cm and +2 cm as fit/close boundaries and +3 cm as too large", () => {
    const exact = assessRc6Fit({ enteredDimensions: { heightCm: 40, widthCm: 30, depthCm: 20 }, sizingRule: fixedRule });
    const plusOne = assessRc6Fit({ enteredDimensions: { heightCm: 41, widthCm: 30, depthCm: 20 }, sizingRule: fixedRule });
    const plusTwo = assessRc6Fit({ enteredDimensions: { heightCm: 42, widthCm: 30, depthCm: 20 }, sizingRule: fixedRule });
    const plusThree = assessRc6Fit({ enteredDimensions: { heightCm: 43, widthCm: 30, depthCm: 20 }, sizingRule: fixedRule });

    expect(exact.verdict).toBe("fits");
    expect(plusOne.verdict).toBe("close");
    expect(plusTwo.verdict).toBe("close");
    expect(plusThree.verdict).toBe("no-fit");
  });

  it("supports three-digit dimensions without truncation", () => {
    const result = assessRc6Fit({
      enteredDimensions: { heightCm: 100, widthCm: 30, depthCm: 20 },
      sizingRule: fixedRule,
    });

    expect(result.verdict).toBe("no-fit");
    expect(result.axisAssessments[0]?.differenceCm).toBe(60);
  });

  it("selects a fitting rotation when orientation is allowed", () => {
    const result = assessRc6Fit({
      enteredDimensions: { heightCm: 30, widthCm: 40, depthCm: 20 },
      sizingRule: fixedRule,
    });

    expect(result.verdict).toBe("fits");
    expect(result.orientationUsed).toEqual({ heightCm: 40, widthCm: 30, depthCm: 20 });
  });

  it("honours lte linear-total equality and marks the boundary close", () => {
    const result = assessRc6Fit({
      enteredDimensions: { heightCm: 80, widthCm: 50, depthCm: 28 },
      sizingRule: { method: "linear-total", linearLimitCm: 158, operator: "lte" },
    });

    expect(result.userLinearTotalCm).toBe(158);
    expect(result.linearMarginCm).toBe(0);
    expect(result.verdict).toBe("close");
  });

  it("honours strict lt linear-total equality as no-fit", () => {
    const result = assessRc6Fit({
      enteredDimensions: { heightCm: 80, widthCm: 50, depthCm: 28 },
      sizingRule: { method: "linear-total", linearLimitCm: 158, operator: "lt" },
    });

    expect(result.verdict).toBe("no-fit");
  });

  it("supports weight-only rules and exact weight limits", () => {
    const atLimit = assessRc6Fit({
      enteredDimensions: { heightCm: 80, widthCm: 50, depthCm: 30 },
      sizingRule: { method: "weight-only" },
      enteredWeightKg: 23,
      weightLimitKg: 23,
    });
    const overLimit = assessRc6Fit({
      enteredDimensions: { heightCm: 80, widthCm: 50, depthCm: 30 },
      sizingRule: { method: "weight-only" },
      enteredWeightKg: 23.1,
      weightLimitKg: 23,
    });

    expect(atLimit.weightVerdict).toBe("fits");
    expect(atLimit.verdict).toBe("fits");
    expect(overLimit.weightVerdict).toBe("no-fit");
    expect(overLimit.verdict).toBe("no-fit");
  });

  it("lets an overweight bag override an otherwise fitting dimension result", () => {
    const result = assessRc6Fit({
      enteredDimensions: { heightCm: 40, widthCm: 30, depthCm: 20 },
      sizingRule: fixedRule,
      enteredWeightKg: 10.1,
      weightLimitKg: 10,
    });

    expect(result.axisAssessments.every((axis) => axis.verdict === "fits")).toBe(true);
    expect(result.weightVerdict).toBe("no-fit");
    expect(result.verdict).toBe("no-fit");
  });

  it("rejects invalid non-positive input instead of normalising it", () => {
    expect(() => assessRc6Fit({
      enteredDimensions: { heightCm: 0, widthCm: 30, depthCm: 20 },
      sizingRule: fixedRule,
    })).toThrow("valid positive numbers");
  });
});
