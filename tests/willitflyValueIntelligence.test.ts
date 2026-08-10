import { describe, expect, it } from "vitest";

import {
  WILLITFLY_VALUE_INTELLIGENCE_CONTRACT_VERSION,
  canPublishValueIntelligence,
  hasEstablishedPriceScore,
  isCompleteValueAlertEvent,
  resolveValueAlertTransition,
  type RuntimeValueIntelligence,
  type ValueAlertEvent,
} from "../lib/willitflyValueIntelligence";

const baseValue: RuntimeValueIntelligence = {
  valueIntelligenceId: "VI-001",
  productId: "PRODUCT-001",
  offerId: "OFFER-001",
  merchantId: "MERCHANT-001",
  productScore: 5,
  productScoreStatus: "ESTABLISHED",
  priceScore: 2,
  priceScoreStatus: "ESTABLISHED",
  valueVerdict: "WAIT_IF_YOU_CAN",
  currentPrice: 49.99,
  currency: "GBP",
  typicalObservedPrice: 39.99,
  observedLow: 29.99,
  observedHigh: 54.99,
  monitoringDays: 120,
  evidenceConfidence: "HIGH",
  methodologyVersion: WILLITFLY_VALUE_INTELLIGENCE_CONTRACT_VERSION,
  lastEvaluated: "2026-08-10T15:30:00Z",
  active: true,
  publish: true,
};

const baseEvent: ValueAlertEvent = {
  alertRuleId: "ALERT-001",
  productId: "PRODUCT-001",
  offerId: "OFFER-001",
  merchantId: "MERCHANT-001",
  triggerType: "VALUE_BAND_ENTERED",
  observedPrice: 29.99,
  priorOrTypicalPrice: 39.99,
  triggerReason: "Offer entered Great Value band",
  evidenceConfidence: "HIGH",
  methodologyVersion: WILLITFLY_VALUE_INTELLIGENCE_CONTRACT_VERSION,
  eventTimestamp: "2026-08-10T15:30:00Z",
  notificationChannel: "EMAIL",
};

describe("WillItFly Value Intelligence", () => {
  it("keeps Product and Price scores independent", () => {
    expect(baseValue.productScore).toBe(5);
    expect(baseValue.priceScore).toBe(2);
    expect(baseValue.valueVerdict).toBe("WAIT_IF_YOU_CAN");
  });

  it("does not treat insufficient history as an established Price score", () => {
    const insufficient: RuntimeValueIntelligence = {
      ...baseValue,
      priceScore: undefined,
      priceScoreStatus: "INSUFFICIENT_HISTORY",
      valueVerdict: "UNPROVEN_DEAL",
    };

    expect(hasEstablishedPriceScore(insufficient)).toBe(false);
    expect(canPublishValueIntelligence(insufficient)).toBe(true);
  });

  it("emits exactly once when an alert condition transitions false to true", () => {
    expect(
      resolveValueAlertTransition({ previousConditionState: false, conditionState: true }),
    ).toEqual({ emitEvent: true, armed: false });
  });

  it("does not repeat an alert while the trigger condition remains true", () => {
    expect(
      resolveValueAlertTransition({ previousConditionState: true, conditionState: true }),
    ).toEqual({ emitEvent: false, armed: false });
  });

  it("re-arms only after the trigger condition becomes false", () => {
    expect(
      resolveValueAlertTransition({ previousConditionState: true, conditionState: false }),
    ).toEqual({ emitEvent: false, armed: true });
    expect(
      resolveValueAlertTransition({ previousConditionState: false, conditionState: false }),
    ).toEqual({ emitEvent: false, armed: true });
  });

  it("accepts all required governed alert trigger classes", () => {
    const triggerTypes: ValueAlertEvent["triggerType"][] = [
      "VALUE_BAND_ENTERED",
      "ABSOLUTE_PRICE_CROSSED",
      "PERCENT_THRESHOLD_CROSSED",
      "NEW_OBSERVED_LOW",
      "SUFFICIENT_HISTORY_ESTABLISHED",
    ];

    for (const triggerType of triggerTypes) {
      expect(isCompleteValueAlertEvent({ ...baseEvent, triggerType })).toBe(true);
    }
  });

  it("fails an alert event closed when evidence metadata is incomplete", () => {
    expect(isCompleteValueAlertEvent({ ...baseEvent, evidenceConfidence: "" })).toBe(false);
    expect(isCompleteValueAlertEvent({ ...baseEvent, triggerReason: "" })).toBe(false);
  });

  it("contains no affiliate commission input in scoring or alert contracts", () => {
    expect("affiliateCommission" in baseValue).toBe(false);
    expect("affiliateCommission" in baseEvent).toBe(false);
  });
});
