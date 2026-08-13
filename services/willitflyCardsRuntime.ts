import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type {
  RuntimeDestinationFact,
  RuntimeCardSchema,
  RuntimeCardFieldLink,
} from "@/lib/willitflyCards";
import type {
  WillItFlyAsset,
  WillItFlyPublicSource,
} from "@/services/willitflyRuntime";

type RuntimeRow = Record<string, string>;

export type WillItFlyDestinationQuestion = {
  questionId: string;
  destinationId: string;
  topicId?: string;
  question: string;
  answerSummary: string;
  detail?: string;
  sourceId: string;
  factClassification?: string;
  preparationState?: string;
  lastReviewed?: string;
  slug?: string;
  indexable: boolean;
};

export type WillItFlyCardsRuntimeBundle = {
  configured: boolean;
  facts: RuntimeDestinationFact[];
  cardSchemas: RuntimeCardSchema[];
  cardFieldLinks: RuntimeCardFieldLink[];
  assets: WillItFlyAsset[];
  publicSources: WillItFlyPublicSource[];
  destinationQuestions: WillItFlyDestinationQuestion[];
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

function mapFact(row: RuntimeRow): RuntimeDestinationFact | null {
  if (!row.Fact_ID || !row.Destination_ID || !row.Topic_ID || !row.Fact_Key || !row.Fact_Value || !row.Source_ID) return null;
  return {
    factId: row.Fact_ID,
    destinationId: row.Destination_ID,
    topicId: row.Topic_ID,
    factKey: row.Fact_Key,
    factValue: row.Fact_Value,
    factValue2: row.Fact_Value_2 || undefined,
    unit: row.Unit || undefined,
    summary: row.Summary || undefined,
    detail: row.Detail || undefined,
    factClassification: row.Fact_Classification || undefined,
    preparationState: row.Preparation_State || undefined,
    sourceId: row.Source_ID,
    evidenceStatus: row.Evidence_Status || undefined,
    confidence: row.Confidence || undefined,
    lastReviewed: row.Last_Reviewed || undefined,
    reviewDue: row.Review_Due || undefined,
    inheritedFromDestinationId: row.Inherited_From_Destination_ID || undefined,
    inheritanceLevel: row.Inheritance_Level || undefined,
  };
}

function mapCardSchema(row: RuntimeRow): RuntimeCardSchema | null {
  if (!row.Card_ID || !row.Card_Type || !row.Card_Title || !row.Component_Key || !row.Interaction_Mode) return null;
  return {
    cardId: row.Card_ID,
    cardType: row.Card_Type,
    topicId: row.Topic_ID || undefined,
    title: row.Card_Title,
    displayOrder: Number(row.Display_Order || 0),
    componentKey: row.Component_Key,
    interactionMode: row.Interaction_Mode,
    detailRouteKey: row.Detail_Route_Key || undefined,
    assetMode: row.Asset_Mode || undefined,
    visibilityRule: row.Visibility_Rule || undefined,
    safeState: row.Safe_State || undefined,
    schemaVersion: row.Schema_Version || undefined,
    requiredForRc1: booleanValue(row.Required_For_RC1),
  };
}

function mapFieldLink(row: RuntimeRow): RuntimeCardFieldLink | null {
  if (!row.Link_ID || !row.Card_ID || !row.Slot_Key || !row.Runtime_Tab || !row.Runtime_Field || !row.Lookup_Key || !row.Lookup_Value_Source || !row.Resolver || !row.Build_Output) return null;
  return {
    linkId: row.Link_ID,
    cardId: row.Card_ID,
    slotKey: row.Slot_Key,
    runtimeTab: row.Runtime_Tab,
    runtimeField: row.Runtime_Field,
    lookupKey: row.Lookup_Key,
    lookupValueSource: row.Lookup_Value_Source,
    resolver: row.Resolver,
    required: booleanValue(row.Required),
    multiple: booleanValue(row.Multiple),
    displayRole: row.Display_Role || undefined,
    missingBehaviour: row.Missing_Behaviour || undefined,
    buildOutput: row.Build_Output,
  };
}

function mapAsset(row: RuntimeRow): WillItFlyAsset | null {
  if (!row.Asset_ID || !row.Asset_Type || !row.Asset_Name || !row.Purpose || !row.Production_Path) return null;
  return {
    assetId: row.Asset_ID,
    assetType: row.Asset_Type,
    assetName: row.Asset_Name,
    purpose: row.Purpose,
    entityType: row.Entity_Type || undefined,
    entityId: row.Entity_ID || undefined,
    topicId: row.Topic_ID || undefined,
    productionPath: row.Production_Path,
    altText: row.Alt_Text || undefined,
    accessibilityBehaviour: row.Accessibility_Behaviour || undefined,
    fallbackAssetId: row.Fallback_Asset_ID || undefined,
    version: row.Version || undefined,
    assetRole: row.Asset_Role || undefined,
  };
}

function mapPublicSource(row: RuntimeRow): WillItFlyPublicSource | null {
  if (!row.Source_ID || !row.Source_Name || !row.URL) return null;
  return {
    sourceId: row.Source_ID,
    sourceName: row.Source_Name,
    url: row.URL,
    urlRole: row.URL_Role || undefined,
    authorityLevel: row.Authority_Level || undefined,
    entityType: row.Entity_Type || undefined,
    entityId: row.Entity_ID || undefined,
    topicId: row.Topic_ID || undefined,
    lastChecked: row.Last_Checked || undefined,
    reviewDue: row.Review_Due || undefined,
  };
}

function mapQuestion(row: RuntimeRow): WillItFlyDestinationQuestion | null {
  if (!row.Question_ID || !row.Destination_ID || !row.Question || !row.Answer_Summary || !row.Source_ID) return null;
  return {
    questionId: row.Question_ID,
    destinationId: row.Destination_ID,
    topicId: row.Topic_ID || undefined,
    question: row.Question,
    answerSummary: row.Answer_Summary,
    detail: row.Detail || undefined,
    sourceId: row.Source_ID,
    factClassification: row.Fact_Classification || undefined,
    preparationState: row.Preparation_State || undefined,
    lastReviewed: row.Last_Reviewed || undefined,
    slug: row.Slug || undefined,
    indexable: booleanValue(row.Indexable),
  };
}

async function loadBundle(): Promise<WillItFlyCardsRuntimeBundle> {
  const configured = Boolean(envValue("WILLITFLY_RUNTIME_SPREADSHEET_ID", "WILLITFLY_GOOGLE_SHEETS_SPREADSHEET_ID"));
  if (!configured) {
    return {
      configured,
      facts: [],
      cardSchemas: [],
      cardFieldLinks: [],
      assets: [],
      publicSources: [],
      destinationQuestions: [],
    };
  }

  const [factRows, schemaRows, linkRows, assetRows, sourceRows, questionRows] = await Promise.all([
    readTab("03_Destination_Facts"),
    readTab("04.1_Card_Schemas"),
    readTab("04.2_Card_Field_Links"),
    readTab("06_Assets"),
    readTab("05_Public_Source_Links"),
    readTab("07_Destination_Questions"),
  ]);

  return {
    configured,
    facts: factRows.map(mapFact).filter((item): item is RuntimeDestinationFact => Boolean(item)),
    cardSchemas: schemaRows.map(mapCardSchema).filter((item): item is RuntimeCardSchema => Boolean(item)),
    cardFieldLinks: linkRows.map(mapFieldLink).filter((item): item is RuntimeCardFieldLink => Boolean(item)),
    assets: assetRows.map(mapAsset).filter((item): item is WillItFlyAsset => Boolean(item)),
    publicSources: sourceRows.map(mapPublicSource).filter((item): item is WillItFlyPublicSource => Boolean(item)),
    destinationQuestions: questionRows.map(mapQuestion).filter((item): item is WillItFlyDestinationQuestion => Boolean(item)),
  };
}

export const getWillItFlyCardsRuntimeBundle = cache(loadBundle);
