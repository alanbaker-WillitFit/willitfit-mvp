import { getCloudflareContext } from "@opennextjs/cloudflare";

type SheetRow = Record<string, string>;

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

const rowsCache = new Map<string, Promise<SheetRow[] | null>>();
let tokenCache: TokenCache | null = null;

function getRuntimeEnv(): Record<string, string | undefined> {
  try {
    return getCloudflareContext().env as Record<string, string | undefined>;
  } catch {
    return {};
  }
}

function getEnvValue(names: string[]): string | null {
  const runtimeEnv = getRuntimeEnv();

  for (const name of names) {
    const value = runtimeEnv[name] || process.env[name];
    if (value) return value;
  }

  return null;
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

async function getAccessToken(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);

  if (tokenCache && tokenCache.expiresAt > now + 60) {
    return tokenCache.accessToken;
  }

  const email = getEnvValue(["GOOGLE_SERVICE_ACCOUNT_EMAIL"]);
  const privateKey = getEnvValue(["GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"]);

  if (!email || !privateKey) {
    console.error("[googleSheets] Missing Google service account environment variables");
    return null;
  }

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

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
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
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
    access_token: string;
    expires_in: number;
  };

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in,
  };

  return data.access_token;
}

function valuesToRows(values: string[][]): SheetRow[] {
  if (!values || values.length < 2) return [];

  const headerRow = values[0];

  if (!headerRow) return [];

  const headers = headerRow.map((header) => String(header || "").trim());

  return values.slice(1).map((row) => {
    const record: SheetRow = {};

    headers.forEach((header, index) => {
      if (header) {
        record[header] = String(row[index] || "").trim();
      }
    });

    return record;
  });
}

async function readSheetRows(tabName: string): Promise<SheetRow[] | null> {
  try {
    const spreadsheetId = getEnvValue([
      "GOOGLE_SHEETS_SPREADSHEET_ID",
      "GOOGLE_SPREADSHEET_ID",
      "GOOGLE_SHEET_ID",
    ]);

    if (!spreadsheetId) {
      console.error("[googleSheets] Missing Google spreadsheet ID environment variable");
      return null;
    }

    const accessToken = await getAccessToken();

    if (!accessToken) {
      return null;
    }

    const range = encodeURIComponent(`${tabName}!A:Z`);

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
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

    const rows = valuesToRows(data.values || []);

    console.log(`[googleSheets] Read ${rows.length} rows from "${tabName}"`);

    return rows;
  } catch (err) {
    console.error(`[googleSheets] failed to read tab "${tabName}":`, err);
    return null;
  }
}

export async function getSheetRows<T extends Record<string, string>>(
  tabName: string
): Promise<T[] | null> {
  if (!rowsCache.has(tabName)) {
    rowsCache.set(tabName, readSheetRows(tabName));
  } else {
    console.log(`[googleSheets] Using cached rows for "${tabName}"`);
  }

  const rows = await rowsCache.get(tabName);

  return rows as T[] | null;
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