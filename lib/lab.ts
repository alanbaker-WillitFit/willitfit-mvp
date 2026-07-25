import type { FitResult, LabConfiguration } from "@/types";

export function isLabInvitationActive(config: LabConfiguration, result?: FitResult) {
  return Boolean(
    result
    && config.source === "sheet"
    && config.active
    && config.published
    && config.triggerType.trim().toLowerCase() === "code"
    && config.bagTypes.includes(result.bagType)
    && config.resultStates.includes(result.verdict)
  );
}

export function selectLabInvitation(configs: LabConfiguration[], result?: FitResult) {
  return configs
    .filter((config) => isLabInvitationActive(config, result))
    .sort((left, right) => left.priority - right.priority || left.configId.localeCompare(right.configId))[0] ?? null;
}
