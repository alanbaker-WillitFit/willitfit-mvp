import type { SeoPage } from "@/types";

export const SEO_PAGE_TABS: string[] = [];

export async function getAllSeoPages(): Promise<SeoPage[]> {
  return [];
}

export async function getCachedSeoPages(): Promise<SeoPage[]> {
  return [];
}

export async function getSeoPageBySlug(_slug: string): Promise<SeoPage | null> {
  return null;
}
