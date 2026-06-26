import { TravelTip } from "@/types";
import { getSheetRows, isLive } from "./googleSheets";

type TipRow = {
  TipID: string;
  Title: string;
  Slug: string;
  Content: string;
  Category: string;
  SEOKeyword: string;
  CTA: string;
  Status: string;
};

function mapRow(row: TipRow): TravelTip {
  return {
    tipId: row.TipID,
    title: row.Title,
    slug: row.Slug,
    category: row.Category,
    tip: row.Content,
    status: (row.Status as TravelTip["status"]) || "Draft",
  };
}

export async function getTravelTips(): Promise<{ tips: TravelTip[] }> {
  const rows = await getSheetRows<TipRow>("06_Travel_Tips");
  if (!rows) return { tips: [] };

  const tips = rows
    .map(mapRow)
    .filter((tip) => tip.slug && isLive(tip.status));

  return { tips };
}

export async function getTravelTipBySlug(slug: string): Promise<TravelTip | null> {
  const { tips } = await getTravelTips();
  return tips.find((tip) => tip.slug === slug) ?? null;
}

export async function getAllTravelTipSlugs(): Promise<string[]> {
  const { tips } = await getTravelTips();
  return tips.map((tip) => tip.slug).filter(Boolean);
}