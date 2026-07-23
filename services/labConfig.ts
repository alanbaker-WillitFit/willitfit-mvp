import { cache } from "react";
import type { LabConfiguration } from "@/types";
import { readFirstAvailableRuntimeTab, runtimeBoolean, runtimePublished } from "./runtimeContent";
export { isLabInvitationActive } from "@/lib/lab";

export const LAB_CONFIG_TABS = ["91_Lab_Config", "Lab configuration"] as const;
type LabRow = Record<string, string>;

export const FALLBACK_LAB_CONFIGS: LabConfiguration[] = [
  {
    configId: "LAB-WILLITFLY-001",
    gameId: "willitfly",
    gameName: "WillItFly",
    gamePath: "/lab/index.html",
    triggerDate: "2026-06-15",
    invitationTitle: "Play WillItFly",
    invitationBody: "Take a one-tap flight through the airport in the original WillIt Lab game.",
    cta: "Play WillItFly",
    active: true,
    reviewStatus: "Published",
    published: true,
    source: "fallback",
  },
];

function value(row: LabRow, ...names: string[]) {
  for (const name of names) {
    const candidate = String(row[name] ?? "").trim();
    if (candidate) return candidate;
  }
  return "";
}

export function mapLabConfiguration(row: LabRow): LabConfiguration {
  const fallback = FALLBACK_LAB_CONFIGS.find((item) =>
    item.configId === value(row, "ConfigID", "Config ID")
    || item.gameId === value(row, "GameID", "Game ID")
  ) ?? FALLBACK_LAB_CONFIGS[0]!;
  return {
    configId: value(row, "ConfigID", "Config ID") || fallback.configId,
    gameId: value(row, "GameID", "Game ID") || fallback.gameId,
    gameName: value(row, "Game Name", "GameName") || fallback.gameName,
    gamePath: value(row, "Game Path", "GamePath", "Destination URL") || fallback.gamePath,
    triggerDate: value(row, "Trigger Date", "TriggerDate") || fallback.triggerDate,
    invitationTitle: value(row, "Invitation Title", "Title") || fallback.invitationTitle,
    invitationBody: value(row, "Invitation Body", "Content") || fallback.invitationBody,
    cta: value(row, "CTA", "CTA Text") || fallback.cta,
    active: value(row, "Active") ? runtimeBoolean(value(row, "Active")) : true,
    reviewStatus: value(row, "Review Status", "Status"),
    published: runtimePublished(row),
    source: "sheet",
  };
}

async function loadLabConfigurations(): Promise<LabConfiguration[]> {
  const { rows } = await readFirstAvailableRuntimeTab<LabRow>(LAB_CONFIG_TABS);
  if (!rows) return FALLBACK_LAB_CONFIGS;
  return rows.map(mapLabConfiguration).filter((row) => row.published && row.active);
}

export const getLabConfigurations = cache(loadLabConfigurations);
