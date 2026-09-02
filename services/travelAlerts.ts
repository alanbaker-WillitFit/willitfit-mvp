import { cache } from "react";
import { getSheetRows, toNumber } from "./googleSheets";

const TRAVEL_ALERTS_TAB = "08.4_Travel_Alerts";

type Row = Record<string, string>;

export type HomeTravelAlert = {
  alertId: string;
  headline: string;
  level: "green" | "amber" | "red";
  opacity: number;
  articleHref: string;
  displayStatus: string;
  sourcePublisher: string;
  officialSourceUrl: string;
  sourceRetrievedDate: string;
};

function clean(value: unknown): string {
  return value == null ? "" : String(value).replace(/\s+/g, " ").trim();
}

function yes(value: unknown): boolean {
  return ["yes", "true", "1", "active", "live"].includes(clean(value).toLowerCase());
}

function acceptedStatus(value: unknown, allowed: readonly string[]): boolean {
  return allowed.includes(clean(value).toLowerCase());
}

function validHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function withinDisplayWindow(row: Row, now: number): boolean {
  const from = clean(row["Display From"]);
  const until = clean(row["Display Until"]);
  const fromTime = from ? Date.parse(from) : Number.NaN;
  const untilTime = until ? Date.parse(until) : Number.NaN;

  if (from && !Number.isFinite(fromTime)) return false;
  if (until && !Number.isFinite(untilTime)) return false;
  if (Number.isFinite(fromTime) && now < fromTime) return false;
  if (Number.isFinite(untilTime) && now > untilTime) return false;
  return true;
}

function mapLevel(value: unknown): HomeTravelAlert["level"] | null {
  const level = clean(value).toLowerCase();
  return level === "green" || level === "amber" || level === "red" ? level : null;
}

function mapEligibleAlert(row: Row, now: number): HomeTravelAlert | null {
  const alertId = clean(row["Alert ID"]);
  const headline = clean(row.Headline);
  const articleSlug = clean(row["Article Slug"]);
  const linkedArticleId = clean(row["Linked Article ID"]);
  const level = mapLevel(row["Alert Level"]);
  const sourcePublisher = clean(row["Source Publisher"]);
  const officialSourceUrl = clean(row["Official Source URL"]);
  const sourceRetrievedDate = clean(row["Source Retrieved Date"]);

  if (!alertId || !linkedArticleId || !articleSlug || !headline || headline.length > 50 || !level) return null;
  if (!yes(row.Active) || !yes(row["Home Hero Eligible"])) return null;
  if (!acceptedStatus(row["Lifecycle Status"], ["live", "active"])) return null;
  if (!acceptedStatus(row["Content Status"], ["published", "live", "approved"])) return null;
  if (!acceptedStatus(row["Review Status"], ["approved", "published", "live"])) return null;
  if (!withinDisplayWindow(row, now)) return null;

  // Transparency contract: a hero alert must retain its governed official source
  // evidence even though the compact hero links to the supporting WillItFit article.
  if (!sourcePublisher || !officialSourceUrl || !validHttpsUrl(officialSourceUrl) || !sourceRetrievedDate) return null;

  const rawOpacity = toNumber(row["Opacity 0-100"], 92);
  const opacity = Math.min(100, Math.max(35, rawOpacity)) / 100;

  return {
    alertId,
    headline,
    level,
    opacity,
    articleHref: `/articles/${encodeURIComponent(articleSlug)}`,
    displayStatus: clean(row["Display Date / Status"]),
    sourcePublisher,
    officialSourceUrl,
    sourceRetrievedDate,
  };
}

export const getHomeTravelAlert = cache(async (): Promise<HomeTravelAlert | null> => {
  const rows = await getSheetRows<Row>(TRAVEL_ALERTS_TAB);
  if (!rows) return null;

  const now = Date.now();
  const eligible = rows
    .map((row) => ({ row, alert: mapEligibleAlert(row, now) }))
    .filter((item): item is { row: Row; alert: HomeTravelAlert } => Boolean(item.alert))
    .sort((a, b) => {
      const priorityDifference = toNumber(a.row.Priority, 999) - toNumber(b.row.Priority, 999);
      return priorityDifference || a.alert.alertId.localeCompare(b.alert.alertId);
    });

  // Mother governance permits one live Home-eligible card. If more than one slips
  // through, select deterministically by priority while diagnostics/review catches it.
  return eligible[0]?.alert ?? null;
});