import { cache } from "react";
import type { LabConfiguration } from "@/types";
import { readFirstAvailableRuntimeTab, runtimeBoolean, runtimePublished } from "./runtimeContent";
import { toNumber } from "./googleSheets";
import { LAB_CONFIG_TABS } from "./runtimeSources";
export { LAB_CONFIG_TABS } from "./runtimeSources";
export { isLabInvitationActive } from "@/lib/lab";

type LabRow = Record<string, string>;

// Static route catalogue for the two certified game assets. These entries are
// deliberately unpublished and can never create a result-card invitation.
export const STATIC_LAB_GAMES: LabConfiguration[] = [
  {
    configId: "LAB-WILLITFLY-001",
    gameId: "willitfly",
    gameName: "WillItFly",
    gamePath: "/lab/index.html",
    triggerType: "Code",
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
  const fallback = STATIC_LAB_GAMES.find((item) =>
    item.configId === value(row, "ConfigID", "Config ID")
    || item.gameId === value(row, "GameID", "Game ID")
  ) ?? STATIC_LAB_GAMES[0]!;
  return {
    configId: value(row, "ConfigID", "Config ID") || fallback.configId,
    gameId: value(row, "GameID", "Game ID") || fallback.gameId,
    gameName: value(row, "Game Name", "GameName") || fallback.gameName,
    gamePath: value(row, "Game Path", "GamePath", "Destination URL") || fallback.gamePath,
    triggerType: value(row, "Trigger Type", "TriggerType") || "Code",
    bagTypes: parseBagTypes(value(row, "Bag Type", "Bag Types", "Applies To Bag")),
    resultStates: parseResultStates(value(row, "Result State", "Result States", "Applies To Result")),
    priority: toNumber(value(row, "Priority", "Display Order"), fallback.priority),
    implementationReference: value(row, "Implementation Reference", "Reference Date"),
    invitationTitle: value(row, "Invitation Title", "Title") || fallback.invitationTitle,
    invitationBody: value(row, "Invitation Body", "Content") || fallback.invitationBody,
    cta: value(row, "CTA", "CTA Text") || fallback.cta,
    active: value(row, "Active") ? runtimeBoolean(value(row, "Active")) : true,
    reviewStatus: value(row, "Review Status", "Status"),
    published: runtimePublished(row),
    source: "sheet",
  };
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

async function loadLabConfigurations(): Promise<LabConfiguration[]> {
  const { rows } = await readFirstAvailableRuntimeTab<LabRow>(LAB_CONFIG_TABS);
  if (!rows) return STATIC_LAB_GAMES;
  return rows.map(mapLabConfiguration).filter((row) => row.published && row.active);
}

export const getLabConfigurations = cache(loadLabConfigurations);
