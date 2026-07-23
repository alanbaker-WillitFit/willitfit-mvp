import { cache } from "react";
import type { AffiliateSlot } from "@/types";
import { affiliatePlaceholdersForCategory, visibleTravelEssentialCategories } from "@/data/travelEssentials";
import { readFirstAvailableRuntimeTab, runtimeBoolean, runtimePublished } from "./runtimeContent";
import { toNumber } from "./googleSheets";

export const AFFILIATE_PRODUCT_TABS = ["09_Affiliate_Products", "Affiliate Products"] as const;
const SLOTS_PER_CATEGORY = 10;
type ProductRow = Record<string, string>;

function value(row: ProductRow, ...names: string[]) {
  for (const name of names) {
    const candidate = String(row[name] ?? "").trim();
    if (candidate) return candidate;
  }
  return "";
}

function safeHttpsUrl(input: string) {
  try {
    const url = new URL(input);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function buildAffiliateSlots(rows: ProductRow[] = []): AffiliateSlot[] {
  const candidates = rows.flatMap((row) => {
    if (!runtimePublished(row)) return [];
    const category = value(row, "Category", "Product Category").toLowerCase();
    const position = toNumber(value(row, "Slot Position", "Position", "Display Order"), 0);
    const affiliateUrl = safeHttpsUrl(value(row, "Affiliate URL", "AffiliateURL", "URL"));
    if (!category || position < 1 || position > SLOTS_PER_CATEGORY || !affiliateUrl) return [];
    return [{
      slotId: value(row, "Affiliate Slot ID", "SlotID", "AffiliateID") || `${category}-${String(position).padStart(2, "0")}`,
      category,
      position,
      title: value(row, "Product Title", "Product", "Title"),
      description: value(row, "Description", "Supporting Text"),
      merchant: value(row, "Merchant", "Brand"),
      imageUrl: safeHttpsUrl(value(row, "Image URL", "ImageURL")),
      affiliateUrl,
      cta: value(row, "CTA", "CTA Text") || "View product",
      priceText: value(row, "Price Text", "Price"),
      disclosure: value(row, "Disclosure") || "Affiliate link",
      active: value(row, "Active") ? runtimeBoolean(value(row, "Active")) : true,
      reviewStatus: value(row, "Review Status", "Status"),
      published: true,
      lastReviewed: value(row, "Last Reviewed", "LastReviewed"),
      notes: value(row, "Notes"),
      placeholder: false,
    } satisfies AffiliateSlot];
  });

  const unique = new Map<string, AffiliateSlot>();
  for (const slot of candidates) {
    const key = `${slot.category}:${slot.position}`;
    if (!unique.has(key)) unique.set(key, slot);
  }

  return visibleTravelEssentialCategories.flatMap((category) => {
    const placeholders = affiliatePlaceholdersForCategory(category.slug);
    return Array.from({ length: SLOTS_PER_CATEGORY }, (_, index) =>
      unique.get(`${category.slug}:${index + 1}`) ?? placeholders[index]!
    );
  });
}

async function loadAffiliateSlots() {
  const { rows, tabName } = await readFirstAvailableRuntimeTab<ProductRow>(AFFILIATE_PRODUCT_TABS);
  return {
    slots: buildAffiliateSlots(rows ?? []),
    source: rows ? "sheet" as const : "fallback" as const,
    tabName,
  };
}

export const getAffiliateSlots = cache(loadAffiliateSlots);
