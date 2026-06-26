import { AffiliateLink } from "@/types";
import { getSheetRows, isLive } from "./googleSheets";

type AffiliateRow = {
  AffiliateID: string;
  Brand: string;
  Product: string;
  Category: string;
  AffiliateURL: string;
  ImageURL: string;
  Status: string;
};

function mapRow(row: AffiliateRow): AffiliateLink {
  return {
    affiliateId: row.AffiliateID,
    brand: row.Brand,
    product: row.Product,
    category: row.Category,
    affiliateUrl: row.AffiliateURL,
    imageUrl: row.ImageURL,
    status: (row.Status as AffiliateLink["status"]) || "Draft",
  };
}

export async function getAffiliateLinks(category?: string): Promise<AffiliateLink[]> {
  const rows = await getSheetRows<AffiliateRow>("09_Affiliate_Products");
  if (!rows) return [];

  let links = rows.map(mapRow).filter((link) => isLive(link.status));

  if (category) {
    links = links.filter((link) => link.category.toLowerCase() === category.toLowerCase());
  }

  return links;
}