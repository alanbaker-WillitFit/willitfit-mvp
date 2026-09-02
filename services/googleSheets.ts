import { getCloudflareContext } from "@opennextjs/cloudflare";
import { validateSheetHeaders } from "./sheetSchemas";

type SheetRow = Record<string, string>;

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

type RowsCacheEntry = {
  promise: Promise<SheetRow[] | null>;
  expiresAt: number;
};

type LastGoodRowsEntry = {
  rows: SheetRow[];
  validatedAt: string;
};

export type SheetDiagnostic = {
  tabName: string;
  state: "fresh" | "cached" | "failed" | "empty";
  rowCount: number;
  fetchedAt: string | null;
  error: string | null;
  schemaValid: boolean;
  missingHeaders: string[];
  duplicateHeaders: string[];
};

const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";
const DEFAULT_REVALIDATE_SECONDS = 3600;
const FAILED_READ_RETRY_SECONDS = 60;
const REQUEST_TIMEOUT_MS = 8000;
const DEFAULT_SPREADSHEET_ENV_NAMES = [
  "GOOGLE_SHEETS_SPREADSHEET_ID",
  "GOOGLE_SPREADSHEET_ID",
  "GOOGLE_SHEET_ID",
] as const;

const rowsCache = new Map<string, RowsCacheEntry>();
const lastGoodRows = new Map<string, LastGoodRowsEntry>();
const sheetDiagnostics = new Map<string, SheetDiagnostic>();
let tokenCache: TokenCache | null = null;
let tokenRequest: Promise<string | null> | null = null;

function getRuntimeEnv(): Record<string, string | undefined> {
  try {
    return getCloudflareContext().env as Record<string, string | undefined>;
  } catch {
    return {};
  }
}

function getEnvValue(names: readonly string[]): string | null {
  const runtimeEnv = getRuntimeEnv();

  for (const name of names) {
    const value = runtimeEnv[name] || process.env[name];
    if (value) return value;
  }

  return null;
}

function getSheetRevalidateSeconds(): number {
  const raw = getEnvValue(["SHEET_REVALIDATE_SECONDS"]);
  const seconds = Number(raw);

  return Number.isFinite(seconds) && seconds > 0
    ? seconds
    : DEFAULT_REVALIDATE_SECONDS;
}

function sheetCacheKey(spreadsheetId: string, tabName: string): string {
  return `${spreadsheetId}::${tabName}`;
}

function base64UrlEncode(input: string | ArrayBuffer): string {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);

  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function privateKeyToArrayBuffer(privateKey: string): ArrayBuffer {
  const normalisedKey = privateKey.replace(/\\n/g, "\n");

  const pemBody = normalisedKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binary = atob(pemBody);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

async function signJwt(unsignedJwt: string, privateKey: string): Promise<string> {
  const keyData = privateKeyToArrayBuffer(privateKey);

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedJwt)
  );

  return `${unsignedJwt}.${base64UrlEncode(signature)}`;
}

