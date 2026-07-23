import { TravelTip, SheetStatus } from "@/types";
import { cache } from "react";
import { FALLBACK_TIPS } from "@/data/fallback";
import { slugify, toNumber } from "./googleSheets";
import { readFirstAvailableRuntimeTab } from "./runtimeContent";

type TipRow = {
  TipID?: string; "Tip ID"?: string; Title?: string; Slug?: string;
  Content?: string; Tip?: string; Category?: string; SEOKeyword?: string;
  "SEO Primary Keyword"?: string; CTA?: string; Status?: string;
  "Content Status"?: string; FocusAirline?: string; "Focus Airline"?: string;
  Airline?: string; "Journey Stage"?: string; "Result Context"?: string;
  "Affiliate Category"?: string; Priority?: string;
};

function clean(value: string | undefined): string { return (value ?? "").trim(); }

export function parseTipStatus(status: string | undefined): SheetStatus {
  const s = clean(status).toLowerCase();
  if (["active", "live", "approved", "published"].includes(s)) return "Live";
  if (["archived", "inactive", "retired"].includes(s)) return "Archived";
  return "Draft";
}

function makeTitle(content: string, airline: string, category: string): string {
  if (!content) return `${airline || "Travel"} tip`;
  const firstSentence = content.split(/[.!?]/)[0]?.trim();
  if (firstSentence && firstSentence.length <= 70) return firstSentence;
  if (category && airline) return `${airline} ${category.toLowerCase()} tip`;
  return content.slice(0, 68).trim();
}

function mapRow(row: TipRow, index: number): TravelTip {
  const content = clean(row.Content) || clean(row.Tip);
  const focusAirline = clean(row.FocusAirline) || clean(row["Focus Airline"]) || clean(row.Airline);
  const category = clean(row.Category) || "Travel Tips";
  const title = clean(row.Title) || makeTitle(content, focusAirline, category);
  const slug = slugify(clean(row.Slug) || `${focusAirline || "travel"}-${title || index}`);
  return {
    tipId: clean(row.TipID) || clean(row["Tip ID"]) || `tip-${index + 1}`,
    title, slug, content, category,
    seoKeyword: clean(row.SEOKeyword) || clean(row["SEO Primary Keyword"]),
    cta: clean(row.CTA) || "Check your bag size",
    status: parseTipStatus(clean(row.Status) || clean(row["Content Status"])),
    focusAirline,
    journeyStage: clean(row["Journey Stage"]),
    resultContext: clean(row["Result Context"]),
    affiliateCategory: clean(row["Affiliate Category"]),
    priority: toNumber(row.Priority, 3),
  };
}

function duplicateValues(values: string[]): Set<string> {
  const seen = new Set<string>(); const duplicates = new Set<string>();
  values.forEach((value) => { if (seen.has(value)) duplicates.add(value); else seen.add(value); });
  return duplicates;
}

async function readTipRows(): Promise<TipRow[] | null> {
  const { rows } = await readFirstAvailableRuntimeTab<TipRow>(["06_Travel_Tips", "Content Engine"]);
  return rows;
}

export async function getTravelTips(): Promise<{ tips: TravelTip[] }> {
  const rows = await readTipRows();
  if (!rows) return { tips: FALLBACK_TIPS };

  const live = rows.map(mapRow).filter((tip) => tip.slug && tip.title && tip.content && tip.status === "Live");
  const duplicateIds = duplicateValues(live.map((tip) => tip.tipId));
  const duplicateSlugs = duplicateValues(live.map((tip) => tip.slug));
  if (duplicateIds.size || duplicateSlugs.size) {
    console.error("[tips] Duplicate published tip data", {
      ids: Array.from(duplicateIds), slugs: Array.from(duplicateSlugs),
    });
  }

  const tips = live
    .filter((tip) => !duplicateIds.has(tip.tipId) && !duplicateSlugs.has(tip.slug))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  return { tips: tips.length > 0 ? tips : FALLBACK_TIPS };
}

export const getCachedTravelTips = cache(getTravelTips);

export async function getTipsForAirline(airlineName: string, limit = 6): Promise<{ tips: TravelTip[] }> {
  const { tips } = await getCachedTravelTips();
  const target = clean(airlineName).toLowerCase();
  const merged = [
    ...tips.filter((tip) => [target, "all", "universal"].includes(clean(tip.focusAirline).toLowerCase())),
    ...tips.filter((tip) => !clean(tip.focusAirline)),
  ];
  const unique = Array.from(new Map(merged.map((tip) => [tip.tipId || tip.slug, tip])).values());
  return { tips: unique.slice(0, limit) };
}

export async function getTipBySlug(slug: string): Promise<{ tip: TravelTip | null }> {
  const { tips } = await getCachedTravelTips();
  return { tip: tips.find((item) => item.slug === slugify(slug)) ?? null };
}
export async function getAllTravelTipSlugs(): Promise<string[]> {
  const { tips } = await getCachedTravelTips();
  return Array.from(new Set(tips.map((tip) => tip.slug).filter(Boolean)));
}
export async function getTipCategories(): Promise<string[]> {
  const { tips } = await getCachedTravelTips();
  return Array.from(new Set(tips.map((tip) => tip.category?.trim()).filter(Boolean) as string[])).sort();
}
