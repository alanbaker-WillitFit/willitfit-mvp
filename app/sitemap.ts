import { MetadataRoute } from "next";
import { getCachedAirlineReferences } from "@/services/airlines";
import { getCachedTravelTips } from "@/services/tips";
import { getCachedSeoPages } from "@/services/seoPages";
import { siteUrl } from "@/lib/utils";
import { getAirportReferences, getPublishingAirports } from "@/services/publishingData";
import { getFareGroups, getSizeGroups } from "@/services/baggageKnowledge";
import { getArticles } from "@/services/articles";

function reviewedDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return undefined;
  const parsed = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ airlines }, { tips }, seoPages, airports, airportReferences, { articles }] = await Promise.all([
    getCachedAirlineReferences(),
    getCachedTravelTips(),
    getCachedSeoPages(),
    getPublishingAirports(),
    getAirportReferences(),
    getArticles(),
  ]);

  const staticRoutes = [
    "", "/airlines", "/airports", "/fit/compare/airlines", "/size-guides", "/tips", "/about", "/contact",
    "/products", "/ask", "/data", "/privacy", "/accessibility", "/legal", "/baggage", "/airline-summaries",
    "/articles", "/compare", "/compare/cabin-bag-sizes", "/compare/personal-item-sizes",
    "/compare/checked-bag-weights", "/sizes",
  ].map((path) => ({ url: siteUrl(path) }));

  const airlineRoutes = airlines.map((airline) => ({
    url: siteUrl(`/${airline.slug}`),
    lastModified: reviewedDate(airline.lastUpdated),
  }));
  const airlineBaggageRoutes = airlines.map((airline) => ({
    url: siteUrl(`/airlines/${airline.slug}/baggage`),
    lastModified: reviewedDate(airline.lastUpdated),
  }));
  const fareRoutes = airlines.flatMap((airline) =>
    getFareGroups(airline.airlineId).map((fare) => ({
      url: siteUrl(`/airlines/${airline.slug}/fares/${fare.fareSlug}`),
      lastModified: reviewedDate(airline.lastUpdated),
    }))
  );
  const sizeRoutes = getSizeGroups().map((group) => ({ url: siteUrl(`/sizes/${group.key}`) }));
  const articleRoutes = articles.map((article) => ({ url: siteUrl(`/articles/${article.slug}`) }));

  const airportReferenceById = new Map(airportReferences.map((item) => [item.airportId, item]));
  const airportRoutes = airports.flatMap((airport) => {
    const reviewed = airportReferenceById.get(airport.airportId)?.lastCheckedAt;
    const lastModified = reviewed && Number.isFinite(Date.parse(reviewed)) ? new Date(reviewed) : undefined;
    return [
      { url: siteUrl(`/airports/${airport.slug}`), ...(lastModified ? { lastModified } : {}) },
      { url: siteUrl(`/airports/${airport.slug}/delays`), ...(lastModified ? { lastModified } : {}) },
    ];
  });

  const tipRoutes = tips.map((tip) => ({ url: siteUrl(`/tips/${tip.slug}`) }));
  const airlineSlugs = new Set(airlines.map((airline) => airline.slug));
  const seoRoutes = seoPages
    .filter((page) => !airlineSlugs.has(page.pageSlug))
    .map((page) => ({ url: siteUrl(`/${page.pageSlug}`) }));
  const knowledgeRoutes = (await import("@/services/knowledge")).KNOWLEDGE_OBJECTS.map((item) => ({
    url: siteUrl(`/ask/${item.slug}`),
  }));

  return [
    ...staticRoutes, ...airlineRoutes, ...airlineBaggageRoutes, ...fareRoutes, ...sizeRoutes, ...articleRoutes,
    ...airportRoutes, ...tipRoutes, ...seoRoutes, ...knowledgeRoutes,
  ];
}
