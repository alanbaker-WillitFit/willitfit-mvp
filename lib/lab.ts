import type { FitResult, LabConfiguration } from "@/types";

function triggerNumbers(value: string): number[] {
  return value
    .trim()
    .split(/[^0-9.]+/)
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite);
}

function matchesDimensionTrigger(config: LabConfiguration, result: FitResult) {
  const triggerValue = config.triggerValue.trim();
  if (!triggerValue) return true;

  const expected = triggerNumbers(triggerValue);
  if (expected.length !== 3) return false;

  const entered = [
    result.userDimensions.heightCm,
    result.userDimensions.widthCm,
    result.userDimensions.depthCm,
  ];

  return entered.every((dimension, index) => dimension === expected[index]);
}

export function isLabInvitationActive(config: LabConfiguration, result?: FitResult) {
  return Boolean(
    result
    && config.source === "sheet"
    && config.active
    && config.published
    && config.triggerType.trim().toLowerCase() === "code"
    && matchesDimensionTrigger(config, result)
    && config.bagTypes.includes(result.bagType)
    && config.resultStates.includes(result.verdict)
  );
}

export function selectLabInvitation(configs: LabConfiguration[], result?: FitResult) {
  return configs
    .filter((config) => isLabInvitationActive(config, result))
    .sort((left, right) => left.priority - right.priority || left.configId.localeCompare(right.configId))[0] ?? null;
}
