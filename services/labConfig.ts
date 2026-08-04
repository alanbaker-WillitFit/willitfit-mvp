import { cache } from "react";
import type { LabConfiguration } from "@/types";
import { readFirstAvailableRuntimeTab, runtimeBoolean, runtimePublished } from "./runtimeContent";
import { toNumber } from "./googleSheets";
import { LAB_CONFIG_TABS, LAB_GAME_TABS } from "./runtimeSources";
export { LAB_CONFIG_TABS, LAB_GAME_TABS } from "./runtimeSources";
export { isLabInvitationActive } from "@/lib/lab";

type LabRow = Record<string, string>;
type LabGame = {
  gameId: string;
  gameName: string;
  gamePath: string;
  invitationDestination: string;
  active: boolean;
  published: boolean;
};

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

function mapLabGame(row: LabRow): LabGame {
  return {
    gameId: value(row, "Game ID", "GameID"),
    gameName: value(row, "Game Name", "GameName"),
    gamePath: value(row, "Game Path", "GamePath"),
    invitationDestination: value(row, "Invitation Destination", "Destination"),
    active: runtimeBoolean(value(row, "Active")),
    published: runtimePublished(row),
  };
}

export function mapLabConfiguration(row: LabRow, game?: LabGame): LabConfiguration {
  const gameId = value(row, "Game ID", "GameID") || game?.gameId || "";
  const fallback = STATIC_LAB_GAMES.find((item) => item.gameId === gameId);

  return {
    configId: value(row, "Lab ID", "LabID", "Config ID", "ConfigID"),
    gameId,
    gameName: value(row, "Game Name", "GameName") || game?.gameName || fallback?.gameName || "",
    gamePath: value(row, "Game Path", "GamePath", "Game URL") || game?.gamePath || fallback?.gamePath || "",
    triggerType: value(row, "Trigger Type", "TriggerType") || "Code",
    triggerValue: value(row, "Trigger Value", "TriggerValue", "Code", "Unlock Code"),
    bagTypes: parseBagTypes(value(row, "Bag Type", "Bag Types", "Applies To Bag")),
    resultStates: parseResultStates(value(row, "Result State", "Result States", "Applies To Result")),
    priority: toNumber(value(row, "Priority", "Display Order"), fallback?.priority ?? 999),
    implementationReference: value(row, "Implementation Reference", "Reference Date") || fallback?.implementationReference || "",
    invitationTitle: value(row, "Invitation Title", "Title") || fallback?.invitationTitle || game?.gameName || "",
    invitationBody: value(row, "Invitation Body", "Invitation Message", "Content") || fallback?.invitationBody || "",
    cta: value(row, "CTA", "CTA Text") || fallback?.cta || (game?.gameName ? `Play ${game.gameName}` : ""),
    active: runtimeBoolean(value(row, "Active")) && (game ? game.active : true),
    reviewStatus: value(row, "Review Status", "Status"),
    published: runtimePublished(row) && (game ? game.published : true),
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
  const [{ rows: configRows }, { rows: gameRows }] = await Promise.all([
    readFirstAvailableRuntimeTab<LabRow>(LAB_CONFIG_TABS),
    readFirstAvailableRuntimeTab<LabRow>(LAB_GAME_TABS),
  ]);

  if (!configRows || !gameRows) return STATIC_LAB_GAMES;

  const games = gameRows.map(mapLabGame);
  const duplicateGameIds = duplicateValues(games.map((game) => game.gameId).filter(Boolean));
  const duplicateDestinations = duplicateValues(games.map((game) => game.invitationDestination).filter(Boolean));
  const validGames = games.filter((game) =>
    game.gameId &&
    game.gameName &&
    game.gamePath.startsWith("/lab/") &&
    game.invitationDestination.startsWith("/lab/") &&
    !duplicateGameIds.has(game.gameId) &&
    !duplicateDestinations.has(game.invitationDestination)
  );
  const gamesByDestination = new Map(validGames.map((game) => [game.invitationDestination, game]));

  const mapped = configRows.map((row) => {
    const destination = value(row, "Destination");
    return mapLabConfiguration(row, gamesByDestination.get(destination));
  });
  const published = mapped.filter((config) => config.published);
  const invalid = published.filter((config) => !isValidLabConfiguration(config));

  if (duplicateGameIds.size || duplicateDestinations.size) {
    console.error("[lab] Duplicate Lab game catalogue data", {
      gameIds: Array.from(duplicateGameIds),
      destinations: Array.from(duplicateDestinations),
    });
  }
  if (invalid.length > 0) {
    console.error("[lab] Rejected incomplete or unsupported published Lab invitations", invalid.map((config) => config.configId));
  }

  const valid = published.filter(isValidLabConfiguration);
  const duplicateConfigIds = duplicateValues(valid.map((config) => config.configId));
  return valid.filter((config) => !duplicateConfigIds.has(config.configId));
}

export const getLabConfigurations = cache(loadLabConfigurations);
