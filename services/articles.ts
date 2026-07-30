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
  articles: Article