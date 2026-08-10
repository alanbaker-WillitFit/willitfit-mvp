export const WILLITFLY_VALUE_INTELLIGENCE_CONTRACT_VERSION = "0.10-DRAFT";

export type WillItFlyValueVerdict =
  | "GREAT_VALUE"
  | "GOOD_VALUE"
  | "FAIR_PRICE"
  | "WAIT_IF_YOU_CAN"
  | "HIGH_PRICE"
  | "UNPROVEN_DEAL";

export type WillItFlyScoreStatus = "ESTABLISHED" | "INSUFFICIENT_HISTORY" | "UNAVAILABLE";

export type RuntimeValueIntelligence = {
  valueIntelligenceId: string;
  productId: string;
  offerId?: string;
  merchantId?: string;
  productScore?: 1 | 2 | 3 | 4 | 5;
  productScoreStatus: WillItFlyScoreStatus;
  priceScore?: 1 | 2 | 3 | 4 | 5;
  priceScoreStatus: WillItFlyScoreStatus;
  valueVerdict: WillItFlyValueVerdict;
  currentPrice?: number;
  currency?: string;
  typicalObservedPrice?: number;
  observedLow?: number;
  observedHigh?: number;
  monitoringDays?: number;
  evidenceConfidence?: string;
  methodologyVersion: string;
  lastEvaluated?: string;
  active: boolean;
  publish: boolean;
  featureFlag?: string;
};

export type WillItFlyValueAlertTriggerType =
  | "VALUE_BAND_ENTERED"
  | "ABSOLUTE_PRICE_CROSSED"
  | "PERCENT_THRESHOLD_CROSSED"
  | "NEW_OBSERVED_LOW"
  | "SUFFICIENT_HISTORY_ESTABLISHED";

export type ValueAlertTransitionInput = {
  previousConditionState: boolean;
  conditionState: boolean;
};

export type ValueAlertTransition = {
  emitEvent: boolean;
  armed: boolean;
};

export type ValueAlertEvent = {
  alertRuleId: string;
  productId: string;
  offerId?: string;
  merchantId?: string;
  triggerType: WillItFlyValueAlertTriggerType;
  observedPrice?: number;
  priorOrTypicalPrice?: number;
  triggerReason: string;
  evidenceConfidence: string;
  methodologyVersion: string;
  eventTimestamp: string;
  notificationChannel: "EMAIL";
};

export function hasEstablishedPriceScore(value: RuntimeValueIntelligence): boolean {
  return value.priceScoreStatus === "ESTABLISHED" && value.priceScore !== undefined;
}

export function canPublishValueIntelligence(value: RuntimeValueIntelligence): boolean {
  return (
    value.active &&
    value.publish &&
    value.methodologyVersion.trim().length > 0 &&
    value.productScoreStatus !== "UNAVAILABLE" &&
    value.priceScoreStatus !== "UNAVAILABLE"
  );
}

export function resolveValueAlertTransition(
  input: ValueAlertTransitionInput,
): ValueAlertTransition {
  if (!input.previousConditionState && input.conditionState) {
    return { emitEvent: true, armed: false };
  }

  if (input.previousConditionState && !input.conditionState) {
    return { emitEvent: false, armed: true };
  }

  return { emitEvent: false, armed: !input.conditionState };
}

export function isCompleteValueAlertEvent(event: ValueAlertEvent): boolean {
  return Boolean(
    event.alertRuleId.trim() &&
      event.productId.trim() &&
      event.triggerReason.trim() &&
      event.evidenceConfidence.trim() &&
      event.methodologyVersion.trim() &&
      event.eventTimestamp.trim(),
  );
}
