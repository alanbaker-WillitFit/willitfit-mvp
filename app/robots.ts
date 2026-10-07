import { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/diagnostics", "/preprod/"],
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
