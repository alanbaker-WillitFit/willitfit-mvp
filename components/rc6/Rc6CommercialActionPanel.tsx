import type { Rc6CommercialCard } from "@/services/rc6/commercial";

type Props = {
  entry: Rc6CommercialCard;
};

function money(value: string | undefined, currency: string | undefined): string | null {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  const code = (currency ?? "GBP").trim() || "GBP";
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: code }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

export default function Rc6CommercialActionPanel({ entry }: Props) {
  const { card, product, eligibleOffers } = entry;
  const best = eligibleOffers[0] ?? null;
  if (!product || !best) return null;

  const price = money(best.offer.effectivePrice, best.offer.currency);
  const disclosureRequired = String(best.affiliateRoute.disclosureRequired ?? "").trim().toUpperCase() === "TRUE";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Helpful next step</p>
          <h3 className="mt-1 font-heading text-lg font-semibold text-navy-700">{card.title || product.name}</h3>
          {card.subtitle ? <p className="mt-1 text-sm font-medium text-navy-600">{card.subtitle}</p> : null}
        </div>
        {price ? <span className="whitespace-nowrap text-sm font-semibold text-navy-700">{price}</span> : null}
      </div>

      {card.summary ? <p className="mt-3 text-sm leading-6 text-slate-600">{card.summary}</p> : null}

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <dt className="text-slate-500">Retailer</dt>
          <dd className="font-medium text-navy-700">{best.retailer.name}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Availability</dt>
          <dd className="font-medium text-navy-700">{best.offer.stockStatus}</dd>
        </div>
      </dl>

      <a
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2"
        href={best.affiliateRoute.destinationUrl}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
      >
        {card.primaryCta || "View retailer"}
      </a>

      {disclosureRequired ? (
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Affiliate link. WillItFit may receive a commission if you buy through this link. This does not determine which products are recommended.
        </p>
      ) : null}
    </article>
  );
}
