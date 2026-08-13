import { cache } from "react";

export interface ArticleSection {
  contentId: string;
  title: string;
  body: string;
  supportingText?: string;
}

export interface Article {
  slug: string;
  title: string;
  summary: string;
  category: string;
  publishedDate: string;
  sections: ArticleSection[];
}

export function normaliseArticleSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function capArticleBlurb(value: string, maximum = 30): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  return words.length <= maximum ? words.join(" ") : `${words.slice(0, maximum).join(" ")}…`;
}

async function loadArticles(): Promise<{ articles: Article[]; source: "unpublished" }> {
  // No legacy WillItFit content fallback in RC1. Articles remain available
  // as a capability scaffold and fail closed until a WillItFly-native
  // governed Runtime contract is explicitly wired.
  return { articles: [], source: "unpublished" };
}

export const getArticles = cache(loadArticles);

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const normalized = normaliseArticleSlug(slug);
  if (!normalized) return null;
  const { articles } = await getArticles();
  return articles.find((article) => article.slug === normalized) ?? null;
}
