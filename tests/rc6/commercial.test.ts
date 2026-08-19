import { describe, expect, it } from "vitest";
import {
  buildRc6CommercialCatalogue,
  rc6CardsForContext,
  rc6CommercialPageBySlug,
  rc6CurrentPriceIntelligenceForProduct,
  rc6EligibleOffersForProduct,
  rc6RecommendationsForContext,
  type Rc6CommercialRows,
} from "@/services/rc6/commercial";

type Row = Record<string, string>;

const NOW = new Date("2026-08-19T17:30:00Z");
const FRESH = "2026-08-19T16:00:00Z";

const group = (id = "PG05", overrides: Partial<Row> = {}): Row => ({ productGroupId: id, name: id, status: "ACTIVE", ...overrides });
const brand = (id = "TEST-BRAND", overrides: Partial<Row> = {}): Row => ({ brandId: id, name: id, status: "ACTIVE", ...overrides });
const product = (id = "TEST-PROD", overrides: Partial<Row> = {}): Row => ({
  productId: id,
  name: id,
  brandId: "TEST-BRAND",
  productGroupId: "PG05",
  status: "ACTIVE",
  ...overrides,
});
const retailer = (id = "TEST-RET", overrides: Partial<Row> = {}): Row => ({ retailerId: id, name: id, marketCode: "GB", ...overrides });
const offer = (id = "TEST-OFFER", overrides: Partial<Row> = {}): Row => ({
  offerId: id,
  productId: "TEST-PROD",
  retailerId: "TEST-RET",
  marketCode: "GB",
  effectivePrice: "24.99",
  stockStatus: "IN_STOCK",
  lastCheckedAt: FRESH,
  ...overrides,
});
const route = (id = "TEST-AFF", overrides: Partial<Row> = {}): Row => ({
  affiliateRouteId: id,
  offerId: "TEST-OFFER",
  marketCode: "GB",
  destinationUrl: "https://example.com/test",
  lastVerifiedAt: FRESH,
  ...overrides,
});
const recommendation = (id = "TEST-REC", overrides: Partial<Row> = {}): Row => ({
  recommendationId: id,
  marketCode: "GB",
  contextType: "TRAVEL_ESSENTIALS",
  contextId: "PG05",
  productId: "TEST-PROD",
  recommendationTier: "PRIMARY",
  recommendationStatus: "ACTIVE",
  ...overrides,
});
const compatibility = (id = "TEST-COMP", overrides: Partial<Row> = {}): Row => ({
  compatibilityId: id,
  productId: "TEST-PROD",
  marketCode: "GB",
  fitStatus: "PASS",
  status: "ACTIVE",
  ...overrides,
});
const method = (id = "TEST-METHOD", overrides: Partial<Row> = {}): Row => ({ methodId: id, methodVersion: "1.0", status: "ACTIVE", ...overrides });
const assessment = (id = "TEST-ASSESS", overrides: Partial<Row> = {}): Row => ({
  productId: "TEST-PROD",
  assessmentId: id,
  methodId: "TEST-METHOD",
  methodVersion: "1.0",
  productScore: "82",
  confidence: "HIGH",
  ...overrides,
});
const priceIntelligence = (id = "TEST-PRICE", overrides: Partial<Row> = {}): Row => ({
  productId: "TEST-PROD",
  priceIntelligenceId: id,
  marketCode: "GB",
  methodId: "TEST-METHOD",
  methodVersion: "1.0",
  currentBestOfferId: "TEST-OFFER",
  currentBestPrice: "24.99",
  calculatedAt: FRESH,
  ...overrides,
});
const card = (id = "TEST-CARD", overrides: Partial<Row> = {}): Row => ({
  cardId: id,
  marketCode: "GB",
  cardType: "ACTION_PANEL",
  entityType: "PRODUCT",
  entityId: "TEST-PROD",
  title: id,
  ...overrides,
});
const placement = (id = "TEST-PLACE", overrides: Partial<Row> = {}): Row => ({
  placementId: id,
  cardId: "TEST-CARD",
  marketCode: "GB",
  contextType: "TRAVEL_ESSENTIALS",
  contextId: "PG05",
  priority: "1",
  maxDisplayCount: "5",
  validFrom: "2026-08-01T00:00:00Z",
  validTo: "2026-09-01T00:00:00Z",
  status: "ACTIVE",
  ...overrides,
});
const page = (id = "TEST-PAGE", overrides: Partial<Row> = {}): Row => ({
  pageId: id,
  pageType: "PRODUCT_GROUP",
  slug: "test/packing-cubes",
  entityType: "PRODUCT_GROUP",
  entityId: "PG05",
  publicationState: "PUBLISHED_TEST",
  ...overrides,
});
const section = (id: string, overrides: Partial<Row> = {}): Row => ({
  pageSectionId: id,
  pageId: "TEST-PAGE",
  marketCode: "GB",
  sectionType: "RECOMMENDATION_GRID",
  dataSourceType: "RECOMMENDATION_CONTEXT",
  dataSourceId: "PG05",
  displayOrder: "1",
  maxItems: "5",
  requiredFlag: "TRUE",
  status: "ACTIVE",
  ...overrides,
});

