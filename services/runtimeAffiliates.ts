import { cache } from "react";
import type { AffiliateSlot } from "@/types";
import {
  affiliatePlaceholdersForCategory,
  isAffiliateRuntimeCategoryKey,
  visibleTravelEssentialCategories,
} from "@/data/travelEssentials";
import { readFirstAvailableRuntimeTab, runtimeBoolean, runtimePublished } from "./runtimeContent";
import { toNumber } from "./googleSheets";

export const AFFILIATE_PRODUCT_TABS = ["09_Affiliates", "09_Affiliate_Products", "Affiliate Products"] as const;
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

    const activeValue = value(row, "Active");
    if (activeValue && !runtimeBoolean(activeValue)) return [];

    const category = value(row, "Category Key", "Runtime Category Key", "Category", "Product Category").toLowerCase();
    const position = toNumber(value(row, "Slot Position", "Position", "Display Order"), 0);
    const affiliateUrl = safeHttpsUrl(value(row, "Destination URL", "Affiliate URL", "AffiliateURL", "URL"));

    if (!isAffiliateRuntimeCategoryKey(category)) return [];
    if (position < 1 || position > SLOTS_PER_CATEGORY || !affiliateUrl) return [];

    return [{
      slotId: value(row, "Affiliate ID", "Affiliate Slot ID", "SlotID", "AffiliateID") || `${category}-${String(position).padStart(2, "0")}`,
      category,
      position,
      title: value(row, "Product Name", "Product Title", "Product", "Title"),
      description: value(row, "Product Description", "Description", "Supporting Line", "Supporting Text"),
      merchant: value(row, "Merchant", "Brand"),
      imageUrl: safeHttpsUrl(value(row, "Image Reference", "Image URL", "ImageURL")),
      affiliateUrl,
      cta: value(row, "CTA", "CTA Text") || "View product",
      priceText: value(row, "Price Text", "Price"),
      disclosure: value(row, "Disclosure") || "Affiliate link",
      active: true,
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
    const placeholders = affiliatePlaceholdersForCategory(category.runtimeKey);
    return Array.from({ length: SLOTS_PER_CATEGORY }, (_, index) =>
      unique.get(`${category.runtimeKey}:${index + 1}`) ?? placeholders[index]!
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
