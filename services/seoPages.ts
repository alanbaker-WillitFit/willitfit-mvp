import { SeoPage } from "@/types";
import { cache } from "react";
import { slugify } from "./googleSheets";
import { readFirstAvailableRuntimeTab, runtimePublished } from "./runtimeContent";
import { SEO_PAGE_TABS } from "./runtimeSources";
export { SEO_PAGE_TABS } from "./runtimeSources";

type SeoPageRow = Record<string, string>;

function clean(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function value(row: SeoPageRow, ...names: string[]): string {
  for (const name of names) {
    const candidate = clean(row[name]);
    if (candidate) return candidate;
  }
  return "";
}

function mapRow(row: SeoPageRow): SeoPage {
  const pageSlug = slugify(value(row, "Slug", "Page Slug", "PageSlug"));
  return {
    pageSlug,
    title: value(row, "Page Title", "Meta Title", "Title"),
    metaDescription: value(row, "Meta Description", "MetaDescription"),
    h1: value(row, "H1"),
    bodyContent: value(row, "Intro Copy", "Body Content", "BodyContent"),
    faq: [],
    status: runtimePublished(row) ? "Live" : "Draft",
  };
}

function duplicateValues(values: string[]): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  values.forEach((item) => {
    if (seen.has(item)) duplicates.add(item);
    else seen.add(item);
  });
  return duplicates;
}

export async function getAllSeoPages(): Promise<SeoPage[]> {
  const { rows } = await readFirstAvailableRuntimeTab<SeoPageRow>(SEO_PAGE_TABS);
  if (!rows) return [];

  const live = rows
    .map(mapRow)
    .filter((page) =>
      page.status === "Live" &&
      page.pageSlug &&
      page.title &&
      page.metaDescription &&
      page.h1 &&
      page.bodyContent
    );

  const duplicateSlugs = duplicateValues(live.map((page) => page.pageSlug));
  if (duplicateSlugs.size) {
    console.error("[seoPages] Duplicate published slugs", Array.from(duplicateSlugs));
  }
  return live.filter((page) => !duplicateSlugs.has(page.pageSlug));
}

export const getCachedSeoPages = cache(getAllSeoPages);

export async function getSeoPageBySlug(slug: string): Promise<SeoPage | null> {
  const pages = await getCachedSeoPages();
  return pages.find((page) => page.pageSlug === slugify(slug)) ?? null;
}
