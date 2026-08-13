import type { AffiliateSlot } from "@/types";

export type TravelEssentialStatus = "ComingSoon" | "Live" | "Hidden";

export interface TravelEssentialCategory {
  id: string;
  slug: string;
  runtimeKey: string;
  title: string;
  supportingLine: string;
  imagePath: string;
  displayOrder: number;
  status: TravelEssentialStatus;
}

export const AFFILIATE_CATALOGUE_CAPACITY = 10;

export const TRAVEL_ESSENTIAL_CATEGORIES: readonly TravelEssentialCategory[] = [
  { id: "TE001", slug: "packing-cubes", runtimeKey: "packing-cubes", title: "Packing Cubes", supportingLine: "Organise more. Pack smarter.", imagePath: "/assets/travel-essentials/categories/packing-cubes.png", displayOrder: 1, status: "ComingSoon" },
  { id: "TE002", slug: "power-banks", runtimeKey: "power-banks", title: "Power Banks", supportingLine: "Power up. Keep moving.", imagePath: "/assets/travel-essentials/categories/power-banks.png", displayOrder: 2, status: "ComingSoon" },
  { id: "TE003", slug: "travel-adapters", runtimeKey: "travel-adapters", title: "Travel Adapters", supportingLine: "Plug in. Explore anywhere.", imagePath: "/assets/travel-essentials/categories/travel-adapters.png", displayOrder: 3, status: "ComingSoon" },
  { id: "TE004", slug: "luggage-scales", runtimeKey: "luggage-scales", title: "Luggage Scales", supportingLine: "Weigh smart. Travel light.", imagePath: "/assets/travel-essentials/categories/luggage-scales.png", displayOrder: 4, status: "ComingSoon" },
  { id: "TE005", slug: "travel-comfort", runtimeKey: "travel-comfort", title: "Travel Comfort", supportingLine: "Rest well. Arrive ready.", imagePath: "/assets/travel-essentials/categories/travel-comfort.png", displayOrder: 5, status: "ComingSoon" },
  { id: "TE006", slug: "esim-connectivity", runtimeKey: "esim-connectivity", title: "eSIM & Connectivity", supportingLine: "Stay connected. Anywhere in the world.", imagePath: "/assets/travel-essentials/categories/esim-connectivity.png", displayOrder: 6, status: "ComingSoon" },
] as const;

export const visibleTravelEssentialCategories = TRAVEL_ESSENTIAL_CATEGORIES
  .filter((category) => category.status !== "Hidden")
  .sort((a, b) => a.displayOrder - b.displayOrder);

export const affiliateRuntimeCategoryKeys = new Set(
  TRAVEL_ESSENTIAL_CATEGORIES.map((category) => category.runtimeKey),
);

export function isAffiliateRuntimeCategoryKey(value: string) {
  return affiliateRuntimeCategoryKeys.has(value);
}

export function getTravelEssentialCategory(id: string) {
  return visibleTravelEssentialCategories.find((category) => category.id === id) ?? null;
}

export function affiliatePlaceholdersForCategory(category: string): AffiliateSlot[] {
  return Array.from({ length: AFFILIATE_CATALOGUE_CAPACITY }, (_, index) => ({
    slotId: `${category}-${String(index + 1).padStart(2, "0")}`,
    category,
    position: index + 1,
    title: "Recommendation coming soon",
    description: "This governed recommendation slot is ready for a verified product.",
    merchant: "",
    imageUrl: "",
    affiliateUrl: "",
    cta: "",
    priceText: "",
    disclosure: "Affiliate placeholder — no product or link has been published.",
    active: true,
    reviewStatus: "Published",
    published: true,
    lastReviewed: "",
    notes: "",
    placeholder: true,
  }));
}
