import { AffiliateLink } from "@/types";
import { cache } from "react";
import { getSheetRows, isLive } from "./googleSheets";

type AffiliateRow = { AffiliateID?: string; Brand?: string; Product?: string; Category?: string; AffiliateURL?: string; ImageURL?: string; Status?: string; };
function clean(value: string | undefined): string { return (value ?? "").trim(); }
function isHttpsUrl(value: string): boolean { try { return new URL(value).protocol === "https:"; } catch { return false; } }
function mapRow(row: AffiliateRow): AffiliateLink {
  return {
    affiliateId: clean(row.AffiliateID), brand: clean(row.Brand), product: clean(row.Product),
    category: clean(row.Category), affiliateUrl: clean(row.AffiliateURL),
    imageUrl: isHttpsUrl(clean(row.ImageURL)) ? clean(row.ImageURL) : "",
    status: isLive(row.Status) ? "Live" : "Draft",
  };
}
function duplicateValues(values: string[]): Set<string> {
  const seen = new Set<string>(); const duplicates = new Set<string>();
  values.forEach((value) => { if (seen.has(value)) duplicates.add(value); else seen.add(value); });
  return duplicates;
}
export async function getAffiliateLinks(category?: string): Promise<AffiliateLink[]> {
  const rows = await getSheetRows<AffiliateRow>("09_Affiliate_Products");
  if (!rows) return [];
  const live = rows.map(mapRow).filter((link) => link.status === "Live" && link.affiliateId && link.brand && link.product && link.category && isHttpsUrl(link.affiliateUrl));
  const duplicateIds = duplicateValues(live.map((link) => link.affiliateId));
  if (duplicateIds.size) console.error("[affiliates] Duplicate published affiliate IDs", Array.from(duplicateIds));
  let links = live.filter((link) => !duplicateIds.has(link.affiliateId));
  if (category) links = links.filter((link) => link.category.toLowerCase() === category.trim().toLowerCase());
  return links;
}
export const getCachedAffiliateLinks = cache(getAffiliateLinks);
export async function getAffiliateCategories(): Promise<string[]> {
  const links = await getCachedAffiliateLinks();
  return Array.from(new Set(links.map((link) => link.category.trim()).filter(Boolean))).sort();
}
