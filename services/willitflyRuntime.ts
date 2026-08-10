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
import {
  canPublishValueIntelligence,
  type RuntimeValueIntelligence,
  type WillItFlyScoreStatus,
  type WillItFlyValueVerdict,
} from "@/lib/willitflyValueIntelligence";

type RuntimeRow = Record<string, string>;

export type WillItFlyDestination = {
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

export type WillItFlyTravelTime = {
  originMarketId: string;
  originDisplayName: string;
  destinationId: string;
  averageFlightMinutes: number;
};

export type WillItFlyAsset = {
  assetId: string;
  assetType: string;
  assetName: string;
  purpose: string;
  entityType?: string;
  entityId?: string;
  topicId?: string;
  productionPath: string;
  altText?: string;
  accessibilityBehaviour?: string;
  fallbackAssetId?: string;
  version?: string;
  assetRole?: string;
};

export type WillItFlyRuntimeBundle = {
  configured: boolean;
  previewMode: boolean;
  destinations: WillItFlyDestination[];
  layerCards: RuntimeLayerCard[];
  navigationRoutes: RuntimeNavigationRoute[];
  travelTimes: WillItFlyTravelTime[];
  assets: WillItFlyAsset[];
  valueIntelligence: RuntimeValueIntelligence[];
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

function reviewedValue(value: string | undefined): boolean {
  return ["approved", "reviewed"].includes(String(value ?? "").trim().toLowerCase());
}

function numberValue(value: string | undefined): number | null {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function scoreValue(value: string | undefined): 1 | 2 | 3 | 4 | 5 | undefined {
  const parsed = numberValue(value);
  if (parsed === null || !Number.isInteger(parsed) || parsed < 1 || parsed > 5) return undefined;
  return parsed as 1 | 2 | 3 | 4 | 5;
}

function scoreStatusValue(value: string | undefined): WillItFlyScoreStatus | null {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (["ESTABLISHED", "INSUFFICIENT_HISTORY", "UNAVAILABLE"].includes(normalized)) {
    return normalized as WillItFlyScoreStatus;
  }
  return null;
}

function valueVerdictValue(value: string | undefined): WillItFlyValueVerdict | null {
  const normalized = String(value ?? "").trim().toUpperCase().replace(/\s+/g, "_");
  if (["GREAT_VALUE", "GOOD_VALUE", "FAIR_PRICE", "WAIT_IF_YOU_CAN", "HIGH_PRICE", "UNPROVEN_DEAL"].includes(normalized)) {
    return normalized as WillItFlyValueVerdict;
  }
  return null;
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
      grant_type: "urn:ietf:params:oauth-grant-type:jwt-bearer".replace("oauth-grant-type", "oauth:grant-type"),
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
  const headers = (values[0] ?? []).map((value) => String(value ?? "").trim());
  return values.slice(1).flatMap((row) => {
    if (!row.some((value) => String(value ?? "").trim())) return [];
    if (String(row[0] ?? "").trim() === "NO AUTHORISED DATA IN DRAFT") return [];
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

function mapDestination(row: RuntimeRow, previewMode: boolean): WillItFlyDestination | null {
  const destinationId = row.Destination_ID;
  const destinationType = row.Destination_Type;
  const displayName = row.Display_Name;
  const countryId = row.Country_ID || destinationId;
  const slug = row.Slug;
  if (!destinationId || !destinationType || !displayName || !countryId || !slug) return null;
  if (!previewMode && !reviewedValue(row.Review_Status)) return null;

  return {
    destinationId,
    destinationType,
    displayName,
    parentDestinationId: row.Parent_Destination_ID || undefined,
    countryId,
    regionId: row.Region_ID || undefined,
    slug,
    aliases: String(row.Aliases || "").split(/[|,;]/).map((item) => item.trim()).filter(Boolean),
    latitude: numberValue(row.Latitude),
    longitude: numberValue(row.Longitude),
    displayFlagCode: row.Display_Flag_Code || undefined,
    displayFlagEmoji: row.Display_Flag_Emoji || undefined,
    countryFlagAssetId: row.Country_Flag_Asset_ID || undefined,
  };
}

function mapLayerCard(row: RuntimeRow): RuntimeLayerCard | null {
  const layerCardId = row.Layer_Card_ID;
  const layerId = row.Layer_ID as WillItFlyLayerId | undefined;
  const destinationId = row.Destination_ID;
  const cardType = row.Card_Type as "FACT" | "PRODUCT" | undefined;
  const contentRefId = row.Content_Ref_ID;
  const cardTitle = row.Card_Title;
  if (!layerCardId || !layerId || !destinationId || !cardType || !contentRefId || !cardTitle) return null;

  return {
    layerCardId,
    layerId,
    destinationId,
    topicId: row.Topic_ID || undefined,
    position: Number(row.Position),
    cardType,
    contentRefId,
    cardTitle,
    summary: row.Summary || undefined,
    visualAssetId: row.Visual_Asset_ID || undefined,
    targetLayerId: (row.Target_Layer_ID || undefined) as WillItFlyLayerId | undefined,
    targetRouteKey: row.Target_Route_Key || undefined,
    active: booleanValue(row.Active),
    reviewStatus: row.Review_Status || "",
    publish: booleanValue(row.Publish),
    displayOrder: Number(row.Display_Order || row.Position),
  };
}

function mapNavigation(row: RuntimeRow): RuntimeNavigationRoute | null {
  const navigationId = row.Navigation_ID;
  const routeKey = row.Route_Key;
  const label = row.Label;
  const path = row.Path;
  const targetProduct = row.Target_Product;
  const surface = row.Surface;
  if (!navigationId || !routeKey || !label || !path || !targetProduct || !surface) return null;

  return {
    navigationId,
    position: Number(row.Position),
    displayOrder: Number(row.Display_Order || row.Position),
    routeKey,
    label,
    path,
    linkType: row.Link_Type === "SISTER_PRODUCT" ? "SISTER_PRODUCT" : "INTERNAL",
    targetProduct,
    active: booleanValue(row.Active),
    publish: booleanValue(row.Publish),
    featureFlag: row.Feature_Flag || undefined,
    surface,
    external: booleanValue(row.External),
  };
}

function mapAsset(row: RuntimeRow): WillItFlyAsset | null {
  const assetId = row.Asset_ID;
  const assetType = row.Asset_Type;
  const assetName = row.Asset_Name;
  const purpose = row.Purpose;
  const productionPath = row.Production_Path;
  if (!assetId || !assetType || !assetName || !purpose || !productionPath) return null;

  return {
    assetId,
    assetType,
    assetName,
    purpose,
    entityType: row.Entity_Type || undefined,
    entityId: row.Entity_ID || undefined,
    topicId: row.Topic_ID || undefined,
    productionPath,
    altText: row.Alt_Text || undefined,
    accessibilityBehaviour: row.Accessibility_Behaviour || undefined,
    fallbackAssetId: row.Fallback_Asset_ID || undefined,
    version: row.Version || undefined,
    assetRole: row.Asset_Role || undefined,
  };
}

function mapValueIntelligence(row: RuntimeRow): RuntimeValueIntelligence | null {
  const valueIntelligenceId = row.Value_Intelligence_ID;
  const productId = row.Product_ID;
  const methodologyVersion = row.Methodology_Version;
  const productScoreStatus = scoreStatusValue(row.Product_Score_Status);
  const priceScoreStatus = scoreStatusValue(row.Price_Score_Status);
  const valueVerdict = valueVerdictValue(row.Value_Verdict);
  if (!valueIntelligenceId || !productId || !methodologyVersion || !productScoreStatus || !priceScoreStatus || !valueVerdict) {
    return null;
  }

  const value: RuntimeValueIntelligence = {
    valueIntelligenceId,
    productId,
    offerId: row.Offer_ID || undefined,
    merchantId: row.Merchant_ID || undefined,
    productScore: scoreValue(row.Product_Score),
    productScoreStatus,
    priceScore: scoreValue(row.Price_Score),
    priceScoreStatus,
    valueVerdict,
    currentPrice: numberValue(row.Current_Price) ?? undefined,
    currency: row.Currency || undefined,
    typicalObservedPrice: numberValue(row.Typical_Observed_Price) ?? undefined,
    observedLow: numberValue(row.Observed_Low) ?? undefined,
    observedHigh: numberValue(row.Observed_High) ?? undefined,
    monitoringDays: numberValue(row.Monitoring_Days) ?? undefined,
    evidenceConfidence: row.Evidence_Confidence || undefined,
    methodologyVersion,
    lastEvaluated: row.Last_Evaluated || undefined,
    active: booleanValue(row.Active),
    publish: booleanValue(row.Publish),
    featureFlag: row.Feature_Flag || undefined,
  };

  if (productScoreStatus === "ESTABLISHED" && value.productScore === undefined) return null;
  if (priceScoreStatus === "ESTABLISHED" && value.priceScore === undefined) return null;
  if (priceScoreStatus === "INSUFFICIENT_HISTORY" && value.priceScore !== undefined) return null;

  return value;
}

async function loadBundle(): Promise<WillItFlyRuntimeBundle> {
  const configured = Boolean(envValue("WILLITFLY_RUNTIME_SPREADSHEET_ID", "WILLITFLY_GOOGLE_SHEETS_SPREADSHEET_ID"));
  const previewMode = booleanValue(envValue("WILLITFLY_RUNTIME_PREVIEW") || "");
  if (!configured) {
    return {
      configured,
      previewMode,
      destinations: [],
      layerCards: [],
      navigationRoutes: [],
      travelTimes: [],
      assets: [],
      valueIntelligence: [],
    };
  }

  const [destinationRows, cardRows, navigationRows, travelRows, assetRows, valueRows] = await Promise.all([
    readTab("02_Destinations"),
    readTab("04.4_Layer_Cards"),
    readTab("04.5_Navigation_Routes"),
    readTab("02.1_Travel_Times"),
    readTab("06_Assets"),
    readTab("09.1_Value_Intelligence"),
  ]);

  const destinations = destinationRows
    .map((row) => mapDestination(row, previewMode))
    .filter((item): item is WillItFlyDestination => Boolean(item));

  const mappedCards = cardRows.map(mapLayerCard).filter((item): item is RuntimeLayerCard => Boolean(item));
  const layerCards = previewMode
    ? mappedCards.filter((card) => card.active).sort((a, b) => a.displayOrder - b.displayOrder || a.position - b.position)
    : (["LAYER_1", "LAYER_2", "LAYER_3", "LAYER_4"] as WillItFlyLayerId[]).flatMap((layerId) => resolvePublishedLayerCards(mappedCards, layerId));

  const mappedNavigation = navigationRows.map(mapNavigation).filter((item): item is RuntimeNavigationRoute => Boolean(item));
  const navigationRoutes = previewMode
    ? mappedNavigation.filter((route) => route.active).sort((a, b) => a.displayOrder - b.displayOrder || a.position - b.position)
    : resolvePublishedNavigationRoutes(mappedNavigation);

  const travelTimes = travelRows.flatMap((row): WillItFlyTravelTime[] => {
    if (!previewMode && !reviewedValue(row.Review_Status)) return [];
    const originMarketId = row.Origin_Market_ID;
    const originDisplayName = row.Origin_Display_Name;
    const destinationId = row.Destination_ID;
    const minutes = numberValue(row.Average_Flight_Minutes);
    if (!originMarketId || !originDisplayName || !destinationId || minutes === null) return [];
    return [{
      originMarketId,
      originDisplayName,
      destinationId,
      averageFlightMinutes: minutes,
    }];
  });

  const assets = assetRows.map(mapAsset).filter((item): item is WillItFlyAsset => Boolean(item));

  const mappedValueIntelligence = valueRows
    .map(mapValueIntelligence)
    .filter((item): item is RuntimeValueIntelligence => Boolean(item));
  const valueIntelligence = previewMode
    ? mappedValueIntelligence.filter((value) => value.active)
    : mappedValueIntelligence.filter(canPublishValueIntelligence);

  return {
    configured,
    previewMode,
    destinations,
    layerCards,
    navigationRoutes,
    travelTimes,
    assets,
    valueIntelligence,
  };
}

export function resolveWillItFlyAsset(bundle: WillItFlyRuntimeBundle, assetId?: string): WillItFlyAsset | null {
  if (!assetId) return null;
  return bundle.assets.find((asset) => asset.assetId === assetId) ?? null;
}

export const getWillItFlyRuntimeBundle = cache(loadBundle);
