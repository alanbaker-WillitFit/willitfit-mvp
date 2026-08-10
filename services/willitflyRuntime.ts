import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  resolvePublishedNavigationRoutes,
  type RuntimeNavigationRoute,
} from "@/lib/willitflyNavigation";
import {
  resolvePublishedLayerCards,
  type RuntimeLayerCard,
  type WillItFlyLayerId,
} from "@/lib/willitflyLayerEngine";

type RuntimeRow = Record<string, string>;

type Destination = {
  destinationId: string;
  destinationType: string;
  displayName: string;
  parentDestinationId?: string;
  countryId: string;
  regionId?: string;
  slug: string;
  aliases: string[];
  latitude: number | null;
  longitude: number | null;
  displayFlagCode?: string;
  displayFlagEmoji?: string;
  countryFlagAssetId?: string;
};

type TravelTime = {
  originMarketId: string;
  originDisplayName: string;
  destinationId: string;
  averageFlightMinutes: number;
};

export type WillItFlyRuntimeBundle = {
  configured: boolean;
  previewMode: boolean;
  destinations: Destination[];
  layerCards: RuntimeLayerCard[];
  navigationRoutes: RuntimeNavigationRoute[];
  travelTimes: TravelTime[];
};

const REQUEST_TIMEOUT_MS = 8000;
const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";
let accessTokenCache: { token: string; expiresAt: number } | null = null;

function runtimeEnv(): Record<string, string | undefined> {
  try {
    return getCloudflareContext().env as Record<string, string | undefined>;
  } catch {
    return process.env;
  }
}

function envValue(...names: string[]): string | null {
  const env = runtimeEnv();
  for (const name of names) {
    const value = env[name] || process.env[name];
    if (value) return value;
  }
  return null;
}

function booleanValue(value: string | undefined): boolean {
  return ["yes", "true", "1", "active", "published"].includes(String(value ?? "").trim().toLowerCase());
}

