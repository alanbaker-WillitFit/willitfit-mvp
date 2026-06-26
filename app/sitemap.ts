import { MetadataRoute } from "next";
import { getAllAirlineSlugs } from "@/services/airlines";
import { getTravelTips } from "@/services/tips";
import { siteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [airlineSlugs, { tips }] = await Promise.all([getAllAirlineSlugs(), getTravelTips()]);

  const staticRoutes = ["", "/airlines", "/tips"].map((path) => ({
    url: siteUrl(path),
    lastModified: new Date(),
  }));

  const airlineRoutes = airlineSlugs.map((slug) => ({
    url: siteUrl(`/airlines/${slug}`),
    lastModified: new Date(),
  }));

  const tipRoutes = tips.map((tip) => ({
    url: siteUrl(`/tips/${tip.slug}`),
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...airlineRoutes, ...tipRoutes];
}
