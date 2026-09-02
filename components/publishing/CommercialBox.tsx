import Link from "next/link";
import type { CommercialPlacementV1 } from "@/lib/publishing/contracts";

export type CommercialCreativeV1 = {
  creativeId: string;
  title: string;
  summary?: string;
  ctaLabel?: string;
  destinationUrl?: string;
  imageUrl?: string;
};

type CommercialBoxProps = {
  placement?: CommercialPlacementV1 | null;
  creative?: CommercialCreativeV1 | null;
};

function isCurrentlyActive(placement: CommercialPlacementV1): boolean {
  if (!placement.active) return false;
  const now = Date.now();
  if (placement.validFrom) {
    const from = Date.parse(placement.validFrom);
    if (Number.isFinite(from) && now < from) return false;
  }
  if (placement.validTo) {
    const to = Date.parse(placement.validTo);
    if (Number.isFinite(to) && now > to) return false;
  }
  return true;
}

export default function CommercialBox({ placement, creative }: CommercialBoxProps) {
  if (!placement || !creative || !isCurrentlyActive(placement)) return null;

  const destinationUrl = placement.destinationUrl || creative.destinationUrl;
  if (!destinationUrl) return null;

  return (
    <aside
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      aria-label={placement.sponsoredLabelRequired ? "Sponsored" : "Commercial information"}
    >
      {placement.sponsoredLabelRequired && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-navy-500">Sponsored</p>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {creative.imageUrl && (
          <div
            className="h-24 w-full shrink-0 rounded-lg bg-slate-100 bg-cover bg-center sm:w-32"
            style={{ backgroundImage: `url(${JSON.stringify(creative.imageUrl).slice(1, -1)})` }}
            aria-hidden="true"
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-lg font-semibold text-navy-800">{creative.title}</h3>
          {creative.summary && <p className="mt-1 text-sm leading-6 text-navy-600">{creative.summary}</p>}
        </div>
        {creative.ctaLabel && (
          <Link
            href={destinationUrl}
            rel="sponsored noopener noreferrer"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-navy-800 px-4 py-2.5 font-semibold text-white hover:bg-navy-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {creative.ctaLabel}
            <span className="ml-2" aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
