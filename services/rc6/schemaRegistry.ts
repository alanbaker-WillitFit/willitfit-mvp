import type { Rc6DatasetName } from "./runtimeContract";

export type Rc6Schema = Readonly<{
  requiredHeaders: readonly string[];
  optionalHeaders?: readonly string[];
}>;

export const RC6_SCHEMA_REGISTRY: Readonly<Partial<Record<Rc6DatasetName, Rc6Schema>>> = Object.freeze({
  settings: {
    requiredHeaders: ["Review Status", "Control Field", "Value", "Source Rule"],
    optionalHeaders: ["Publish", "Active", "Footer Label", "Runtime Target"],
  },
  airlines: {
    requiredHeaders: [
      "Airline ID", "Airline Name", "IATA Code", "Search Terms", "Country", "Website URL", "Baggage URL",
      "Display Order", "Active", "Review Status", "Last Reviewed", "Publish",
    ],
    optionalHeaders: ["Logo Reference", "Notes"],
  },
  airlineRules: {
    requiredHeaders: [
      "Rule ID", "Airline ID", "Fare", "Bag Type", "Length cm", "Width cm", "Depth cm", "Weight kg",
      "Linear Size cm", "Source Reference", "Last Checked", "Review Status", "Publish", "Sizing Method",
      "Limit Operator",
    ],
    optionalHeaders: [
      "Wheels Included", "Handles Included", "Fits Under Seat", "Soft Bag Guidance", "Rule Wording", "Notes",
    ],
  },
  navigation: {
    requiredHeaders: ["Link ID", "Label", "URL", "Display Order", "Open in New Tab", "Active", "Publish"],
    optionalHeaders: ["Notes"],
  },
  seoPages: {
    requiredHeaders: [
      "SEO ID", "Page Type", "Parent ID", "Slug", "Page Title", "Meta Title", "Meta Description", "H1",
      "Canonical URL", "Active", "Review Status", "Publish",
    ],
    optionalHeaders: ["Intro Copy", "Search Terms", "Last Reviewed", "Notes"],
  },
  specialBaggageAll: {
    requiredHeaders: [
      "Item ID", "Item Rank", "Category", "Item Name", "Handling Classification", "Special Handling Guidance",
      "Advance Notification Usually Required", "Special Packaging Usually Required",
      "Battery or Dangerous Goods Consideration", "Mobility or Medical Equipment", "Airline-Level Validation Required",
      "Result Category", "Review Status", "Publish",
    ],
    optionalHeaders: ["Item Subtype", "Typical Shape", "Last Reviewed", "Notes"],
  },
  specialBaggageResults: {
    requiredHeaders: [
      "Result ID", "Result Rank", "Result Category", "Linked Item IDs", "Result Title", "Result Summary",
      "Preparation Guidance", "Fee Guidance", "Policy Link Label", "Policy Link Source", "Mobility or Medical Result",
      "Review Status", "Publish",
    ],
    optionalHeaders: ["Notes"],
  },
  countries: {
    requiredHeaders: ["Country_ID", "Country_Name", "Country_Slug", "ISO2_Code", "ISO3_Code", "Region", "Subregion"],
    optionalHeaders: ["Flag_Code", "Search_Terms", "Page_Title", "Meta_Title", "Meta_Description", "Intro_Text"],
  },
  countryFacts: {
    requiredHeaders: ["Country_ID"],
    optionalHeaders: [
      "Power_Title", "Connectivity_Title", "Money_Title", "Entry_Title", "Weather_Title", "Language_Title",
      "Driving_Title", "Time_Title", "Insurance_Title",
    ],
  },
  redirects: {
    requiredHeaders: ["Redirect ID", "Old Path", "New Path", "Redirect Type", "Reason", "Active", "Review Status"],
    optionalHeaders: ["Last Reviewed", "Notes"],
  },
  productGroups: {
    requiredHeaders: [
      "productGroupId", "name", "description", "parentProductGroupId", "sortOrder", "priority", "status",
      "lastReviewedAt", "reviewDueAt",
    ],
  },
  brands: {
    requiredHeaders: ["brandId", "name", "website", "status", "lastReviewedAt", "reviewDueAt"],
  },
  products: {
    requiredHeaders: [
      "productId", "name", "brandId", "productGroupId", "productType", "model", "variant", "shortDescription",
      "longDescription", "heightMm", "widthMm", "depthMm", "weightG", "capacityL", "warrantySummary",
      "safetyComplianceStatus", "primaryImageAssetId", "status", "lastReviewedAt", "reviewDueAt",
    ],
  },
  productCompatibility: {
    requiredHeaders: [
      "compatibilityId", "productId", "marketCode", "contextType", "contextId", "bagType", "fitRuleVersion",
      "productHeightMm", "productWidthMm", "productDepthMm", "limitHeightMm", "limitWidthMm", "limitDepthMm",
      "heightMarginMm", "widthMarginMm", "depthMarginMm", "fitStatus", "confidence", "checkedAt", "status",
    ],
  },
  productAssessments: {
    requiredHeaders: [
      "productId", "assessmentId", "methodId", "methodVersion", "productScore", "confidence", "reviewedAt",
      "reviewDueAt",
    ],
  },
  retailers: {
    requiredHeaders: [
      "retailerId", "name", "retailerType", "marketCode", "website", "marketplaceMode", "deliveryModel",
      "returnsModel", "lastReviewedAt", "reviewDueAt",
    ],
  },
  offers: {
    requiredHeaders: [
      "offerId", "productId", "retailerId", "marketCode", "sellerName", "sellerStatus", "soldByRetailerFlag",
      "fulfilledByRetailerFlag", "url", "currency", "price", "deliveryPrice", "effectivePrice", "stockStatus",
      "lastCheckedAt",
    ],
  },
  priceIntelligence: {
    requiredHeaders: [
      "productId", "priceIntelligenceId", "marketCode", "methodId", "methodVersion", "currentBestPrice",
      "currentBestOfferId", "typicalObservedPrice", "lowestObservedPrice", "highestObservedPrice", "priceScore",
      "priceVerdict", "priceConfidence", "calculatedAt",
    ],
  },
  affiliateRoutes: {
    requiredHeaders: ["affiliateRouteId", "offerId", "marketCode", "destinationUrl", "disclosureRequired", "lastVerifiedAt"],
  },
  recommendations: {
    requiredHeaders: [
      "recommendationId", "marketCode", "contextType", "contextId", "productId", "useCase", "recommendationTier",
      "reasonShort", "reasonLong", "requiredCompatibility", "minimumProductScore", "minimumEvidenceConfidence",
      "recommendationStatus", "reviewDueAt",
    ],
  },
  cards: {
    requiredHeaders: [
      "cardId", "marketCode", "cardType", "entityType", "entityId", "title", "subtitle", "summary", "depth0",
      "depth1", "depth2", "primaryCta", "secondaryCta", "imageAssetId", "disclosureMode", "reviewedAt", "reviewDueAt",
    ],
  },
  cardPlacements: {
    requiredHeaders: [
      "placementId", "cardId", "marketCode", "contextType", "contextId", "trigger", "priority", "maxDisplayCount",
      "validFrom", "validTo", "status",
    ],
  },
  pages: {
    requiredHeaders: [
      "pageId", "pageType", "slug", "entityType", "entityId", "title", "heroTitle", "heroSummary", "metaTitle",
      "metaDescription", "canonicalUrl", "structuredDataType", "publicationState", "lastReviewedAt", "reviewDueAt",
    ],
  },
  pageSections: {
    requiredHeaders: [
      "pageSectionId", "pageId", "marketCode", "sectionType", "heading", "intro", "dataSourceType", "dataSourceId",
      "displayOrder", "maxItems", "requiredFlag", "status",
    ],
  },
  methodology: {
    requiredHeaders: [
      "methodId", "methodVersion", "methodType", "marketCode", "title", "description", "minimumEvidenceRule",
      "effectiveFrom", "effectiveTo", "status", "reviewDueAt",
    ],
  },
});

export function validateRc6Headers(name: Rc6DatasetName, headers: readonly string[]): { valid: boolean; missing: string[] } {
  const schema = RC6_SCHEMA_REGISTRY[name];
  if (!schema) return { valid: true, missing: [] };
  const present = new Set(headers.map((header) => header.trim()));
  const missing = schema.requiredHeaders.filter((header) => !present.has(header));
  return { valid: missing.length === 0, missing };
}