function rows(overrides: Partial<Rc6CommercialRows> = {}): Rc6CommercialRows {
  return {
    productGroups: [group()],
    brands: [brand()],
    products: [product()],
    productCompatibility: [],
    productAssessments: [],
    retailers: [retailer()],
    offers: [offer()],
    priceIntelligence: [],
    affiliateRoutes: [route()],
    recommendations: [recommendation()],
    cards: [card()],
    cardPlacements: [placement()],
    pages: [page()],
    pageSections: [section("TEST-SEC")],
    methodology: [],
    ...overrides,
  };
}

describe("RC6 commercial catalogue", () => {
  it("builds a relationship-valid active catalogue", () => {
    const catalogue = buildRc6CommercialCatalogue(rows());
    expect(catalogue).not.toBeNull();
    expect(catalogue?.products.map((entry) => entry.productId)).toEqual(["TEST-PROD"]);
  });

  it("filters HELD products, recommendations and pages before serving", () => {
    const catalogue = buildRc6CommercialCatalogue(rows({
      products: [product(), product("TEST-HELD", { status: "HELD" })],
      recommendations: [recommendation(), recommendation("TEST-REC-HELD", { productId: "TEST-HELD", recommendationStatus: "HELD" })],
      pages: [page(), page("TEST-PAGE-HELD", { slug: "test/held", publicationState: "HELD" })],
    }));
    expect(catalogue?.products).toHaveLength(1);
    expect(catalogue?.recommendations).toHaveLength(1);
    expect(catalogue?.pages).toHaveLength(1);
  });

  it("fails closed on an orphan active product relationship", () => {
    expect(buildRc6CommercialCatalogue(rows({ products: [product("TEST-PROD", { productGroupId: "MISSING" })] }))).toBeNull();
  });

  it("fails closed on duplicate dataset primary keys", () => {
    expect(buildRc6CommercialCatalogue(rows({ offers: [offer(), offer()] }))).toBeNull();
  });

  it("requires an in-stock offer and matching affiliate route before producing a CTA", () => {
    const catalogue = buildRc6CommercialCatalogue(rows({
      offers: [
        offer("TEST-OFFER", { effectivePrice: "24.99" }),
        offer("TEST-OFFER-NO-ROUTE", { effectivePrice: "19.99" }),
        offer("TEST-OFFER-OOS", { effectivePrice: "9.99", stockStatus: "OUT_OF_STOCK" }),
      ],
    }))!;
    expect(rc6EligibleOffersForProduct(catalogue, "TEST-PROD", "GB", NOW).map((entry) => entry.offer.offerId)).toEqual(["TEST-OFFER"]);
  });

  it("sorts eligible routed offers by effective price, not nominal price", () => {
    const catalogue = buildRc6CommercialCatalogue(rows({
      offers: [offer("TEST-OFFER", { effectivePrice: "24.99" }), offer("TEST-OFFER-2", { effectivePrice: "21.50" })],
      affiliateRoutes: [route(), route("TEST-AFF-2", { offerId: "TEST-OFFER-2" })],
    }))!;
    expect(rc6EligibleOffersForProduct(catalogue, "TEST-PROD", "GB", NOW).map((entry) => entry.offer.offerId)).toEqual(["TEST-OFFER-2", "TEST-OFFER"]);
  });

  it("allows an offer exactly at the 48-hour hard-stale boundary and rejects it beyond the boundary", () => {
    const boundary = buildRc6CommercialCatalogue(rows({ offers: [offer("TEST-OFFER", { lastCheckedAt: "2026-08-17T17:30:00Z" })] }))!;
    const stale = buildRc6CommercialCatalogue(rows({ offers: [offer("TEST-OFFER", { lastCheckedAt: "2026-08-17T17:29:59Z" })] }))!;
    expect(rc6EligibleOffersForProduct(boundary, "TEST-PROD", "GB", NOW)).toHaveLength(1);
    expect(rc6EligibleOffersForProduct(stale, "TEST-PROD", "GB", NOW)).toEqual([]);
  });

  it("rejects an affiliate route beyond its seven-day hard-stale limit", () => {
    const catalogue = buildRc6CommercialCatalogue(rows({ affiliateRoutes: [route("TEST-AFF", { lastVerifiedAt: "2026-08-12T17:29:59Z" })] }))!;
    expect(rc6EligibleOffersForProduct(catalogue, "TEST-PROD", "GB", NOW)).toEqual([]);
  });

  it("fails an actionable offer closed when freshness timestamps are malformed", () => {
    const catalogue = buildRc6CommercialCatalogue(rows({ offers: [offer("TEST-OFFER", { lastCheckedAt: "not-a-date" })] }))!;
    expect(rc6EligibleOffersForProduct(catalogue, "TEST-PROD", "GB", NOW)).toEqual([]);
  });

  it("enforces Product Score and evidence confidence from the recommendation row", () => {
    const catalogue = buildRc6CommercialCatalogue(rows({
      methodology: [method()],
      productAssessments: [assessment()],
      recommendations: [recommendation("TEST-REC", { minimumProductScore: "80", minimumEvidenceConfidence: "MEDIUM" })],
    }))!;
    expect(rc6RecommendationsForContext(catalogue, "TRAVEL_ESSENTIALS", "PG05", "GB", NOW)).toHaveLength(1);

    const lowScore = buildRc6CommercialCatalogue(rows({
      methodology: [method()],
      productAssessments: [assessment("TEST-ASSESS", { productScore: "79" })],
      recommendations: [recommendation("TEST-REC", { minimumProductScore: "80", minimumEvidenceConfidence: "MEDIUM" })],
    }))!;
    expect(rc6RecommendationsForContext(lowScore, "TRAVEL_ESSENTIALS", "PG05", "GB", NOW)).toEqual([]);

    const lowConfidence = buildRc6CommercialCatalogue(rows({
      methodology: [method()],
      productAssessments: [assessment("TEST-ASSESS", { confidence: "LOW" })],
      recommendations: [recommendation("TEST-REC", { minimumProductScore: "80", minimumEvidenceConfidence: "MEDIUM" })],
    }))!;
    expect(rc6RecommendationsForContext(lowConfidence, "TRAVEL_ESSENTIALS", "PG05", "GB", NOW)).toEqual([]);
  });

  it("enforces required compatibility and its evidence confidence, while permitting NOT_APPLICABLE", () => {
    const required = buildRc6CommercialCatalogue(rows({
      productCompatibility: [compatibility("TEST-COMP", { confidence: "MEDIUM" })],
      methodology: [method()],
      productAssessments: [assessment("TEST-ASSESS", { confidence: "MEDIUM" })],
      recommendations: [recommendation("TEST-REC", { requiredCompatibility: "PASS", minimumEvidenceConfidence: "MEDIUM" })],
    }))!;
    const weakCompatibility = buildRc6CommercialCatalogue(rows({
      productCompatibility: [compatibility("TEST-COMP", { confidence: "LOW" })],
      methodology: [method()],
      productAssessments: [assessment("TEST-ASSESS", { confidence: "MEDIUM" })],
      recommendations: [recommendation("TEST-REC", { requiredCompatibility: "PASS", minimumEvidenceConfidence: "MEDIUM" })],
    }))!;
    const notApplicable = buildRc6CommercialCatalogue(rows({ recommendations: [recommendation("TEST-REC", { requiredCompatibility: "NOT_APPLICABLE" })] }))!;
    expect(rc6RecommendationsForContext(required, "TRAVEL_ESSENTIALS", "PG05", "GB", NOW)).toHaveLength(1);
    expect(rc6RecommendationsForContext(weakCompatibility, "TRAVEL_ESSENTIALS", "PG05", "GB", NOW)).toEqual([]);
    expect(rc6RecommendationsForContext(notApplicable, "TRAVEL_ESSENTIALS", "PG05", "GB", NOW)).toHaveLength(1);
  });

  it("returns price intelligence only while fresh and tied to an eligible routed offer", () => {
    const catalogue = buildRc6CommercialCatalogue(rows({ methodology: [method()], priceIntelligence: [priceIntelligence()] }))!;
    const stale = buildRc6CommercialCatalogue(rows({
      methodology: [method()],
      priceIntelligence: [priceIntelligence("TEST-PRICE", { calculatedAt: "2026-08-16T17:29:59Z" })],
    }))!;
    expect(rc6CurrentPriceIntelligenceForProduct(catalogue, "TEST-PROD", "GB", NOW)?.priceIntelligenceId).toBe("TEST-PRICE");
    expect(rc6CurrentPriceIntelligenceForProduct(stale, "TEST-PROD", "GB", NOW)).toBeNull();
  });

  it("suppresses recommendations when the product has no eligible affiliate offer", () => {
    const catalogue = buildRc6CommercialCatalogue(rows({ affiliateRoutes: [] }))!;
    expect(rc6RecommendationsForContext(catalogue, "TRAVEL_ESSENTIALS", "PG05", "GB", NOW)).toEqual([]);
  });

  it("suppresses product Action Panels when no eligible affiliate offer exists", () => {
    const catalogue = buildRc6CommercialCatalogue(rows({ affiliateRoutes: [] }))!;
    expect(rc6CardsForContext(catalogue, "TRAVEL_ESSENTIALS", "PG05", "GB", NOW)).toEqual([]);
  });

  it("suppresses placements outside their governed validity window", () => {
    const future = buildRc6CommercialCatalogue(rows({ cardPlacements: [placement("TEST-PLACE", { validFrom: "2026-08-20T00:00:00Z" })] }))!;
    const expired = buildRc6CommercialCatalogue(rows({ cardPlacements: [placement("TEST-PLACE", { validTo: "2026-08-19T17:29:59Z" })] }))!;
    expect(rc6CardsForContext(future, "TRAVEL_ESSENTIALS", "PG05", "GB", NOW)).toEqual([]);
    expect(rc6CardsForContext(expired, "TRAVEL_ESSENTIALS", "PG05", "GB", NOW)).toEqual([]);
  });

  it("enforces the strictest governed maxDisplayCount for a context", () => {
    const catalogue = buildRc6CommercialCatalogue(rows({
      products: [product(), product("TEST-PROD-2")],
      offers: [offer(), offer("TEST-OFFER-2", { productId: "TEST-PROD-2" })],
      affiliateRoutes: [route(), route("TEST-AFF-2", { offerId: "TEST-OFFER-2" })],
      cards: [card(), card("TEST-CARD-2", { entityId: "TEST-PROD-2" })],
      cardPlacements: [
        placement("TEST-PLACE", { maxDisplayCount: "1" }),
        placement("TEST-PLACE-2", { cardId: "TEST-CARD-2", priority: "2", maxDisplayCount: "5" }),
      ],
    }))!;
    expect(rc6CardsForContext(catalogue, "TRAVEL_ESSENTIALS", "PG05", "GB", NOW).map((entry) => entry.card.cardId)).toEqual(["TEST-CARD"]);
  });

  it("fails a published page closed when a required data section resolves empty", () => {
    const catalogue = buildRc6CommercialCatalogue(rows({ affiliateRoutes: [] }))!;
    expect(rc6CommercialPageBySlug(catalogue, "/test/packing-cubes/", NOW)).toBeNull();
  });

  it("resolves a published page when its required recommendation section has eligible content", () => {
    const catalogue = buildRc6CommercialCatalogue(rows())!;
    const resolved = rc6CommercialPageBySlug(catalogue, "test/packing-cubes", NOW);
    expect(resolved?.page.pageId).toBe("TEST-PAGE");
    expect(resolved?.sections[0]?.items.map((item) => item.recommendationId)).toEqual(["TEST-REC"]);
  });

  it("sorts recommendation tier deterministically and enforces section maxItems", () => {
    const catalogue = buildRc6CommercialCatalogue(rows({
      products: [product(), product("TEST-PROD-2")],
      offers: [offer(), offer("TEST-OFFER-2", { productId: "TEST-PROD-2" })],
      affiliateRoutes: [route(), route("TEST-AFF-2", { offerId: "TEST-OFFER-2" })],
      recommendations: [
        recommendation("TEST-REC-SECONDARY", { recommendationTier: "SECONDARY" }),
        recommendation("TEST-REC-PRIMARY", { productId: "TEST-PROD-2", recommendationTier: "PRIMARY" }),
      ],
      pageSections: [section("TEST-SEC", { maxItems: "1" })],
    }))!;
    const resolved = rc6CommercialPageBySlug(catalogue, "test/packing-cubes", NOW);
    expect(resolved?.sections[0]?.items.map((item) => item.recommendationId)).toEqual(["TEST-REC-PRIMARY"]);
  });

  it("aggregates page-level card contexts across child product-group placements", () => {
    const catalogue = buildRc6CommercialCatalogue(rows({
      productGroups: [group("PG05"), group("PG06")],
      products: [product(), product("TEST-PROD-2", { productGroupId: "PG06" })],
      offers: [offer(), offer("TEST-OFFER-2", { productId: "TEST-PROD-2" })],
      affiliateRoutes: [route(), route("TEST-AFF-2", { offerId: "TEST-OFFER-2" })],
      cards: [card(), card("TEST-CARD-2", { entityId: "TEST-PROD-2" })],
      cardPlacements: [placement(), placement("TEST-PLACE-2", { cardId: "TEST-CARD-2", contextId: "PG06" })],
      pageSections: [section("TEST-CARD-SEC", { sectionType: "CARD_GRID", dataSourceType: "CARD_CONTEXT", dataSourceId: "TRAVEL_ESSENTIALS" })],
    }))!;
    const resolved = rc6CommercialPageBySlug(catalogue, "test/packing-cubes", NOW);
    expect(resolved?.sections[0]?.items.map((item) => item.cardId).sort()).toEqual(["TEST-CARD", "TEST-CARD-2"]);
  });
});
