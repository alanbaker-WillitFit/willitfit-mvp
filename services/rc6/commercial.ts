import { readRc6Dataset, type Rc6TabReader } from "./runtimeReader";
import type { Rc6DatasetName } from "./runtimeContract";

type Row = Readonly<Record<string, string>>;

export type Rc6CommercialRows = Readonly<{
  productGroups: readonly Row[];
  brands: readonly Row[];
  products: readonly Row[];
  productCompatibility: readonly Row[];
  productAssessments: readonly Row[];
  retailers: readonly Row[];
  offers: readonly Row[];
  priceIntelligence: readonly Row[];
  affiliateRoutes: readonly Row[];
  recommendations: readonly Row[];
  cards: readonly Row[];
  cardPlacements: readonly Row[];
  pages: readonly Row[];
  pageSections: readonly Row[];
  methodology: readonly Row[];
}>;

export type Rc6CommercialCatalogue = Rc6CommercialRows;

export type Rc6EligibleOffer = Readonly<{
  offer: Row;
  retailer: Row;
  affiliateRoute: Row;
}>;

export type Rc6CommercialCard = Readonly<{
  card: Row;
  placement: Row;
  product: Row | null;
  eligibleOffers: readonly Rc6EligibleOffer[];
}>;

export type Rc6CommercialPageSection = Readonly<{
  section: Row;
  items: readonly Row[];
}>;

export type Rc6CommercialPage = Readonly<{
  page: Row;
  sections: readonly Rc6CommercialPageSection[];
}>;

const DATASET_NAMES = [
  "productGroups", "brands", "products", "productCompatibility", "productAssessments", "retailers", "offers",
  "priceIntelligence", "affiliateRoutes", "recommendations", "cards", "cardPlacements", "pages", "pageSections",
  "methodology",
] as const satisfies readonly Rc6DatasetName[];

const KEY_BY_DATASET: Readonly<Record<(typeof DATASET_NAMES)[number], string>> = Object.freeze({
  productGroups: "productGroupId",
  brands: "brandId",
  products: "productId",
  productCompatibility: "compatibilityId",
  productAssessments: "assessmentId",
  retailers: "retailerId",
  offers: "offerId",
  priceIntelligence: "priceIntelligenceId",
  affiliateRoutes: "affiliateRouteId",
  recommendations: "recommendationId",
  cards: "cardId",
  cardPlacements: "placementId",
  pages: "pageId",
  pageSections: "pageSectionId",
  methodology: "methodId",
});

function normalized(value: string | undefined): string {
  return (value ?? "").trim();
}

function upper(value: string | undefined): string {
  return normalized(value).toUpperCase();
}

function active(row: Row, key = "status"): boolean {
  return upper(row[key]) === "ACTIVE";
}

function publishedPage(row: Row): boolean {
  return upper(row.publicationState).startsWith("PUBLISHED");
}

function uniqueIds(rows: readonly Row[], key: string): boolean {
  const ids = rows.map((row) => normalized(row[key]));
  return ids.every(Boolean) && new Set(ids).size === ids.length;
}

function indexRows(rows: readonly Row[], key: string): ReadonlyMap<string, Row> {
  return new Map(rows.map((row) => [normalized(row[key]), row]));
}

async function loadRows(name: Rc6DatasetName, reader: Rc6TabReader): Promise<readonly Row[] | null> {
  const result = await readRc6Dataset<Record<string, string>>(name, reader);
  if (result.state === "AUTHORITATIVE_EMPTY") return [];
  if (result.state !== "READY_WITH_ROWS") return null;
  return result.rows;
}

function entityExists(
  entityType: string,
  entityId: string,
  products: ReadonlyMap<string, Row>,
  groups: ReadonlyMap<string, Row>,
): boolean {
  const type = upper(entityType);
  if (type === "PRODUCT") return products.has(entityId);
  if (type === "PRODUCT_GROUP") return groups.has(entityId);
  if (type === "PAGE") return true;
  return true;
}