async function requestAccessToken(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  const email = getEnvValue(["GOOGLE_SERVICE_ACCOUNT_EMAIL"]);
  const privateKey = getEnvValue(["GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"]);

  if (!email || !privateKey) {
    console.error("[googleSheets] Missing Google service account environment variables");
    return null;
  }

  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: email,
    scope: SCOPES,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const unsignedJwt = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(claimSet)
  )}`;
  const signedJwt = await signJwt(unsignedJwt, privateKey);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `[googleSheets] Failed to obtain Google access token: ${response.status} ${errorText}`
    );
    return null;
  }

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!data.access_token || !Number.isFinite(data.expires_in) || Number(data.expires_in) <= 0) {
    console.error("[googleSheets] Google token response was incomplete");
    return null;
  }

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + Number(data.expires_in),
  };
  return data.access_token;
}

async function getAccessToken(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.expiresAt > now + 60) return tokenCache.accessToken;

  if (!tokenRequest) {
    tokenRequest = requestAccessToken().finally(() => {
      tokenRequest = null;
    });
  }

  return tokenRequest;
}

function findHeaderRowIndex(tabName: string, values: string[][]): number {
  const scanLimit = Math.min(values.length, 12);
  for (let index = 0; index < scanLimit; index += 1) {
    if (validateSheetHeaders(tabName, values[index] || []).valid) return index;
  }
  return 0;
}

function valuesToRows(values: string[][], headerRowIndex = 0): SheetRow[] {
  if (!values || values.length <= headerRowIndex + 1) return [];

  const headerRow = values[headerRowIndex];
  if (!headerRow) return [];

  const headers = headerRow.map((header) => String(header || "").trim());

  return values.slice(headerRowIndex + 1).flatMap((row) => {
    const hasData = row.some((cell) => String(cell ?? "").trim().length > 0);
    if (!hasData) return [];

    const record: SheetRow = {};
    headers.forEach((header, index) => {
      if (header && !(header in record)) {
        record[header] = String(row[index] || "").trim();
      }
    });
    return [record];
  });
}

async function readSheetRowsFromSpreadsheet(
  tabName: string,
  spreadsheetId: string,
): Promise<SheetRow[] | null> {
  const cacheKey = sheetCacheKey(spreadsheetId, tabName);

  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return null;
    }

    const range = encodeURIComponent(`'${tabName}'!A:ZZ`);
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        `[googleSheets] Failed to read tab "${tabName}": ${response.status} ${errorText}`
      );

      return null;
    }

    const data = (await response.json()) as {
      values?: string[][];
    };

    const values = data.values || [];
    if (values.length === 0) {
      sheetDiagnostics.set(cacheKey, {
        tabName,
        state: "empty",
        rowCount: 0,
        fetchedAt: new Date().toISOString(),
        error: null,
        schemaValid: true,
        missingHeaders: [],
        duplicateHeaders: [],
      });
      return [];
    }
    const headerRowIndex = findHeaderRowIndex(tabName, values);
    const headerValidation = validateSheetHeaders(tabName, values[headerRowIndex] || []);

    if (!headerValidation.valid) {
      const error = headerValidation.missingHeaders.length > 0
        ? "Required Sheet columns are missing"
        : "Duplicate Sheet columns were found";

      sheetDiagnostics.set(cacheKey, {
        tabName,
        state: "failed",
        rowCount: 0,
        fetchedAt: new Date().toISOString(),
        error,
        schemaValid: false,
        missingHeaders: headerValidation.missingHeaders,
        duplicateHeaders: headerValidation.duplicateHeaders,
      });
      console.error(`[googleSheets] Invalid schema for tab "${tabName}"`, headerValidation);
      return null;
    }

    const rows = valuesToRows(values, headerRowIndex);
    sheetDiagnostics.set(cacheKey, {
      tabName,
      state: rows.length > 0 ? "fresh" : "empty",
      rowCount: rows.length,
      fetchedAt: new Date().toISOString(),
      error: null,
      schemaValid: true,
      missingHeaders: [],
      duplicateHeaders: [],
    });

    return rows;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    sheetDiagnostics.set(cacheKey, {
      tabName,
      state: "failed",
      rowCount: 0,
      fetchedAt: new Date().toISOString(),
      error: message.includes("timeout") ? "Sheet request timed out" : "Sheet request failed",
      schemaValid: false,
      missingHeaders: [],
      duplicateHeaders: [],
    });
    console.error(`[googleSheets] failed to read tab "${tabName}":`, err);
    return null;
  }
}

export async function getSheetRowsFromSpreadsheet<T extends Record<string, string>>(
  tabName: string,
  spreadsheetId: string,
): Promise<T[] | null> {
  const resolvedSpreadsheetId = spreadsheetId.trim();
  if (!resolvedSpreadsheetId) {
    console.error("[googleSheets] Explicit spreadsheet ID is required");
    return null;
  }

  const cacheKey = sheetCacheKey(resolvedSpreadsheetId, tabName);
  const now = Date.now();
  const cached = rowsCache.get(cacheKey);
  const refreshing = !cached || cached.expiresAt <= now;

  if (refreshing) {
    const revalidateMs = getSheetRevalidateSeconds() * 1000;

    rowsCache.set(cacheKey, {
      promise: readSheetRowsFromSpreadsheet(tabName, resolvedSpreadsheetId),
      expiresAt: now + revalidateMs,
    });
  }

  const entry = rowsCache.get(cacheKey);
  const rows = await entry?.promise;
  const diagnostic = sheetDiagnostics.get(cacheKey);

  if (rows !== null && rows !== undefined) {
    if (refreshing) {
      lastGoodRows.set(cacheKey, {
        rows,
        validatedAt: diagnostic?.fetchedAt || new Date().toISOString(),
      });
    } else if (diagnostic && diagnostic.state === "fresh") {
      sheetDiagnostics.set(cacheKey, { ...diagnostic, state: "cached" });
    }

    return rows as T[];
  }

  if (entry && rowsCache.get(cacheKey) === entry) {
    const retryMs = FAILED_READ_RETRY_SECONDS * 1000;
    rowsCache.set(cacheKey, { ...entry, expiresAt: now + retryMs });
  }

  const lastGood = lastGoodRows.get(cacheKey);
  if (lastGood) {
    sheetDiagnostics.set(cacheKey, {
      tabName,
      state: "cached",
      rowCount: lastGood.rows.length,
      fetchedAt: lastGood.validatedAt,
      error: diagnostic?.error || "Live Sheet refresh failed; serving last-known-good validated data",
      schemaValid: diagnostic?.schemaValid ?? true,
      missingHeaders: diagnostic?.missingHeaders || [],
      duplicateHeaders: diagnostic?.duplicateHeaders || [],
    });
    return lastGood.rows as T[];
  }

  return null;
}

export async function getSheetRows<T extends Record<string, string>>(
  tabName: string
): Promise<T[] | null> {
  const spreadsheetId = getEnvValue(DEFAULT_SPREADSHEET_ENV_NAMES);
  if (!spreadsheetId) {
    console.error("[googleSheets] Missing Google spreadsheet ID environment variable");
    return null;
  }

  return getSheetRowsFromSpreadsheet<T>(tabName, spreadsheetId);
}

export function isLive(status: string | undefined): boolean {
  const s = (status ?? "").trim().toLowerCase();

  return s === "active" || s === "live";
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

export function getSheetDiagnostics(): SheetDiagnostic[] {
  return Array.from(sheetDiagnostics.values()).sort((a, b) => a.tabName.localeCompare(b.tabName));
}

export function clearSheetCaches(): void {
  rowsCache.clear();
  lastGoodRows.clear();
  sheetDiagnostics.clear();
}

export function getRuntimeSourceConfiguration(): {
  configured: boolean;
  spreadsheetId: string | null;
  authenticationConfigured: boolean;
} {
  const spreadsheetId = getEnvValue(DEFAULT_SPREADSHEET_ENV_NAMES);
  return {
    configured: Boolean(spreadsheetId),
    spreadsheetId,
    authenticationConfigured: Boolean(
      getEnvValue(["GOOGLE_SERVICE_ACCOUNT_EMAIL"])
      && getEnvValue(["GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"])
    ),
  };
}
