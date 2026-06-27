import { SeoPage, FaqItem } from "@/types";
import { getSheetRows, isLive } from "./googleSheets";

type SeoPageRow = {
  PageSlug: string;
  Title: string;
  MetaDescription: string;
  H1: string;
  BodyContent: string;
  FAQJSON: string;
  Status: string;
};

function parseFaq(raw: string): FaqItem[] {
  if (!raw || !raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.question === "string" &&
          typeof item.answer === "string"
      )
      .map((item) => ({
        question: item.question,
        answer: item.answer,
      }));
  } catch {
    console.error("[seoPages] malformed FAQJSON");
    return [];
  }
}

function mapRow(row: SeoPageRow): SeoPage {
  return {
    pageSlug: row.PageSlug,
    title: row.Title,
    metaDescription: row.MetaDescription,
    h1: row.H1,
    bodyContent: row.BodyContent,
    faq: parseFaq(row.FAQJSON),
    status: (row.Status as SeoPage["status"]) || "Draft",
  };
}

export async function getAllSeoPages(): Promise<SeoPage[]> {
  const rows = await getSheetRows<SeoPageRow>("SEO Pages");

  if (!rows) return [];

  return rows
    .map(mapRow)
    .filter((page) => isLive(page.status));
}

export async function getSeoPageBySlug(
  slug: string
): Promise<SeoPage | null> {
  const pages = await getAllSeoPages();

  return pages.find((page) => page.pageSlug === slug) ?? null;
}