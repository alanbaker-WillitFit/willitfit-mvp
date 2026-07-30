import { cache } from "react";
import type { RuntimeContentRecord } from "@/types";
import { FALLBACK_RUNTIME_CONTENT } from "@/data/runtimeFallbacks";
import { toNumber } from "./googleSheets";
import { readFirstAvailableRuntimeTab, runtimePublished } from "./runtimeContent";
import { FAQ_TABS } from "./runtimeSources";
export { FAQ_TABS } from "./runtimeSources";

type FaqRow = Record<string, string>;

function value(row: FaqRow, ...names: string[]): string {
  for (const name of names) {
    const candidate = String(row[name] ?? "").trim();
    if (candidate) return candidate;
  }
  return "";
}

export function mapFaqRow(row: FaqRow): RuntimeContentRecord {
  return {
    contentId: value(row, "FAQ ID", "FAQID"),
    module: "FAQs",
    page: "ask",
    section: value(row, "Category") || "General",
    contentType: "FAQ",
    title: value(row, "Question"),
    body: value(row, "Answer"),
    supportingText: value(row, "Search Terms"),
    displayOrder: toNumber(value(row, "Priority"), 999),
    active: true,
    reviewStatus: value(row, "Review Status", "Status"),
    published: runtimePublished(row),
    notes: value(row, "Notes"),
    source: "sheet",
  };
}

function duplicateValues(values: string[]): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const item of values) {
    if (seen.has(item)) duplicates.add(item);
    else seen.add(item);
  }
  return duplicates;
}

async function loadFaqs(): Promise<{
  content: RuntimeContentRecord[];
  source: "sheet" | "fallback";
}> {
  const { rows } = await readFirstAvailableRuntimeTab<FaqRow>(FAQ_TABS);
  if (rows === null) {
    return {
      content: FALLBACK_RUNTIME_CONTENT.filter((record) => record.module === "FAQs"),
      source: "fallback",
    };
  }

  const published = rows.map(mapFaqRow).filter((record) => record.published);
  const missingIds = published.filter((record) => !record.contentId);
  const incomplete = published.filter((record) => record.contentId && (!record.title || !record.body));

  if (missingIds.length > 0) {
    console.error("[faqs] Rejected published FAQs without FAQ ID", { count: missingIds.length });
  }
  if (incomplete.length > 0) {
    console.error("[faqs] Rejected incomplete published FAQs", incomplete.map((record) => record.contentId));
  }

  const valid = published.filter((record) => record.contentId && record.title && record.body);
  const duplicateIds = duplicateValues(valid.map((record) => record.contentId));
  if (duplicateIds.size > 0) {
    console.error("[faqs] Duplicate published FAQ IDs", Array.from(duplicateIds));
  }

  return {
    content: valid
      .filter((record) => !duplicateIds.has(record.contentId))
      .sort((a, b) => a.displayOrder - b.displayOrder || a.contentId.localeCompare(b.contentId)),
    source: "sheet",
  };
}

export const getFaqs = cache(loadFaqs);
