import { cache } from "react";
import type { RuntimeContentRecord } from "@/types";
import { FALLBACK_RUNTIME_CONTENT } from "@/data/runtimeFallbacks";
import { getSheetRows, toNumber } from "./googleSheets";
import { SITE_CONTENT_TABS } from "./runtimeSources";
export { SITE_CONTENT_TABS } from "./runtimeSources";


type RuntimeRow = Record<string, string>;

function clean(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function value(row: RuntimeRow, ...names: string[]): string {
  for (const name of names) {
    const candidate = clean(row[name]);
    if (candidate) return candidate;
  }
  return "";
}

export function runtimeBoolean(input: unknown): boolean {
  return ["1", "active", "approved", "yes", "true", "live", "published"].includes(clean(input).toLowerCase());
}

export function runtimePublished(row: RuntimeRow): boolean {
  const activeValue = value(row, "Active", "Lifecycle Status");
  const publishValue = value(row, "Publish", "Runtime Publish Status", "Published", "Publish Status");
  const reviewValue = value(row, "Review Status", "ReviewStatus", "Workflow Status");
  const legacyStatusValue = value(row, "Status", "Content Status");
  const hasGovernanceSignal = Boolean(activeValue || publishValue || reviewValue || legacyStatusValue);
  if (!hasGovernanceSignal) return false;

  const active = activeValue ? runtimeBoolean(activeValue) : true;
  const publishApproved = publishValue ? runtimeBoolean(publishValue) : true;
  const reviewApproved = reviewValue
    ? ["approved", "published", "live"].includes(reviewValue.toLowerCase())
    : true;
  const legacyApproved = !activeValue && !publishValue && !reviewValue && legacyStatusValue
    ? runtimeBoolean(legacyStatusValue)
    : true;
  return active && publishApproved && reviewApproved && legacyApproved;
}

function derivedModule(row: RuntimeRow): string {
  const explicit = value(row, "Module");
  if (explicit) return explicit;
  const type = value(row, "Content Type", "ContentType").toLowerCase();
  const page = value(row, "Page").toLowerCase();
  if (type.includes("hint")) return "Hints";
  if (type.includes("notice")) return "Notices";
  if (type.includes("article") || page === "articles" || page.startsWith("article")) return "Articles";
  if (page === "about") return "About";
  if (page.includes("travel tip") || page === "tips") return "Travel Tips";
  return value(row, "Page") || "General";
}

export function mapRuntimeContentRow(row: RuntimeRow, _index: number): RuntimeContentRecord {
  return {
    contentId: value(row, "ContentID", "Content ID", "Content_ID"),
    module: derivedModule(row),
    page: value(row, "Page"),
    section: value(row, "Section"),
    contentType: value(row, "Content Type", "ContentType") || "Section",
    title: value(row, "Title"),
    body: value(row, "Content", "Body"),
    supportingText: value(row, "Supporting Text", "SupportingText"),
    displayOrder: toNumber(value(row, "Priority", "Display Order", "DisplayOrder", "Order"), 999),
    active: value(row, "Active", "Lifecycle Status") ? runtimeBoolean(value(row, "Active", "Lifecycle Status")) : true,
    reviewStatus: value(row, "Review Status", "ReviewStatus", "Workflow Status"),
    published: runtimePublished(row),
    notes: value(row, "Notes"),
    source: "sheet",
  };
}

export async function readFirstAvailableRuntimeTab<T extends RuntimeRow>(
  tabNames: readonly string[],
  reader: <R extends RuntimeRow>(tabName: string) => Promise<R[] | null> = getSheetRows
): Promise<{ rows: T[] | null; tabName: string | null }> {
  for (const tabName of tabNames) {
    const rows = await reader<T>(tabName);
    if (rows !== null) return { rows, tabName };
  }
  return { rows: null, tabName: null };
}

function validPublished(records: RuntimeContentRecord[]): RuntimeContentRecord[] {
  const missingIds = records.filter((record) => record.published && !record.contentId);
  const incomplete = records.filter((record) =>
    record.published && record.contentId && (!record.module || (!record.title && !record.body))
  );

  if (missingIds.length > 0) {
    console.error("[runtimeContent] Rejected published content without ContentID", {
      count: missingIds.length,
    });
  }
  if (incomplete.length > 0) {
    console.error(
      "[runtimeContent] Rejected incomplete published content",
      incomplete.map((record) => record.contentId)
    );
  }

  return records.filter((record) =>
    record.published && record.contentId && record.module && (record.title || record.body)
  );
}

function uniquePublished(records: RuntimeContentRecord[]): RuntimeContentRecord[] {
  const counts = new Map<string, number>();
  records.forEach((record) => counts.set(record.contentId, (counts.get(record.contentId) ?? 0) + 1));
  const duplicateIds = new Set(Array.from(counts).filter(([, count]) => count > 1).map(([id]) => id));
  if (duplicateIds.size) console.error("[runtimeContent] Duplicate published content IDs", Array.from(duplicateIds));
  return records.filter((record) => !duplicateIds.has(record.contentId));
}

export async function getAllRuntimeContent(): Promise<{
  content: RuntimeContentRecord[];
  source: "sheet" | "fallback";
}> {
  const { rows } = await readFirstAvailableRuntimeTab<RuntimeRow>(SITE_CONTENT_TABS);
  if (!rows) return { content: FALLBACK_RUNTIME_CONTENT, source: "fallback" };

  const content = uniquePublished(validPublished(rows.map(mapRuntimeContentRow)))
    .sort((a, b) => a.displayOrder - b.displayOrder || a.contentId.localeCompare(b.contentId));

  return { content, source: "sheet" };
}

export const getCachedRuntimeContent = cache(getAllRuntimeContent);

export async function getRuntimeContent(query: {
  module: string;
  page?: string;
  section?: string;
}): Promise<{ content: RuntimeContentRecord[]; source: "sheet" | "fallback" }> {
  const loaded = await getCachedRuntimeContent();
  const normalise = (item: string) => item.trim().toLowerCase();
  const moduleName = (item: string) => {
    const name = normalise(item);
    return name === "affiliate content" ? "affiliate products" : name;
  };
  const matches = loaded.content.filter((record) =>
    moduleName(record.module) === moduleName(query.module) &&
    (!query.page || normalise(record.page) === normalise(query.page)) &&
    (!query.section || normalise(record.section) === normalise(query.section))
  );

  if (matches.length > 0 || loaded.source === "sheet") {
    return { content: matches, source: loaded.source };
  }

  const fallback = FALLBACK_RUNTIME_CONTENT.filter((record) =>
    moduleName(record.module) === moduleName(query.module) &&
    (!query.page || normalise(record.page) === normalise(query.page)) &&
    (!query.section || normalise(record.section) === normalise(query.section))
  );
  return { content: fallback, source: "fallback" };
}
