import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export type WillItFlyArticle = {
  articleId: string;
  articleType: string;
  productScope: string;
  category?: string;
  topic?: string;
  slug: string;
  headline: string;
  shortSummary?: string;
  standfirst?: string;
  articleBody?: string;
  keyTakeaways: string[];
  travellerAction?: string;
  authorType?: string;
  authorName?: string;
  featured: boolean;
  displayOrder: number;
  contentStatus?: string;
  reviewStatus: string;
  active: boolean;
  publish: boolean;
  publishedDate?: string;
  lastReviewed?: string;
  nextReviewDue?: string;
  validUntil?: string;
  changeSensitivity?: string;
  staleAction?: string;
  cardImageReference?: string;
};

export type WillItFlyArticleSection = {
  sectionId: string;
  articleId: string;
  articleSlug?: string;
  sectionKey: string;
  sectionType: string;
  heading?: string;
  body?: string;
  supportingText?: string;
  quoteCallout?: string;
  listItems: string[];
  linkLabel?: string;
  linkUrl?: string;
  imageReference?: string;
  displayOrder: number;
  active: boolean;
  reviewStatus: string;
  lastReviewed?: string;
  publish: boolean;
};

type RuntimeRow = Record<string, string>;

type ArticleRuntime = {
  configured: boolean;
  previewMode: boolean;
  articles: WillItFlyArticle[];
  sections: WillItFlyArticleSection[];
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

function scopeAllowsWillItFly(value: string | undefined): boolean {
  const scope = String(value ?? "").trim().toUpperCase().replace(/[\s_-]+/g, "");
  return ["WILLITFLY", "SHARED", "BOTH", "WILLIT"].includes(scope);
}

function lines(value: string | undefined): string[] {
  return String(value ?? "")
    .split(/\r?\n|\|/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberValue(value: string | undefined, fallback = 0): number {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
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

function mapArticle(row: RuntimeRow): WillItFlyArticle | null {
  if (!row.Article_ID || !row.Article_Type || !row.Product_Scope || !row.Slug || !row.Headline) return null;
  if (!scopeAllowsWillItFly(row.Product_Scope)) return null;
  return {
    articleId: row.Article_ID,
    articleType: row.Article_Type,
    productScope: row.Product_Scope,
    category: row.Category || undefined,
    topic: row.Topic || undefined,
    slug: row.Slug,
    headline: row.Headline,
    shortSummary: row.Short_Summary || undefined,
    standfirst: row.Standfirst || undefined,
    articleBody: row.Article_Body || undefined,
    keyTakeaways: lines(row.Key_Takeaways),
    travellerAction: row.Traveller_Action || undefined,
    authorType: row.Author_Type || undefined,
    authorName: row.Author_Name || undefined,
    featured: booleanValue(row.Featured),
    displayOrder: numberValue(row.Display_Order, 999),
    contentStatus: row.Content_Status || undefined,
    reviewStatus: row.Review_Status || "",
    active: booleanValue(row.Active),
    publish: booleanValue(row.Publish),
    publishedDate: row.Published_Date || undefined,
    lastReviewed: row.Last_Reviewed || undefined,
    nextReviewDue: row.Next_Review_Due || undefined,
    validUntil: row.Valid_Until || undefined,
    changeSensitivity: row.Change_Sensitivity || undefined,
    staleAction: row.Stale_Action || undefined,
    cardImageReference: row.Card_Image_Reference || undefined,
  };
}

function mapSection(row: RuntimeRow): WillItFlyArticleSection | null {
  if (!row.Section_ID || !row.Article_ID || !row.Section_Key || !row.Section_Type) return null;
  return {
    sectionId: row.Section_ID,
    articleId: row.Article_ID,
    articleSlug: row.Article_Slug || undefined,
    sectionKey: row.Section_Key,
    sectionType: row.Section_Type,
    heading: row.Heading || undefined,
    body: row.Body || undefined,
    supportingText: row.Supporting_Text || undefined,
    quoteCallout: row.Quote_Callout || undefined,
    listItems: lines(row.List_Items),
    linkLabel: row.Link_Label || undefined,
    linkUrl: row.Link_URL || undefined,
    imageReference: row.Image_Reference || undefined,
    displayOrder: numberValue(row.Display_Order, 999),
    active: booleanValue(row.Active),
    reviewStatus: row.Review_Status || "",
    lastReviewed: row.Last_Reviewed || undefined,
    publish: booleanValue(row.Publish),
  };
}

async function loadArticleRuntime(): Promise<ArticleRuntime> {
  const configured = Boolean(envValue("WILLITFLY_RUNTIME_SPREADSHEET_ID", "WILLITFLY_GOOGLE_SHEETS_SPREADSHEET_ID"));
  const previewMode = booleanValue(envValue("WILLITFLY_RUNTIME_PREVIEW") || "");
  if (!configured) return { configured, previewMode, articles: [], sections: [] };

  const [articleRows, sectionRows] = await Promise.all([
    readTab("08.2_Articles"),
    readTab("08.2.1_Article_Sections"),
  ]);

  const articles = articleRows
    .map(mapArticle)
    .filter((item): item is WillItFlyArticle => Boolean(item))
    .filter((item) => item.active && reviewedValue(item.reviewStatus) && (previewMode || item.publish))
    .sort((a, b) => a.displayOrder - b.displayOrder || a.headline.localeCompare(b.headline));

  const allowedArticleIds = new Set(articles.map((article) => article.articleId));
  const sections = sectionRows
    .map(mapSection)
    .filter((item): item is WillItFlyArticleSection => Boolean(item))
    .filter((item) => allowedArticleIds.has(item.articleId) && item.active && reviewedValue(item.reviewStatus) && (previewMode || item.publish))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return { configured, previewMode, articles, sections };
}

const getArticleRuntime = cache(loadArticleRuntime);

export async function getWillItFlyArticles(): Promise<WillItFlyArticle[]> {
  return (await getArticleRuntime()).articles;
}

export async function getWillItFlyArticleBySlug(slug: string): Promise<{ article: WillItFlyArticle; sections: WillItFlyArticleSection[] } | null> {
  const runtime = await getArticleRuntime();
  const article = runtime.articles.find((item) => item.slug === slug);
  if (!article) return null;
  return {
    article,
    sections: runtime.sections.filter((section) => section.articleId === article.articleId),
  };
}
