import { MetadataRoute } from "next";
import { getCachedAirlines } from "@/services/airlines";
import { getCachedTravelTips } from "@/services/tips";
import { getCachedSeoPages } from "@/services/seoPages";
import { siteUrl } from "@/lib/utils";

function reviewedDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return undefined;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ airlines }, { tips }, seoPages] = await Promise.all([getCachedAirlines(), getCachedTravelTips(), getCachedSeoPages()]);

  const staticRoutes = ["", "/airlines", "/tips", "/about", "/contact", "/products", "/ask", "/privacy", "/accessibility", "/legal"].map((path) => ({
    url: siteUrl(path),
  }));

  const airlineRoutes = airlines.map((airline) => ({
    url: siteUrl(`/${airline.slug}`),
    lastModified: reviewedDate(airline.lastUpdated),
  }));

  const tipRoutes = tips.map((tip) => ({
    url: siteUrl(`/tips/${tip.slug}`),
  }));

  const airlineSlugs = new Set(airlines.map((airline) => airline.slug));
  const seoRoutes = seoPages
    .filter((page) => !airlineSlugs.has(page.pageSlug))
    .map((page) => ({ url: siteUrl(`/${page.pageSlug}`) }));

  const knowledgeRoutes = (await import("@/services/knowledge")).KNOWLEDGE_OBJECTS.map((item) => ({ url: siteUrl(`/ask/${item.slug}`) }));

  return [...staticRoutes, ...airlineRoutes, ...tipRoutes, ...seoRoutes, ...knowledgeRoutes];
}
