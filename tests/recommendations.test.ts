import { describe, expect, it } from "vitest";
import { buildRecommendationDecision } from "@/services/recommendations";
import type { FitResult } from "@/types";

const result: FitResult = {
  verdict: "no-fit",
  airline: {
    airlineId: "FR",
    airlineName: "Ryanair",
    slug: "ryanair",
    country: "Ireland",
    logoUrl: "",
    personalItem: { heightCm: 40, widthCm: 25, depthCm: 20 },
    cabinBag: { heightCm: 55, widthCm: 40, depthCm: 20 },
    weightLimitKg: 10,
    fareClasses: [],
    websiteUrl: "https://example.com",
    lastUpdated: "2026-07-15",
    status: "Live",
  },
  bagType: "cabinBag",
  userDimensions: { heightCm: 60, widthCm: 40, depthCm: 20 },
  limit: { heightCm: 55, widthCm: 40, depthCm: 20 },
  weightLimitKg: 10,
  userWeightKg: null,
  weightVerdict: "not-checked",
  fareClass: null,
  overBy: { heightCm: 5 },
  spareCm: {},
  withinCm: null,
  orientationUsed: { heightCm: 60, widthCm: 40, depthCm: 20 },
};

const baseRows = {
  intents: [{ Intent_ID: "AFF-INT-003", Question_ID: "Q-0009", Priority: "10", Disclosure_Rule: "Affiliate disclosure", Status: "Mapped" }],
  rules: [{ Rule_ID: "AFF-RUL-001", Intent_ID: "AFF-INT-003", Result_State: "Fail", Product_Category: "Cabin Bag", Card_ID: "REC-002", Priority: "10", Enabled: "Yes" }],
  cards: [{ Card_ID: "REC-002", Card_Name: "Replacement", Headline_Pattern: "A bag that fits", CTA_Text: "View suitable bags", Max_Products: "2", Status: "Draft" }],
  products: [{ AffiliateID: "PRD-1", Brand: "Test", Product: "Cabin Bag", Category: "Cabin Bag", AffiliateURL: "https://example.com/product", Status: "Live", Merchant_Priority: "1" }],
};

describe("commercial recommendation engine", () => {
  it("selects an eligible governed replacement", () => {
    const decision = buildRecommendationDecision(result, baseRows);
    expect(decision?.intentId).toBe("AFF-INT-003");
    expect(decision?.products).toHaveLength(1);
  });

  it("fails closed when the product is not live", () => {
    const decision = buildRecommendationDecision(result, {
      ...baseRows,
      products: [{ ...baseRows.products[0], Status: "Draft" }],
    });
    expect(decision).toBeNull();
  });

  it("fails closed when the affiliate link is invalid", () => {
    const decision = buildRecommendationDecision(result, {
      ...baseRows,
      products: [{ ...baseRows.products[0], AffiliateURL: "not-a-url" }],
    });
    expect(decision).toBeNull();
  });
});