export function buildRc6CommercialCatalogue(rows: Rc6CommercialRows): Rc6CommercialCatalogue | null {
  for (const name of DATASET_NAMES) {
    if (!uniqueIds(rows[name], KEY_BY_DATASET[name])) return null;
  }

  const productGroups = rows.productGroups.filter((row) => active(row));
  const brands = rows.brands.filter((row) => active(row));
  const products = rows.products.filter((row) => active(row));
  const productCompatibility = rows.productCompatibility.filter((row) => active(row));
  const methodology = rows.methodology.filter((row) => active(row));
  const recommendations = rows.recommendations.filter((row) => upper(row.recommendationStatus) === "ACTIVE");
  const cardPlacements = rows.cardPlacements.filter((row) => active(row));
  const pages = rows.pages.filter(publishedPage);
  const pageSections = rows.pageSections.filter((row) => active(row));

  const groupsById = indexRows(productGroups, "productGroupId");
  const brandsById = indexRows(brands, "brandId");
  const productsById = indexRows(products, "productId");
  const retailersById = indexRows(rows.retailers, "retailerId");
  const offersById = indexRows(rows.offers, "offerId");
  const methodsById = indexRows(methodology, "methodId");
  const cardsById = indexRows(rows.cards, "cardId");
  const pagesById = indexRows(pages, "pageId");

  if (products.some((row) => !groupsById.has(normalized(row.productGroupId)))) return null;
  if (products.some((row) => normalized(row.brandId) && !brandsById.has(normalized(row.brandId)))) return null;
  if (productCompatibility.some((row) => !productsById.has(normalized(row.productId)))) return null;
  if (rows.productAssessments.some((row) => !productsById.has(normalized(row.productId)))) return null;
  if (rows.productAssessments.some((row) => !methodsById.has(normalized(row.methodId)))) return null;
  if (rows.offers.some((row) => !productsById.has(normalized(row.productId)))) return null;
  if (rows.offers.some((row) => !retailersById.has(normalized(row.retailerId)))) return null;
  if (rows.priceIntelligence.some((row) => !productsById.has(normalized(row.productId)))) return null;
  if (rows.priceIntelligence.some((row) => normalized(row.methodId) && !methodsById.has(normalized(row.methodId)))) return null;
  if (rows.priceIntelligence.some((row) => normalized(row.currentBestOfferId) && !offersById.has(normalized(row.currentBestOfferId)))) return null;
  if (rows.affiliateRoutes.some((row) => !offersById.has(normalized(row.offerId)))) return null;
  if (recommendations.some((row) => !productsById.has(normalized(row.productId)))) return null;
  if (rows.cards.some((row) => !entityExists(normalized(row.entityType), normalized(row.entityId), productsById, groupsById))) return null;
  if (cardPlacements.some((row) => !cardsById.has(normalized(row.cardId)))) return null;
  if (pages.some((row) => !entityExists(normalized(row.entityType), normalized(row.entityId), productsById, groupsById))) return null;
  if (pageSections.some((row) => !pagesById.has(normalized(row.pageId)))) return null;

  return Object.freeze({
    productGroups,
    brands,
    products,
    productCompatibility,
    productAssessments: rows.productAssessments,
    retailers: rows.retailers,
    offers: rows.offers,
    priceIntelligence: rows.priceIntelligence,
    affiliateRoutes: rows.affiliateRoutes,
    recommendations,
    cards: rows.cards,
    cardPlacements,
    pages,
    pageSections,
    methodology,
  });
}

export async function getRc6CommercialCatalogue(reader: Rc6TabReader): Promise<Rc6CommercialCatalogue | null> {
  const loaded = await Promise.all(DATASET_NAMES.map((name) => loadRows(name, reader)));
  if (loaded.some((rows) => rows === null)) return null;

  const byName = Object.fromEntries(DATASET_NAMES.map((name, index) => [name, loaded[index] ?? []])) as unknown as Rc6CommercialRows;
  return buildRc6CommercialCatalogue(byName);
}

export function rc6EligibleOffersForProduct(
  catalogue: Rc6CommercialCatalogue,
  productId: string,
  marketCode = "GB",
): Rc6EligibleOffer[] {
  const resolvedProductId = normalized(productId);
  const resolvedMarket = upper(marketCode);
  const retailerById = indexRows(catalogue.retailers, "retailerId");
  const routeByOfferId = new Map(
    catalogue.affiliateRoutes
      .filter((route) => upper(route.marketCode) === resolvedMarket)
      .map((route) => [normalized(route.offerId), route]),
  );

  return catalogue.offers
    .filter((offer) => normalized(offer.productId) === resolvedProductId)
    .filter((offer) => upper(offer.marketCode) === resolvedMarket)
    .filter((offer) => upper(offer.stockStatus) === "IN_STOCK")
    .map((offer) => {
      const retailer = retailerById.get(normalized(offer.retailerId));
      const affiliateRoute = routeByOfferId.get(normalized(offer.offerId));
      return retailer && affiliateRoute ? { offer, retailer, affiliateRoute } : null;
    })
    .filter((entry): entry is Rc6EligibleOffer => entry !== null)
    .sort((left, right) => Number(left.offer.effectivePrice || Number.POSITIVE_INFINITY) - Number(right.offer.effectivePrice || Number.POSITIVE_INFINITY));
}

