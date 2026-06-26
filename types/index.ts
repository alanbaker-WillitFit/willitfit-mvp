// ── Sheet-backed domain types ──────────────────────────────────────────────
// These mirror the columns of each Google Sheets tab 1:1 so the mapping
// layer in /services stays a thin, obvious translation.

export type SheetStatus = "Live" | "Draft" | "Archived";

export interface Airline {
  airlineId: string;
  airlineName: string;
  slug: string;
  country: string;
  logoUrl: string;
  personalItem: Dimensions;
  cabinBag: Dimensions;
  weightLimitKg: number | null;
  websiteUrl: string;
  lastUpdated: string;
  status: SheetStatus;
}

export interface Dimensions {
  heightCm: number;
  widthCm: number;
  depthCm: number;
}

export interface TravelTip {
  tipId: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  seoKeyword: string;
  cta: string;
  status: SheetStatus;
}

export interface SeoPage {
  pageSlug: string;
  title: string;
  metaDescription: string;
  h1: string;
  bodyContent: string;
  faq: FaqItem[];
  status: SheetStatus;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface PollQuestion {
  question: string;
  options: string[];
  category: string;
  status: SheetStatus;
}

export interface AffiliateLink {
  affiliateId: string;
  brand: string;
  product: string;
  category: string;
  affiliateUrl: string;
  imageUrl: string;
  status: SheetStatus;
}

// ── Fit calculation ─────────────────────────────────────────────────────────

export type FitVerdict = "fits" | "close" | "no-fit";

export interface FitResult {
  verdict: FitVerdict;
  airline: Airline;
  bagType: "cabinBag" | "personalItem";
  userDimensions: Dimensions;
  overBy: Partial<Dimensions>; // cm over the limit per axis, only present if exceeded
  withinCm: number | null; // how close to the limit, only set for "close"
  orientationUsed: Dimensions; // the best-fit orientation actually compared
}

// ── Data fetch envelope ──────────────────────────────────────────────────────
// Every service call returns this shape so pages can render graceful
// fallbacks without throwing when the Sheet is unreachable or empty.

export interface DataResult<T> {
  data: T;
  source: "sheet" | "fallback";
  error?: string;
}
