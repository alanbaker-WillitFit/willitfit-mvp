import { cache } from "react";
import type { RuntimeContentRecord } from "@/types";
import { getRuntimeContent } from "./runtimeContent";

export interface Article {
  slug: string;
  title: string;
  summary: string;
  sections: RuntimeContentRecord[];
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function articleSlug(record: RuntimeContentRecord): string {
  const page = record.page.trim().toLowerCase();
  if (page && page !== "articles" && page !== "article") return slugify(record.page);
  if (record.section) return slugify(record.section);
  return slugify(record.title || record.contentId);
}

export const getArticles = cache(async (): Promise<{
  articles: Article[];
  source: "sheet" | "fallback";
}> => {
  const { content, source } = await getRuntimeContent({ module: "Articles" });
  const grouped = new Map<string, RuntimeContentRecord[]>();

  for (const record of content) {
    const slug = articleSlug(record);
    if (!slug) continue;
    const records = grouped.get(slug) ?? [];
    records.push(record);
    grouped.set(slug, records);
  }

  const articles = Array.from(grouped, ([slug, sections]) => {
    const ordered = [...sections].sort(
      (a, b) => a.displayOrder - b.displayOrder || a.contentId.localeCompare(b.contentId)
    );
    const lead = ordered[0];

    return {
      slug,
      title: lead?.title || slug.replace(/-/g, " "),
      summary: lead?.supportingText || lead?.body || "",
      sections: ordered,
    };
  }).sort((a, b) => {
    const aOrder = a.sections[0]?.displayOrder ?? 999;
    const bOrder = b.sections[0]?.displayOrder ?? 999;
    return aOrder - bOrder || a.title.localeCompare(b.title);
  });

  return { articles, source };
});

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { articles } = await getArticles();
  return articles.find((article) => article.slug === slug) ?? null;
}
