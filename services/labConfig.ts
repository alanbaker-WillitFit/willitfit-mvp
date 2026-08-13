import { cache } from "react";
import type { LabConfiguration } from "@/types";
import { readFirstAvailableRuntimeTab, runtimeBoolean, runtimePublished } from "./runtimeContent";
import { toNumber } from "./googleSheets";
import { LAB_CONFIG_TABS } from "./runtimeSources";
export { LAB_CONFIG_TABS } from "./runtimeSources";
export { isLabInvitationActive } from "@/lib/lab";

type LabRow = Record<string, string>;

// Static route catalogue for certified game assets. These entries are
// deliberately unpublished and can never create a result-card invitation.
export const STATIC_LAB_GAMES: LabConfiguration[] = [
  {
    configId: "LAB-WILLITFLY-001",
    gameId: "willitfly",
    gameName: "WillItFly",
    gamePath: "/lab/index.html",
    triggerType: "Code",
    triggerValue: "15 06 26",
    bagTypes: ["cabinBag", "personalItem"],
    resultStates: ["fits", "close", "no-fit"],
    priority: 20,
    implementationReference: "2026-06-15",
    invitationTitle: "Play WillItFly",
    invitationBody: "Take a one-tap flight through the airport in the original WillIt Lab game.",
    cta: "Play WillItFly",
    active: true,
    reviewStatus: "Published",
    published: false,
    source: "fallback",
  },
  {
    configId: "LAB-GATERUSH-001",
    gameId: "gate-rush",
    gameName: "Gate Rush",
    gamePath: "/lab/gate-rush.html",
    triggerType: "Code",
    triggerValue: "",
    bagTypes: ["cabinBag", "personalItem"],
    resultStates: ["fits", "close", "no-fit"],
    priority: 10,
    implementationReference: "2026-06-22",
    invitationTitle: "Play Gate Rush",
    invitationBody: "Beat the crowds and cross ten airport stages against the clock.",
    cta: "Play Gate Rush",
    active: true,
    reviewStatus: "Published",
    published: false,
    source: "fallback",
  },
];
export const FALLBACK_LAB_CONFIGS = STATIC_LAB_GAMES;

function value(row: LabRow, ...names: string[]) {
  for (const name of names) {
    const candidate = String(row[name] ?? "").trim();
    if (candidate) return candidate;
  }
  return "";
}

export function mapLabConfiguration(row: LabRow): LabConfiguration {
  const configId = value(row, "Lab ID", "LabID", "Config ID", "ConfigID");
  const gameId = value(row, "Game ID", "GameID");
  const fallback = STATIC_LAB_GAMES.find((item) => item.gameId === gameId);

  return {
    configId,
    gameId,
    gameName: value(row, "Game Name", "GameName") || fallback?.gameName || "",
    gamePath: value(row, "Game Path", "GamePath", "Destination URL", "Game URL") || fallback?.gamePath || "",
    triggerType: value(row, "Trigger Type", "TriggerType") || "Code",
    triggerValue: value(row, "Trigger Value", "TriggerValue", "Code", "Unlock Code"),
    bagTypes: parseBagTypes(value(row, "Bag Type", "Bag Types", "Applies To Bag")),
    resultStates: parseResultStates(value(row, "Result State", "Result States", "Applies To Result")),
    priority: toNumber(value(row, "Priority", "Display Order"), fallback?.priority ?? 999),
    implementationReference: value(row, "Implementation Reference", "Reference Date") || fallback?.implementationReference || "",
    invitationTitle: value(row, "Invitation Title", "Title") || fallback?.invitationTitle || "",
    invitationBody: value(row, "Invitation Body", "Content") || fallback?.invitationBody || "",
    cta: value(row, "CTA", "CTA Text") || fallback?.cta || "",
    active: runtimeBoolean(value(row, "Active")),
    reviewStatus: value(row, "Review Status", "Status"),
    published: runtimePublished(row),
    source: "sheet",
  };
}

export function isValidLabConfiguration(config: LabConfiguration): boolean {
  return Boolean(
    config.source === "sheet" &&
    config.configId.trim() &&
    config.gameId.trim() &&
    config.gameName.trim() &&
    config.gamePath.startsWith("/lab/") &&
    config.triggerType.trim().toLowerCase() === "code" &&
    config.triggerValue.trim() &&
    config.bagTypes.length &&
    config.resultStates.length &&
    config.invitationTitle.trim() &&
    config.invitationBody.trim() &&
    config.cta.trim() &&
    config.active &&
    config.published
  );
}

function tokens(input: string): string[] {
  return input.split(/[,;|]/).map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function parseBagTypes(input: string): LabConfiguration["bagTypes"] {
  const values = tokens(input);
  if (values.length === 0 || values.some((item) => ["all", "any"].includes(item))) {
    return ["cabinBag", "personalItem"];
  }
  return Array.from(new Set(values.flatMap((item) => {
    if (item.includes("personal") || item.includes("underseat")) return ["personalItem" as const];
    if (item.includes("cabin") || item.includes("carry")) return ["cabinBag" as const];
    return [];
  })));
}

function parseResultStates(input: string): LabConfiguration["resultStates"] {
  const values = tokens(input);
  if (values.length === 0 || values.some((item) => ["all", "any"].includes(item))) {
    return ["fits", "close", "no-fit"];
  }
  return Array.from(new Set(values.flatMap((item) => {
    if (item === "fit" || item === "fits" || item === "pass") return ["fits" as const];
    if (item.includes("close")) return ["close" as const];
    if (item.includes("fail") || item.includes("no-fit") || item.includes("too large")) return ["no-fit" as const];
    return [];
  })));
}

function duplicateValues(values: string[]): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const item of values) {
    if (seen.has(item)) duplicates.add(item);
    else seen.add(item);
  }
  return duplicates;
}

async function loadLabConfigurations(): Promise<LabConfiguration[]> {
  const { rows } = await readFirstAvailableRuntimeTab<LabRow>(LAB_CONFIG_TABS);
  if (!rows) return STATIC_LAB_GAMES;

  const published = rows.map(mapLabConfiguration).filter((config) => config.published);
  const missingIds = published.filter((config) => !config.configId || !config.gameId);
  const inactive = published.filter((config) => config.configId && config.gameId && !config.active);
  const invalid = published.filter((config) => config.configId && config.gameId && config.active && !isValidLabConfiguration(config));

  if (missingIds.length > 0) {
    console.error("[lab] Rejected published Lab configurations without Lab ID or Game ID", { count: missingIds.length });
  }
  if (inactive.length > 0) {
    console.error("[lab] Rejected published Lab configurations without explicit Active approval", inactive.map((config) => config.configId));
  }
  if (invalid.length > 0) {
    console.error("[lab] Rejected incomplete or invalid published Lab configurations", invalid.map((config) => config.configId));
  }

  const valid = published.filter(isValidLabConfiguration);
  const duplicateConfigIds = duplicateValues(valid.map((config) => config.configId));
  const duplicateGameIds = duplicateValues(valid.map((config) => config.gameId));
  if (duplicateConfigIds.size || duplicateGameIds.size) {
    console.error("[lab] Duplicate published Lab configuration data", {
      configIds: Array.from(duplicateConfigIds),
      gameIds: Array.from(duplicateGameIds),
    });
  }

  return valid.filter(
    (config) => !duplicateConfigIds.has(config.configId) && !duplicateGameIds.has(config.gameId),
  );
}

export const getLabConfigurations = cache(loadLabConfigurations);
