// ── Sheet-backed domain types ──────────────────────────────────────────────
// These mirror the columns of each Google Sheets tab 1:1 so the mapping
// layer in /services stays a thin, obvious translation.

export type SheetStatus = "Live" | "Draft" | "Archived";
export type BagType = "cabinBag" | "personalItem" | "checkedBag";

export interface Dimensions {
  heightCm: number;
  widthCm: number;
  depthCm: number;
}

export type LinearLimitOperator = "lt" | "lte";

export type BaggageSizingRule =
  | {
      method: "fixed-dimensions";
      dimensions: Dimensions;
    }
  | {
      method: "linear-total";
      linearLimitCm: number;
      operator: LinearLimitOperator;
    }
  | {
      method: "weight-only";
    };

export interface FareClassAllowance {
  fareClass: string;
  cabinBag: Dimensions | null;
  personalItem: Dimensions | null;
  checkedBag?: BaggageSizingRule | null;
  weightLimitKg: number | null;
  checkedWeightLimitKg?: number | null;
}

export interface Airline {
  airlineId: string;
  airlineName: string;
  slug: string;
  country: string;
  logoUrl: string;
  personalItem: Dimensions;
  cabinBag: Dimensions;
  checkedBag?: BaggageSizingRule;
  weightLimitKg: number | null;
  checkedWeightLimitKg?: number | null;
  fareClasses: FareClassAllowance[];
  websiteUrl: string;
  lastUpdated: string;
  status: SheetStatus;
  searchPriority?: number;
  notes?: string;
  hasCabinBag?: boolean;
  hasPersonalItem?: boolean;
  hasCheckedBag?: boolean;
}

export type SpecialBaggageCategoryId =
  | "buggies-prams"
  | "bicycles"
  | "wheelchairs"
  | "mobility-scooters"
  | "golf-bags"
  | "skis-snowboards"
  | "child-car-seats"
  | "surfboards-longboards"
  | "musical-instruments"
  | "scuba-diving-equipment"
  | "fishing-equipment"
  | "large-musical-instruments"
  | "kiteboards-wakeboards"
  | "medical-equipment-cases";

export interface SpecialBaggageResult {
  resultId: string;
  rank: number;
  categoryId: SpecialBaggageCategoryId;
  category: string;
  linkedItemIds: string[];
  title: string;
  summary: string;
  preparationGuidance: string;
  feeGuidance: string;
  policyLinkLabel: string;
  policyLinkSource: string;
  mobilityOrMedical: boolean;
  reviewStatus: string;
  published: boolean;
  notes: string;
  source: "sheet";
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
  focusAirline?: string;
  journeyStage?: string;
  resultContext?: string;
  affiliateCategory?: string;
  priority?: number;
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

export interface FaqItem { question: string; answer: string; }
export interface PollQuestion { question: string; options: string[]; category: string; status: SheetStatus; }

export interface AffiliateLink {
  affiliateId: string; brand: string; product: string; category: string;
  affiliateUrl: string; imageUrl: string; status: SheetStatus;
}

export type RuntimeContentModule =
  | "About" | "Travel Tips" | "Hints" | "FAQs" | "Affiliate Products"
  | "Affiliate Content" | "Recommendation Cards" | "Notices" | string;

export interface RuntimeContentRecord {
  contentId: string; module: RuntimeContentModule; page: string; section: string;
  contentType: string; title: string; body: string; supportingText: string;
  linkLabel?: string; linkUrl?: string;
  displayOrder: number; active: boolean; reviewStatus: string; published: boolean;
  notes: string; source: "sheet" | "fallback";
}

export interface AffiliateSlot {
  slotId: string; category: string; position: number; title: string; description: string;
  merchant: string; imageUrl: string; affiliateUrl: string; cta: string; priceText: string;
  disclosure: string; active: boolean; reviewStatus: string; published: boolean;
  lastReviewed: string; notes: string; placeholder: boolean;
}

export interface LabConfiguration {
  configId: string; gameId: string; gameName: string; gamePath: string; triggerType: string;
  triggerValue: string; bagTypes: BagType[]; resultStates: FitVerdict[]; priority: number;
  implementationReference: string; invitationTitle: string; invitationBody: string; cta: string;
  active: boolean; reviewStatus: string; published: boolean; source: "sheet" | "fallback";
}

// ── Fit calculation ─────────────────────────────────────────────────────────

export type FitVerdict = "fits" | "close" | "no-fit";
export type WeightVerdict = "fits" | "no-fit" | "not-checked" | "not-published";

export interface FitResult {
  verdict: FitVerdict;
  airline: Airline;
  bagType: BagType;
  userDimensions: Dimensions;
  sizingRule: BaggageSizingRule;
  limit: Dimensions | null;
  userLinearTotalCm: number | null;
  linearLimitCm: number | null;
  linearOperator: LinearLimitOperator | null;
  linearMarginCm: number | null;
  weightLimitKg: number | null;
  userWeightKg: number | null;
  weightVerdict: WeightVerdict;
  fareClass: string | null;
  overBy: Partial<Dimensions>;
  spareCm: Partial<Dimensions>;
  withinCm: number | null;
  orientationUsed: Dimensions | null;
}

// ── Data fetch envelope ──────────────────────────────────────────────────────

export interface DataResult<T> {
  data: T;
  source: "sheet" | "fallback";
  error?: string;
}
