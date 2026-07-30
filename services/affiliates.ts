import { AffiliateLink } from "@/types";
import { cache } from "react";
import { readFirstAvailableRuntimeTab, runtimePublished } from "./runtimeContent";
import { AFFILIATE_PRODUCT_TABS } from "./runtimeSources";

export { AFFILIATE_PRODUCT_TABS } from "./runtimeSources";

type AffiliateRow = Record<string, string>;

function clean(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function value(row: AffiliateRow, ...names: string[]): string {
  for (const name of names) {
    const candidate = clean(row[name]);
    if (candidate) return candidate;
  }
  return "";
}

function isHttpsUrl(input: string): boolean {
  try {
    return new URL(input).protocol === "https:";
  } catch {
    return false;
  }
}

export function mapAffiliateRow(row: AffiliateRow): AffiliateLink {
  const destinationUrl = value(row, "Destination URL", "Affiliate URL", "AffiliateURL");
  const imageUrl = value(row, "Image URL", "ImageURL");

  return {
    affiliateId: value(row, "Affiliate ID", "AffiliateID"),
    brand: value(row, "Brand", "Merchant"),
    product: value(row, "Product Name", "Product"),
    category: value(row, "Category"),
    affiliateUrl: destinationUrl,
    imageUrl: isHttpsUrl(imageUrl) ? imageUrl : "",
    status: runtimePublished(row) ? "Live" : "Draft",
  };
}

function duplicateValues(values: string[]): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  values.forEach((item) => {
    if (seen.has(item)) duplicates.add(item);
    else seen.add(item);
  });
  return duplicates;
}

export async function getAffiliateLinks(category?: string): Promise<AffiliateLink[]> {
  const { rows } = await readFirstAvailableRuntimeTab<AffiliateRow>(AFFILIATE_PRODUCT_TABS);
  if (!rows) return [];

  const published = rows.map(mapAffiliateRow).filter((link) => link.status === "Live");
  const missingIds = published.filter((link) => !link.affiliateId);
  const incomplete = published.filter((link) =>
    link.affiliateId && (!link.product || !link.category || !isHttpsUrl(link.affiliateUrl))
  );

  if (missingIds.length > 0) {
    console.error("[affiliates] Rejected published affiliate placements without Affiliate ID", {
      count: missingIds.length,
    });
  }
  if (incomplete.length > 0) {
    console.error(
      "[affiliates] Rejected incomplete published affiliate placements",
      incomplete.map((link) => link.affiliateId)
    );
  }

  const valid = published.filter((link) =>
    link.affiliateId && link.product && link.category && isHttpsUrl(link.affiliateUrl)
  );
  const duplicateIds = duplicateValues(valid.map((link) => link.affiliateId));
  if (duplicateIds.size > 0) {
    console.error("[affiliates] Duplicate published affiliate IDs", Array.from(duplicateIds));
  }

  let links = valid.filter((link) => !duplicateIds.has(link.affiliateId));
  if (category) {
    links = links.filter((link) =>
      link.category.toLowerCase() === category.trim().toLowerCase()
    );
  }
  return links;
}

export const getCachedAffiliateLinks = cache(getAffiliateLinks);

export async function getAffiliateCategories(): Promise<string[]> {
  const links = await getCachedAffiliateLinks();
  return Array.from(new Set(links.map((link) => link.category.trim()).filter(Boolean))).sort();
}
