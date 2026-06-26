import { AffiliateLink } from "@/types";

export default function AffiliateCard({ link }: { link: AffiliateLink }) {
  return (
    <a
      href={link.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="flex flex-col overflow-hidden rounded-card border border-navy-100 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-liftedh"
    >
      {link.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={link.imageUrl} alt={link.product} className="h-36 w-full object-cover" />
      ) : (
        <div className="h-36 w-full bg-navy-50" />
      )}
      <div className="p-4">
        <span className="font-body text-xs font-semibold uppercase tracking-wide text-navy-300">
          {link.brand}
        </span>
        <h4 className="mt-1 font-heading text-sm font-semibold text-navy-700">{link.product}</h4>
        <span className="mt-2 inline-block font-body text-sm font-semibold text-green-600">
          View product →
        </span>
      </div>
    </a>
  );
}
