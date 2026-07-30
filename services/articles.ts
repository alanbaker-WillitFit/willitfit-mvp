import { cache } from "react";
import type { RuntimeContentRecord } from "@/types";
import { getRuntimeContent } from "./runtimeContent";

export interface Article {
  slug: string;
  title: string;
  summary: string;
  sections: RuntimeContentRecord[];
}

export function normaliseArticleSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function articleSlug(record: RuntimeContentRecord): string {
  const page = record.page.trim().toLowerCase();
  if (page && page !== "articles" && page !== "article") return normaliseArticleSlug(record.page);
  if (record.section) return normaliseArticleSlug(record.section);
  return normaliseArticleSlug(record.title || record.contentId);
}

export function capArticleBlurb(value: string, maximum = 30): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maximum) return words.join(" ");
  return `${words.slice(0, maximum).join(" ")}…`;
}

function validArticleSections(sections: RuntimeContentRecord[]): RuntimeContentRecord[] {
  const counts = new Map<string, number>();
  sections.forEach((section) => counts.set(section.contentId, (counts.get(section.contentId) ?? 0) + 1));
  const duplicateIds = new Set(Array.from(counts).filter(([, count]) => count > 1).map(([id]) => id));

  return sections.filter(
    (section) =>
      section.published &&
      section.active &&
      section.contentId.trim() &&
      section.title.trim() &&
      section.body.trim() &&
      !duplicateIds.has(section.contentId)
  );
}

export function buildGovernedArticles(content: RuntimeContentRecord[]): Article[] {
  const grouped = new Map<string, RuntimeContentRecord[]>();

  for (const record of content) {
    const slug = articleSlug(record);
    if (!slug || !record.title.trim()) continue;
    const records = grouped.get(slug) ?? [];
    records.push(record);
    grouped.set(slug, records);
  }

  return Array.from(grouped, ([slug, sections]) => {
    const ordered = validArticleSections(sections).sort(
      (a, b) => a.displayOrder - b.displayOrder || a.contentId.localeCompare(b.contentId)
    );
    const lead = ordered[0];
    if (!lead) return null;

    return {
      slug,
      title: lead.title.trim(),
      summary: capArticleBlurb(lead.supportingText || lead.body),
      sections: ordered,
    };
  })
    .filter((article): article is Article => article !== null)
    .sort((a, b) => {
      const aOrder = a.sections[0]?.displayOrder ?? 999;
      const bOrder = b.sections[0]?.displayOrder ?? 999;
      return aOrder - bOrder || a.title.localeCompare(b.title);
    });
}

export const getArticles = cache(async (): Promise<{
  articles: Article[];
  source: "sheet" | "fallback";
}> => {
  const { content, source } = await getRuntimeContent({ module: "Articles" });

  // Articles are governed content. Never publish bundled fallback records as live articles.
  if (source !== "sheet") return { articles: [], source };

  return { articles: buildGovernedArticles(content), source };
});

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const canonicalSlug = normaliseArticleSlug(slug);
  if (!canonicalSlug) return null;

  const { articles } = await getArticles();
  return articles.find((article) => article.slug === canonicalSlug) ?? null;
}
