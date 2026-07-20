import { SeoPage, FaqItem } from "@/types";
import { cache } from "react";
import { getSheetRows, isLive, slugify } from "./googleSheets";

type SeoPageRow = { PageSlug?: string; Title?: string; MetaDescription?: string; H1?: string; BodyContent?: string; FAQJSON?: string; Status?: string; };

function clean(value: string | undefined): string { return (value ?? "").trim(); }
function parseFaq(raw: string, slug: string): FaqItem[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.question === "string" && typeof item.answer === "string")
      .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }))
      .filter((item) => item.question && item.answer);
  } catch { console.error(`[seoPages] malformed FAQJSON for ${slug || "unknown slug"}`); return []; }
}
function mapRow(row: SeoPageRow): SeoPage {
  const pageSlug = slugify(clean(row.PageSlug));
  return {
    pageSlug,
    title: clean(row.Title),
    metaDescription: clean(row.MetaDescription),
    h1: clean(row.H1),
    bodyContent: clean(row.BodyContent),
    faq: parseFaq(clean(row.FAQJSON), pageSlug),
    status: isLive(row.Status) ? "Live" : "Draft",
  };
}
function duplicateValues(values: string[]): Set<string> {
  const seen = new Set<string>(); const duplicates = new Set<string>();
  values.forEach((value) => { if (seen.has(value)) duplicates.add(value); else seen.add(value); });
  return duplicates;
}
export async function getAllSeoPages(): Promise<SeoPage[]> {
  const rows = await getSheetRows<SeoPageRow>("08_SEO_Pages");
  if (!rows) return [];
  const live = rows.map(mapRow).filter((page) => page.status === "Live" && page.pageSlug && page.title && page.metaDescription && page.h1 && page.bodyContent);
  const duplicateSlugs = duplicateValues(live.map((page) => page.pageSlug));
  if (duplicateSlugs.size) console.error("[seoPages] Duplicate published slugs", Array.from(duplicateSlugs));
  return live.filter((page) => !duplicateSlugs.has(page.pageSlug));
}
export const getCachedSeoPages = cache(getAllSeoPages);
export async function getSeoPageBySlug(slug: string): Promise<SeoPage | null> {
  const pages = await getCachedSeoPages();
  return pages.find((page) => page.pageSlug === slugify(slug)) ?? null;
}
