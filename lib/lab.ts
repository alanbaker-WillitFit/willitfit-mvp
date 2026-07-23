import type { LabConfiguration } from "@/types";

export function isLabInvitationActive(config: LabConfiguration, now = new Date()) {
  const trigger = Date.parse(`${config.triggerDate}T00:00:00Z`);
  return config.active && config.published && Number.isFinite(trigger) && now.getTime() >= trigger;
}
