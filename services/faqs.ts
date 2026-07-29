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

export function mapFaqRow(row: FaqRow, index: number): RuntimeContentRecord {
  return {
    contentId: value(row, "FAQ ID", "FAQID") || `faq-${index + 1}`,
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

  return {
    content: rows
      .map(mapFaqRow)
      .filter((record) => record.published && record.title && record.body)
      .sort((a, b) => a.displayOrder - b.displayOrder || a.contentId.localeCompare(b.contentId)),
    source: "sheet",
  };
}

export const getFaqs = cache(loadFaqs);
