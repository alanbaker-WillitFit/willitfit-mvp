import { getSheetRowsFromSpreadsheet } from "@/services/googleSheets";
import type { Rc6TabReader } from "./runtimeReader";

export function createRc6RuntimeReader(spreadsheetId: string): Rc6TabReader {
  const resolvedSpreadsheetId = spreadsheetId.trim();
  if (!resolvedSpreadsheetId) {
    throw new Error("RC6 Runtime spreadsheet ID is required.");
  }

  return async <T extends Record<string, string>>(tabName: string): Promise<T[] | null> =>
    getSheetRowsFromSpreadsheet<T>(tabName, resolvedSpreadsheetId);
}
