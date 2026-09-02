import { MetadataRoute } from "next";
import { getCachedAirlines } from "@/services/airlines";
import { getCachedTravelTips } from "@/services/tips";
import { getCachedSeoPages } from "@/services/seoPages";
import { siteUrl } from "@/lib/utils";
import { getAirportReferences, getPublishingAirports } from "@/services/publishingData";

function reviewedDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return undefined;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ airlines }, { tips }, seoPages, airports, airportReferences] = await Promise.all([getCachedAirlines(), getCachedTravelTips(), getCachedSeoPages(), getPublishingAirports(), getAirportReferences()]);

  const staticRoutes = ["", "/airlines", "/airports", "/fit/compare/airlines", "/size-guides", "/articles", "/tips", "/about", "/contact", "/products", "/ask", "/privacy", "/accessibility", "/legal"].map((path) => ({
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

  const airportReferenceById = new Map(airportReferences.map((item) => [item.airportId, item]));
  const airportRoutes = airports.flatMap((airport) => {
    const reviewed = airportReferenceById.get(airport.airportId)?.lastCheckedAt;
    const lastModified = reviewed && Number.isFinite(Date.parse(reviewed)) ? new Date(reviewed) : undefined;
    return [
      { url: siteUrl(`/airports/${airport.slug}`), ...(lastModified ? { lastModified } : {}) },
      { url: siteUrl(`/airports/${airport.slug}/delays`), ...(lastModified ? { lastModified } : {}) },
    ];
  });

  const knowledgeRoutes = (await import("@/services/knowledge")).KNOWLEDGE_OBJECTS.map((item) => ({ url: siteUrl(`/ask/${item.slug}`) }));

  return [...staticRoutes, ...airlineRoutes, ...airportRoutes, ...tipRoutes, ...seoRoutes, ...knowledgeRoutes];
}
