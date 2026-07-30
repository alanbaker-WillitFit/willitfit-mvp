import { cache } from "react";
import type { SpecialBaggageCategoryId, SpecialBaggageResult } from "@/types";
import { readFirstAvailableRuntimeTab, runtimeBoolean, runtimePublished } from "./runtimeContent";
import { toNumber } from "./googleSheets";
import { SPECIAL_BAGGAGE_RESULT_TABS } from "./runtimeSources";

export { SPECIAL_BAGGAGE_RESULT_TABS } from "./runtimeSources";

type SpecialBaggageRow = Record<string, string>;

export const SPECIAL_BAGGAGE_CATEGORY_IDS: SpecialBaggageCategoryId[] = [
  "buggies-prams",
  "bicycles",
  "wheelchairs",
  "mobility-scooters",
  "golf-bags",
  "skis-snowboards",
  "child-car-seats",
  "surfboards-longboards",
  "musical-instruments",
  "scuba-diving-equipment",
  "fishing-equipment",
  "large-musical-instruments",
  "kiteboards-wakeboards",
  "medical-equipment-cases",
];

const CATEGORY_BY_RESULT_ID: Record<string, SpecialBaggageCategoryId> = {
  SBR001: "buggies-prams",
  SBR002: "bicycles",
  SBR003: "wheelchairs",
  SBR004: "mobility-scooters",
  SBR005: "golf-bags",
  SBR006: "skis-snowboards",
  SBR007: "child-car-seats",
  SBR008: "surfboards-longboards",
  SBR009: "musical-instruments",
  SBR010: "scuba-diving-equipment",
  SBR011: "fishing-equipment",
  SBR012: "large-musical-instruments",
  SBR013: "kiteboards-wakeboards",
  SBR014: "medical-equipment-cases",
};

function value(row: SpecialBaggageRow, ...names: string[]): string {
  for (const name of names) {
    const candidate = String(row[name] ?? "").trim();
    if (candidate) return candidate;
  }
  return "";
}

function linkedItemIds(input: string): string[] {
  return input.split(/[;,|]/).map((item) => item.trim()).filter(Boolean);
}

export function mapSpecialBaggageResult(row: SpecialBaggageRow): SpecialBaggageResult | null {
  const resultId = value(row, "Result ID", "ResultID").toUpperCase();
  const categoryId = CATEGORY_BY_RESULT_ID[resultId];
  if (!categoryId) return null;

  return {
    resultId,
    rank: toNumber(value(row, "Result Rank", "Rank"), 0),
    categoryId,
    category: value(row, "Result Category", "Category"),
    linkedItemIds: linkedItemIds(value(row, "Linked Item IDs", "LinkedItemIDs")),
    title: value(row, "Result Title", "Title"),
    summary: value(row, "Result Summary", "Summary"),
    preparationGuidance: value(row, "Preparation Guidance"),
    feeGuidance: value(row, "Fee Guidance"),
    policyLinkLabel: value(row, "Policy Link Label"),
    policyLinkSource: value(row, "Policy Link Source"),
    mobilityOrMedical: runtimeBoolean(value(row, "Mobility or Medical Result", "MobilityOrMedical")),
    reviewStatus: value(row, "Review Status", "Status"),
    published: runtimePublished(row),
    notes: value(row, "Notes"),
    source: "sheet",
  };
}

export function validateSpecialBaggageCatalogue(rows: SpecialBaggageResult[]): SpecialBaggageResult[] {
  const published = rows.filter((row) => row.published);
  const ids = new Set(published.map((row) => row.categoryId));
  if (published.length !== SPECIAL_BAGGAGE_CATEGORY_IDS.length || ids.size !== SPECIAL_BAGGAGE_CATEGORY_IDS.length) {
    return [];
  }
  if (SPECIAL_BAGGAGE_CATEGORY_IDS.some((id) => !ids.has(id))) return [];
  return [...published].sort((a, b) => a.rank - b.rank);
}

async function loadSpecialBaggageResults(): Promise<SpecialBaggageResult[]> {
  const { rows } = await readFirstAvailableRuntimeTab<SpecialBaggageRow>(SPECIAL_BAGGAGE_RESULT_TABS);
  if (!rows) return [];
  const mapped = rows.map(mapSpecialBaggageResult).filter((row): row is SpecialBaggageResult => row !== null);
  return validateSpecialBaggageCatalogue(mapped);
}

export const getSpecialBaggageResults = cache(loadSpecialBaggageResults);
