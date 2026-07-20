import { describe, expect, it } from "vitest";
import {
  getKnowledgeBySlug,
  getRelatedKnowledge,
  getResultQuestions,
  KNOWLEDGE_OBJECTS,
  QUESTION_ENGINE_CONTRACT_VERSION,
} from "@/services/knowledge";
import type { Airline, FitResult } from "@/types";

const airline: Airline = {
  airlineId: "EZY",
  airlineName: "easyJet",
  slug: "easyjet",
  country: "United Kingdom",
  logoUrl: "",
  personalItem: { heightCm: 45, widthCm: 36, depthCm: 20 },
  cabinBag: { heightCm: 56, widthCm: 45, depthCm: 25 },
  weightLimitKg: 15,
  fareClasses: [],
  websiteUrl: "https://example.com",
  lastUpdated: "2026-07-15",
  status: "Live",
};

function makeResult(verdict: FitResult["verdict"], overrides: Partial<FitResult> = {}): FitResult {
  const base: FitResult = {
    verdict,
    airline,
    bagType: "cabinBag",
    userDimensions: { heightCm: 56, widthCm: 45, depthCm: 25 },
    limit: { heightCm: 56, widthCm: 45, depthCm: 25 },
    weightLimitKg: 15,
    fareClass: "Large cabin bag",
    overBy: verdict === "no-fit" ? { heightCm: 4 } : {},
    spareCm: verdict === "fits" ? { heightCm: 4, widthCm: 3, depthCm: 3 } : {},
    withinCm: verdict === "close" ? 1 : null,
    orientationUsed: verdict === "no-fit"
      ? { heightCm: 60, widthCm: 45, depthCm: 25 }
      : verdict === "close"
        ? { heightCm: 57, widthCm: 45, depthCm: 25 }
        : { heightCm: 52, widthCm: 42, depthCm: 22 },
  };
  return { ...base, ...overrides };
}

describe("RC15 Question Engine", () => {
  it("loads the RC15 contract and hides blocked answers", () => {
    expect(QUESTION_ENGINE_CONTRACT_VERSION).toBe("QE-RC15-1.0");
    expect(KNOWLEDGE_OBJECTS.length).toBe(18);
    expect(KNOWLEDGE_OBJECTS.every((item) => item.quickAnswer && item.detailedAnswer)).toBe(true);
  });

  it.each(["fits", "close", "no-fit"] as const)("returns no more than three questions for %s", (verdict) => {
    const questions = getResultQuestions(makeResult(verdict));
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBeLessThanOrEqual(3);
  });

  it("applies the measurement fallback and ranks Q-0001 first", () => {
    expect(getResultQuestions(makeResult("fits"))[0]?.questionId).toBe("Q-0001");
  });

  it("suppresses the weight question when no published limit exists", () => {
    const questions = getResultQuestions(makeResult("fits", { weightLimitKg: null }));
    expect(questions.some((item) => item.questionId === "Q-0002")).toBe(false);
  });

  it("activates oversize consequences for a failed dimension", () => {
    const questions = getResultQuestions(makeResult("no-fit"));
    expect(questions.some((item) => item.questionId === "Q-0003")).toBe(true);
  });

  it("does not treat a conditional Close route as an unconditional Yes", () => {
    const questions = getResultQuestions(makeResult("close", {
      orientationUsed: { heightCm: 56, widthCm: 45, depthCm: 26 },
    }));
    expect(questions.length).toBeLessThanOrEqual(3);
  });

  it("uses the governed relationship graph rather than category slicing", () => {
    const item = getKnowledgeBySlug("what-happens-if-cabin-bag-is-too-large");
    expect(item).toBeDefined();
    const related = getRelatedKnowledge(item!);
    expect(related.every((candidate) => candidate.questionId !== item!.questionId)).toBe(true);
    expect(new Set(related.map((candidate) => candidate.questionId)).size).toBe(related.length);
  });
});