export function rc6RecommendationsForContext(
  catalogue: Rc6CommercialCatalogue,
  contextType: string,
  contextId: string,
  marketCode = "GB",
): Row[] {
  const resolvedType = upper(contextType);
  const resolvedId = normalized(contextId);
  const resolvedMarket = upper(marketCode);

  return catalogue.recommendations
    .filter((row) => upper(row.marketCode) === resolvedMarket)
    .filter((row) => upper(row.contextType) === resolvedType)
    .filter((row) => normalized(row.contextId) === resolvedId)
    .filter((row) => rc6EligibleOffersForProduct(catalogue, normalized(row.productId), resolvedMarket).length > 0);
}

export function rc6CardsForContext(
  catalogue: Rc6CommercialCatalogue,
  contextType: string,
  contextId: string,
  marketCode = "GB",
): Rc6CommercialCard[] {
  const resolvedType = upper(contextType);
  const resolvedId = normalized(contextId);
  const resolvedMarket = upper(marketCode);
  const cardById = indexRows(catalogue.cards, "cardId");
  const productById = indexRows(catalogue.products, "productId");
  const output: Rc6CommercialCard[] = [];

  const placements = catalogue.cardPlacements
    .filter((placement) => upper(placement.marketCode) === resolvedMarket)
    .filter((placement) => upper(placement.contextType) === resolvedType)
    .filter((placement) => normalized(placement.contextId) === resolvedId)
    .sort((a, b) => Number(a.priority || 0) - Number(b.priority || 0));

  for (const placement of placements) {
    const card = cardById.get(normalized(placement.cardId));
    if (!card) continue;
    const product = upper(card.entityType) === "PRODUCT" ? productById.get(normalized(card.entityId)) ?? null : null;
    const eligibleOffers = product
      ? rc6EligibleOffersForProduct(catalogue, normalized(product.productId), resolvedMarket)
      : [];
    if (product && eligibleOffers.length === 0) continue;
    output.push({ card, placement, product, eligibleOffers });
  }

  return output;
}

function cardsForContextType(catalogue: Rc6CommercialCatalogue, contextType: string, marketCode: string): Row[] {
  const ids = new Set(
    catalogue.cardPlacements
      .filter((row) => upper(row.marketCode) === upper(marketCode))
      .filter((row) => upper(row.contextType) === upper(contextType))
      .map((row) => normalized(row.contextId)),
  );
  const cards = Array.from(ids).flatMap((id) => rc6CardsForContext(catalogue, contextType, id, marketCode));
  return Array.from(new Map(cards.map((entry) => [normalized(entry.card.cardId), entry.card])).values());
}

function pageSectionItems(catalogue: Rc6CommercialCatalogue, section: Row): Row[] {
  const sourceType = upper(section.dataSourceType);
  const sourceId = normalized(section.dataSourceId);
  const marketCode = normalized(section.marketCode) || "GB";

  if (sourceType === "PRODUCT") {
    return catalogue.products.filter((row) => normalized(row.productId) === sourceId);
  }
  if (sourceType === "PRODUCT_GROUP") {
    return catalogue.productGroups.filter((row) => normalized(row.productGroupId) === sourceId);
  }
  if (sourceType === "PRODUCT_GROUPS") {
    const ids = new Set(sourceId.split(",").map((id) => normalized(id)).filter(Boolean));
    return catalogue.productGroups.filter((row) => ids.has(normalized(row.productGroupId)));
  }
  if (sourceType === "RECOMMENDATION_CONTEXT") {
    return rc6RecommendationsForContext(catalogue, "TRAVEL_ESSENTIALS", sourceId, marketCode);
  }
  if (sourceType === "PRODUCT_OFFERS") {
    return rc6EligibleOffersForProduct(catalogue, sourceId, marketCode).map((entry) => entry.offer);
  }
  if (sourceType === "METHOD") {
    return catalogue.methodology.filter((row) => normalized(row.methodId) === sourceId);
  }
  if (sourceType === "CARD_CONTEXT") {
    return cardsForContextType(catalogue, sourceId, marketCode);
  }
  return [];
}

export function rc6CommercialPageBySlug(catalogue: Rc6CommercialCatalogue, slug: string): Rc6CommercialPage | null {
  const resolvedSlug = normalized(slug).replace(/^\/+|\/+$/g, "");
  const page = catalogue.pages.find((row) => normalized(row.slug).replace(/^\/+|\/+$/g, "") === resolvedSlug);
  if (!page) return null;

  const sections = catalogue.pageSections
    .filter((row) => normalized(row.pageId) === normalized(page.pageId))
    .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0))
    .map((section) => ({ section, items: pageSectionItems(catalogue, section) }));

  if (sections.some(({ section, items }) => upper(section.requiredFlag) === "TRUE" && items.length === 0 && upper(section.sectionType) !== "HERO")) {
    return null;
  }

  return { page, sections };
}
