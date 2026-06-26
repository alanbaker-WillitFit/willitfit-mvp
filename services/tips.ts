import { TravelTip } from "@/types";
import { getSheetRows, isLive } from "./googleSheets";

type TipRow = {
  TipID?: string;
  Title?: string;
  Slug?: string;
  Content?: string;
  Category?: string;
  SEOKeyword?: string;
  CTA?: string;
  Status?: string;
};

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

function mapRow(row: TipRow): TravelTip {
  return {
    tipId: clean(row.TipID),
    title: clean(row.Title),
    slug: clean(row.Slug),
    category: clean(row.Category),
    content: clean(row.Content),
    cta: clean(row.CTA),
    status: (clean(row.Status) as TravelTip["status"]) || "Draft",
  };
}

export async function getTravelTips(): Promise<{ tips: TravelTip[] }> {
  const rows = await getSheetRows<TipRow>("06_Travel_Tips");
  if (!rows) return { tips: [] };

  const tips = rows
    .map(mapRow)
    .filter((tip) => tip.slug && tip.title && isLive(tip.status));

  return { tips };
}

export async function getTipBySlug(slug: string): Promise<{ tip: TravelTip | null }> {
  const { tips } = await getTravelTips();
  const tip = tips.find((item) => item.slug === slug) ?? null;

  return { tip };
}

export async function getAllTravelTipSlugs(): Promise<string[]> {
  const { tips } = await getTravelTips();
  return tips.map((tip) => tip.slug).filter(Boolean);
}