import { TravelTip } from "@/types";
import { getSheetRows, isLive, slugify } from "./googleSheets";
import { FALLBACK_TIPS } from "@/data/fallback";

type TipRow = {
  TipID: string;
  Title: string;
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
    slug: slugify(row.Title),
    content: row.Content,
    category: row.Category,
    seoKeyword: row.SEOKeyword,
    cta: row.CTA,
    status: (row.Status as TravelTip["status"]) || "Draft",
  };
}

export async function getTravelTips(): Promise<{ tips: TravelTip[]; source: "sheet" | "fallback" }> {
  const rows = await getSheetRows<TipRow>("Travel Tips");

  if (!rows || rows.length === 0) {
    return { tips: FALLBACK_TIPS, source: "fallback" };
  }

  const tips = rows.map(mapRow).filter((t) => isLive(t.status) && t.title);
  if (tips.length === 0) {
    return { tips: FALLBACK_TIPS, source: "fallback" };
  }

  return { tips, source: "sheet" };
}

export async function getTipBySlug(
  slug: string
): Promise<{ tip: TravelTip | null; source: "sheet" | "fallback" }> {
  const { tips, source } = await getTravelTips();
  const tip = tips.find((t) => t.slug === slug) ?? null;
  return { tip, source };
}

export async function getRelatedTip(category?: string): Promise<TravelTip | null> {
  const { tips } = await getTravelTips();
  if (tips.length === 0) return null;
  if (category) {
    const match = tips.find((t) => t.category.toLowerCase() === category.toLowerCase());
    if (match) return match;
  }
  return tips[Math.floor(Math.random() * tips.length)] ?? null;
}