function numberValue(value: string | undefined): number | null {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function base64UrlEncode(input: string | ArrayBuffer): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function privateKeyToArrayBuffer(privateKey: string): ArrayBuffer {
  const body = privateKey
    .replace(/\\n/g, "\n")
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

async function getAccessToken(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (accessTokenCache && accessTokenCache.expiresAt > now + 60) return accessTokenCache.token;

  const email = envValue("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = envValue("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
  if (!email || !privateKey) return null;

  const unsigned = `${base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64UrlEncode(JSON.stringify({
    iss: email,
    scope: SCOPES,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }))}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyToArrayBuffer(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const assertion = `${unsigned}.${base64UrlEncode(signature)}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) return null;
  const data = await response.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;
  accessTokenCache = { token: data.access_token, expiresAt: now + Number(data.expires_in || 3600) };
  return data.access_token;
}

function rowsFromValues(values: string[][]): RuntimeRow[] {
  if (values.length < 2) return [];
  const headers = values[0].map((value) => String(value ?? "").trim());
  return values.slice(1).flatMap((row) => {
    if (!row.some((value) => String(value ?? "").trim())) return [];
    const record: RuntimeRow = {};
    headers.forEach((header, index) => {
      if (header) record[header] = String(row[index] ?? "").trim();
    });
    return [record];
  });
}

async function readTab(tabName: string): Promise<RuntimeRow[]> {
  const spreadsheetId = envValue("WILLITFLY_RUNTIME_SPREADSHEET_ID", "WILLITFLY_GOOGLE_SHEETS_SPREADSHEET_ID");
  if (!spreadsheetId) return [];
  const token = await getAccessToken();
  if (!token) return [];
  try {
    const range = encodeURIComponent(`'${tabName}'!A:ZZ`);
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    const data = await response.json() as { values?: string[][] };
    return rowsFromValues(data.values || []);
  } catch {
    return [];
  }
}

function rowPublished(row: RuntimeRow, previewMode: boolean): boolean {
  if (!booleanValue(row.Active)) return false;
  if (previewMode) return true;
  return booleanValue(row.Publish) && ["approved", "reviewed"].includes(String(row.Review_Status ?? "").trim().toLowerCase());
}

function mapDestination(row: RuntimeRow, previewMode: boolean): Destination | null {
  const destinationId = row.Destination_ID;
  const displayName = row.Display_Name;
  const countryId = row.Country_ID || destinationId;
  if (!destinationId || !displayName || !countryId) return null;
  if (!previewMode && !["approved", "reviewed"].includes(String(row.Review_Status ?? "").trim().toLowerCase())) return null;
  return {
    destinationId,
    destinationType: row.Destination_Type,
    displayName,
    parentDestinationId: row.Parent_Destination_ID || undefined,
    countryId,
    regionId: row.Region_ID || undefined,
    slug: row.Slug,
    aliases: String(row.Aliases || "").split(/[|,;]/).map((item) => item.trim()).filter(Boolean),
    latitude: numberValue(row.Latitude),
    longitude: numberValue(row.Longitude),
    displayFlagCode: row.Display_Flag_Code || undefined,
    displayFlagEmoji: row.Display_Flag_Emoji || undefined,
    countryFlagAssetId: row.Country_Flag_Asset_ID || undefined,
  };
}

function mapLayerCard(row: RuntimeRow): RuntimeLayerCard | null {
  const layerId = row.Layer_ID as WillItFlyLayerId;
  if (!row.Layer_Card_ID || !layerId || !row.Destination_ID || !row.Card_Type || !row.Content_Ref_ID) return null;
  return {
    layerCardId: row.Layer_Card_ID,
    layerId,
    destinationId: row.Destination_ID,
    topicId: row.Topic_ID || undefined,
    position: Number(row.Position),
    cardType: row.Card_Type as "FACT" | "PRODUCT",
    contentRefId: row.Content_Ref_ID,
    cardTitle: row.Card_Title,
    summary: row.Summary || undefined,
    visualAssetId: row.Visual_Asset_ID || undefined,
    targetLayerId: (row.Target_Layer_ID || undefined) as WillItFlyLayerId | undefined,
    targetRouteKey: row.Target_Route_Key || undefined,
    active: booleanValue(row.Active),
    reviewStatus: row.Review_Status,
    publish: booleanValue(row.Publish),
    displayOrder: Number(row.Display_Order || row.Position),
  };
}

function mapNavigation(row: RuntimeRow): RuntimeNavigationRoute | null {
  if (!row.Navigation_ID || !row.Route_Key || !row.Label || !row.Path) return null;
  return {
    navigationId: row.Navigation_ID,
    position: Number(row.Position),
    displayOrder: Number(row.Display_Order || row.Position),
    routeKey: row.Route_Key,
    label: row.Label,
    path: row.Path,
    linkType: row.Link_Type === "SISTER_PRODUCT" ? "SISTER_PRODUCT" : "INTERNAL",
    targetProduct: row.Target_Product,
    active: booleanValue(row.Active),
    publish: booleanValue(row.Publish),
    featureFlag: row.Feature_Flag || undefined,
    surface: row.Surface,
    external: booleanValue(row.External),
  };
}

async function loadBundle(): Promise<WillItFlyRuntimeBundle> {
  const configured = Boolean(envValue("WILLITFLY_RUNTIME_SPREADSHEET_ID", "WILLITFLY_GOOGLE_SHEETS_SPREADSHEET_ID"));
  const previewMode = booleanValue(envValue("WILLITFLY_RUNTIME_PREVIEW") || "");
  if (!configured) return { configured, previewMode, destinations: [], layerCards: [], navigationRoutes: [], travelTimes: [] };

  const [destinationRows, cardRows, navigationRows, travelRows] = await Promise.all([
    readTab("02_Destinations"),
    readTab("04.4_Layer_Cards"),
    readTab("04.5_Navigation_Routes"),
    readTab("02.1_Travel_Times"),
  ]);

  const destinations = destinationRows.map((row) => mapDestination(row, previewMode)).filter((item): item is Destination => Boolean(item));
  const mappedCards = cardRows.map(mapLayerCard).filter((item): item is RuntimeLayerCard => Boolean(item));
  const layerCards = previewMode
    ? mappedCards.filter((card) => card.active).sort((a, b) => a.displayOrder - b.displayOrder || a.position - b.position)
    : (["LAYER_1", "LAYER_2", "LAYER_3", "LAYER_4"] as WillItFlyLayerId[]).flatMap((layerId) => resolvePublishedLayerCards(mappedCards, layerId));
  const mappedNavigation = navigationRows.map(mapNavigation).filter((item): item is RuntimeNavigationRoute => Boolean(item));
  const navigationRoutes = previewMode
    ? mappedNavigation.filter((route) => route.active).sort((a, b) => a.displayOrder - b.displayOrder || a.position - b.position)
    : resolvePublishedNavigationRoutes(mappedNavigation);
  const travelTimes = travelRows.flatMap((row): TravelTime[] => {
    if (!rowPublished(row, previewMode) && !previewMode) return [];
    const minutes = numberValue(row.Average_Flight_Minutes);
    if (!row.Origin_Market_ID || !row.Destination_ID || minutes === null) return [];
    return [{
      originMarketId: row.Origin_Market_ID,
      originDisplayName: row.Origin_Display_Name,
      destinationId: row.Destination_ID,
      averageFlightMinutes: minutes,
    }];
  });

  return { configured, previewMode, destinations, layerCards, navigationRoutes, travelTimes };
}

export const getWillItFlyRuntimeBundle = cache(loadBundle);
