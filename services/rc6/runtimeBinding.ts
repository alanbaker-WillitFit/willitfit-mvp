import { getSheetRowsFromSpreadsheet } from "@/services/googleSheets";
import { getRc6CheckerCatalogue, type Rc6CheckerCatalogue } from "./checker";
import { getRc6CommercialCatalogue, type Rc6CommercialCatalogue } from "./commercial";
import type { Rc6TabReader } from "./runtimeReader";

export const RC6_RUNTIME_SPREADSHEET_ENV = "RC6_RUNTIME_SPREADSHEET_ID" as const;

export function createRc6RuntimeReader(spreadsheetId: string): Rc6TabReader {
  const resolvedSpreadsheetId = spreadsheetId.trim();
  if (!resolvedSpreadsheetId) {
    throw new Error("RC6 Runtime spreadsheet ID is required.");
  }

  return async <T extends Record<string, string>>(tabName: string): Promise<T[] | null> =>
    getSheetRowsFromSpreadsheet<T>(tabName, resolvedSpreadsheetId);
}

export function resolveRc6RuntimeSpreadsheetId(
  env: Readonly<Record<string, string | undefined>> = process.env,
): string | null {
  const value = String(env[RC6_RUNTIME_SPREADSHEET_ENV] ?? "").trim();
  return value || null;
}

export async function loadRc6CheckerCatalogueFromSpreadsheet(
  spreadsheetId: string,
): Promise<Rc6CheckerCatalogue | null> {
  return getRc6CheckerCatalogue(createRc6RuntimeReader(spreadsheetId));
}

export async function loadRc6CommercialCatalogueFromSpreadsheet(
  spreadsheetId: string,
): Promise<Rc6CommercialCatalogue | null> {
  return getRc6CommercialCatalogue(createRc6RuntimeReader(spreadsheetId));
}

export async function loadRc6DraftCheckerCatalogue(
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<Rc6CheckerCatalogue | null> {
  const spreadsheetId = resolveRc6RuntimeSpreadsheetId(env);
  if (!spreadsheetId) return null;
  return loadRc6CheckerCatalogueFromSpreadsheet(spreadsheetId);
}

export async function loadRc6DraftCommercialCatalogue(
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<Rc6CommercialCatalogue | null> {
  const spreadsheetId = resolveRc6RuntimeSpreadsheetId(env);
  if (!spreadsheetId) return null;
  return loadRc6CommercialCatalogueFromSpreadsheet(spreadsheetId);
}
