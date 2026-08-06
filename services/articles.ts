import { cache } from "react";
import type { RuntimeContentRecord } from "@/types";
import {
  readFirstAvailableRuntimeTab,
  runtimeBoolean,
  runtimePublished,
} from "./runtimeContent";
import { ARTICLE_SECTION_TABS, ARTICLE_TABS } from "./runtimeSources";

interface RuntimeRow {
  [key: string]: string;
}

interface ArticleHeader {
  articleId: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  publishedDate: string;
  displayOrder: number;
  active: boolean;
  published: boolean;
}

export interface Article {
  slug: string;
  title: string;
  summary: string;
  category: string;
  publishedDate: string;
  sections: RuntimeContentRecord[];
}

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

function numberValue(input: unknown, fallback = 999): number {
  const parsed = Number(clean(input));
  return Number.isFinite(parsed) ? parsed : fallback;
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
      category: lead.contentType.trim() || "Article",
      publishedDate: "",
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

function mapArticleHeader(row: RuntimeRow): ArticleHeader {
  return {
    articleId: value(row, "Article ID"),
    slug: normaliseArticleSlug(value(row, "Slug")),
    title: value(row, "Headline"),
    summary: value(row, "Short Summary", "Standfirst"),
    category: value(row, "Category", "Article Type") || "Article",
    publishedDate: value(row, "Published Date"),
    displayOrder: numberValue(value(row, "Display Order")),
    active: value(row, "Active") ? runtimeBoolean(value(row, "Active")) : false,
    published: runtimePublished(row),
  };
}

function mapArticleSection(row: RuntimeRow): RuntimeContentRecord & { articleId: string } {
  return {
    articleId: value(row, "Article ID"),
    contentId: value(row, "Section ID"),
    module: "Articles",
    page: value(row, "Article Slug"),
    section: value(row, "Section Key"),
    contentType: value(row, "Section Type") || "Section",
    title: value(row, "Heading"),
    body: value(row, "Body"),
    supportingText: value(row, "Supporting Text", "Quote / Callout", "List Items"),
    displayOrder: numberValue(value(row, "Display Order")),
    active: value(row, "Active") ? runtimeBoolean(value(row, "Active")) : false,
    reviewStatus: value(row, "Review Status"),
    published: runtimePublished(row),
    notes: value(row, "Notes"),
    source: "sheet",
  };
}

export function buildArticlesFromRuntimeRows(
  articleRows: RuntimeRow[],
  sectionRows: RuntimeRow[]
): Article[] {
  const headers = articleRows
    .map(mapArticleHeader)
    .filter((header) =>
      header.articleId &&
      header.slug &&
      header.title &&
      header.active &&
      header.published
    );

  const sections = sectionRows.map(mapArticleSection);

  return headers
    .map((header) => {
      const articleSections = validArticleSections(
        sections.filter((section) => section.articleId === header.articleId)
      ).sort((a, b) => a.displayOrder - b.displayOrder || a.contentId.localeCompare(b.contentId));

      if (articleSections.length === 0) return null;

      return {
        slug: header.slug,
        title: header.title,
        summary: capArticleBlurb(header.summary || articleSections[0]?.body || ""),
        category: header.category,
        publishedDate: header.publishedDate,
        sections: articleSections,
        displayOrder: header.displayOrder,
      };
    })
    .filter((article): article is Article & { displayOrder: number } => article !== null)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.title.localeCompare(b.title))
    .map(({ displayOrder: _displayOrder, ...article }) => article);
}

export const getArticles = cache(async (): Promise<{
  articles: Article[];
  source: "sheet" | "fallback";
}> => {
  const [articleResult, sectionResult] = await Promise.all([
    readFirstAvailableRuntimeTab<RuntimeRow>(ARTICLE_TABS),
    readFirstAvailableRuntimeTab<RuntimeRow>(ARTICLE_SECTION_TABS),
  ]);

  // Articles are governed content. Both dedicated runtime tabs must be present;
  // bundled fallback records must never be published as live articles.
  if (!articleResult.rows || !sectionResult.rows) {
    return { articles: [], source: "fallback" };
  }

  return {
    articles: buildArticlesFromRuntimeRows(articleResult.rows, sectionResult.rows),
    source: "sheet",
  };
});

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const canonicalSlug = normaliseArticleSlug(slug);
  if (!canonicalSlug) return null;

  const { articles } = await getArticles();
  return articles.find((article) => article.slug === canonicalSlug) ?? null;
}
