import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

/**
 * WillItFit treats the Google Sheet as its CMS. This module is the ONLY
 * place that talks to the Sheets API. Everything in /services/*.ts maps
 * raw rows into typed domain objects — no airline (or tip, or affiliate)
 * data is ever hardcoded anywhere else in the app.
 */

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

let docPromise: Promise<GoogleSpreadsheet> | null = null;

function getCredentials() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!spreadsheetId || !email || !key) {
    return null;
  }

  return {
    spreadsheetId,
    email,
    // .env files commonly escape newlines — restore them.
    key: key.replace(/\\n/g, "\n"),
  };
}

/**
 * Returns a connected GoogleSpreadsheet instance, memoized for the life of
 * the server process. Returns null if credentials are missing or the
 * connection fails — callers must handle this and fall back gracefully.
 */
async function getDoc(): Promise<GoogleSpreadsheet | null> {
  const creds = getCredentials();
  if (!creds) return null;

  if (!docPromise) {
    docPromise = (async () => {
      const auth = new JWT({
        email: creds.email,
        key: creds.key,
        scopes: SCOPES,
      });
      const doc = new GoogleSpreadsheet(creds.spreadsheetId, auth);
      await doc.loadInfo();
      return doc;
    })();
  }

  try {
    return await docPromise;
  } catch (err) {
    // Reset so a future request can retry instead of replaying the same
    // rejected promise forever.
    docPromise = null;
    console.error("[googleSheets] failed to connect:", err);
    return null;
  }
}

/**
 * Fetches every row of a named worksheet tab as plain objects keyed by
 * header. Returns null on any failure (missing tab, auth error, network
 * issue) so callers can fall back to local data instead of crashing a page.
 */
export async function getSheetRows<T extends Record<string, string>>(
  tabName: string
): Promise<T[] | null> {
  try {
    const doc = await getDoc();
    if (!doc) return null;

    const sheet: GoogleSpreadsheetWorksheet | undefined = doc.sheetsByTitle[tabName];
    if (!sheet) {
      console.error(`[googleSheets] tab "${tabName}" not found in spreadsheet`);
      return null;
    }

    const rows = await sheet.getRows();
console.log("===== FIRST ROW =====");
console.log(rows[0].toObject());
console.log("=====================");
console.log(`[googleSheets] Read ${rows.length} rows from "${tabName}"`);
    return rows.map((row) => row.toObject() as T);
  } catch (err) {
    console.error(`[googleSheets] failed to read tab "${tabName}":`, err);
    return null;
  }
}

export function isLive(status: string | undefined): boolean {
  return (status ?? "").trim().toLowerCase() === "live";
}

export function toNumber(value: string | undefined, fallback = 0): number {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : fallback;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
