import Rc6CommercialActionPanel from "./Rc6CommercialActionPanel";
import {
  rc6CardsForContext,
  rc6EligibleOffersForProduct,
  type Rc6CommercialCatalogue,
  type Rc6CommercialPage,
} from "@/services/rc6/commercial";

type Row = Readonly<Record<string, string>>;

type Props = {
  catalogue: Rc6CommercialCatalogue;
  resolvedPage: Rc6CommercialPage;
};

function normalized(value: string | undefined): string {
  return (value ?? "").trim();
}

function upper(value: string | undefined): string {
  return normalized(value).toUpperCase();
}

function ProductFacts({ product }: { product: Row }) {
  const dimensions = [product.heightMm, product.widthMm, product.depthMm].filter(Boolean).join(" × ");
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-heading text-lg font-semibold text-navy-700">{product.name}</h3>
      {product.shortDescription ? <p className="mt-2 text-sm leading-6 text-slate-600">{product.shortDescription}</p> : null}
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        {dimensions ? <div><dt className="text-slate-500">Dimensions</dt><dd className="font-medium text-navy-700">{dimensions} mm</dd></div> : null}
        {product.weightG ? <div><dt className="text-slate-500">Weight</dt><dd className="font-medium text-navy-700">{product.weightG} g</dd></div> : null}
        {product.capacityL && product.capacityL !== "0" ? <div><dt className="text-slate-500">Capacity</dt><dd className="font-medium text-navy-700">{product.capacityL} L</dd></div> : null}
        {product.warrantySummary ? <div><dt className="text-slate-500">Warranty</dt><dd className="font-medium text-navy-700">{product.warrantySummary}</dd></div> : null}
      </dl>
    </div>
  );
}

function OfferList({ catalogue, productId, marketCode }: { catalogue: Rc6CommercialCatalogue; productId: string; marketCode: string }) {
  const offers = rc6EligibleOffersForProduct(catalogue, productId, marketCode);
  return (
    <div className="space-y-3">
      {offers.map(({ offer, retailer, affiliateRoute }) => (
        <div key={normalized(offer.offerId)} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-navy-700">{retailer.name}</p>
            <p className="mt-1 text-sm text-slate-600">{offer.currency} {offer.effectivePrice} · {offer.stockStatus}</p>
          </div>
          <a
            href={normalized(affiliateRoute.destinationUrl)}
            target="_blank"
            rel="sponsored nofollow noopener noreferrer"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-navy-700 px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-slate-50"
          >
            View synthetic offer
          </a>
        </div>
      ))}
    </div>
  );
}

function Methodology({ method }: { method: Row }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <h3 className="font-heading text-lg font-semibold text-navy-700">{method.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{method.description}</p>
      {method.minimumEvidenceRule ? <p className="mt-3 text-xs text-slate-500">Evidence rule: {method.minimumEvidenceRule}</p> : null}
    </div>
  );
}

export default function Rc6CommercialPageRenderer({ catalogue, resolvedPage }: Props) {
  const { page, sections } = resolvedPage;

  return (
    <article className="wf-container wf-container--narrow wf-section">
      <header className="rounded-3xl bg-slate-50 px-6 py-8 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">RC6 commercial preview · test data</p>
        <h1 className="mt-3 font-heading text-3xl font-semibold text-navy-700 sm:text-4xl">{page.heroTitle || page.title}</h1>
        {page.heroSummary ? <p className="mt-4 max-w-3xl text-base leading-7 text-navy-600">{page.heroSummary}</p> : null}
      </header>

      <div className="mt-8 space-y-10">
        {sections.map(({ section, items }) => {
          const sectionType = upper(section.sectionType);
          const marketCode = normalized(section.marketCode) || "GB";
          const sectionId = normalized(section.pageSectionId);

          if (sectionType === "HERO") return null;

          return (
            <section key={sectionId} aria-labelledby={`${sectionId}-heading`}>
              {section.heading ? <h2 id={`${sectionId}-heading`} className="font-heading text-2xl font-semibold text-navy-700">{section.heading}</h2> : null}
              {section.intro ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{section.intro}</p> : null}

              <div className="mt-5">
                {sectionType === "PRODUCT_FACTS" ? items.map((item) => <ProductFacts key={normalized(item.productId)} product={item} />) : null}

                {sectionType === "OFFER_LIST" ? (
                  <OfferList catalogue={catalogue} productId={normalized(section.dataSourceId)} marketCode={marketCode} />
                ) : null}

                {sectionType === "METHODOLOGY" ? items.map((item) => <Methodology key={`${normalized(item.methodId)}-${normalized(item.methodVersion)}`} method={item} />) : null}

                {sectionType === "PRODUCT_GROUP_GRID" ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                      <div key={normalized(item.productGroupId)} className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h3 className="font-heading font-semibold text-navy-700">{item.name}</h3>
                        {item.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p> : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {sectionType === "RECOMMENDATION_GRID" ? (
                  <div className="grid gap-5 lg:grid-cols-2">
                    {items.flatMap((recommendation) =>
                      rc6CardsForContext(
                        catalogue,
                        normalized(recommendation.contextType),
                        normalized(recommendation.contextId),
                        marketCode,
                      )
                        .filter((entry) => normalized(entry.product?.productId) === normalized(recommendation.productId))
                        .map((entry) => (
                          <Rc6CommercialActionPanel
                            key={`${normalized(recommendation.recommendationId)}-${normalized(entry.card.cardId)}`}
                            entry={entry}
                          />
                        )),
                    )}
                  </div>
                ) : null}

                {sectionType === "CARD_GRID" ? (
                  <div className="grid gap-5 lg:grid-cols-2">
                    {items.flatMap((item) => {
                      const productId = upper(item.entityType) === "PRODUCT" ? normalized(item.entityId) : "";
                      if (!productId) return [];
                      const eligibleOffers = rc6EligibleOffersForProduct(catalogue, productId, marketCode);
                      const product = catalogue.products.find((row) => normalized(row.productId) === productId) ?? null;
                      const placement = catalogue.cardPlacements.find((row) => normalized(row.cardId) === normalized(item.cardId));
                      if (!product || !placement || eligibleOffers.length === 0) return [];
                      return [
                        <Rc6CommercialActionPanel
                          key={normalized(item.cardId)}
                          entry={{ card: item, placement, product, eligibleOffers }}
                        />,
                      ];
                    })}
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </article>
  );
}
