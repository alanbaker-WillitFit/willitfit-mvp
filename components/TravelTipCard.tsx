import Link from "next/link";
import { TravelTip } from "@/types";

export default function TravelTipCard({ tip }: { tip: TravelTip }) {
  return (
    <Link
      href={`/tips/${tip.slug}`}
      className="group flex flex-col rounded-card border border-navy-100 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-liftedh"
    >
      <span className="font-body text-xs font-semibold uppercase tracking-wide text-green-600">
        {tip.category}
      </span>
      <h3 className="mt-2 font-heading text-base font-semibold text-navy-700 group-hover:text-green-600">
        {tip.title}
      </h3>
      <p className="mt-2 line-clamp-3 font-body text-sm text-navy-500">{tip.content}</p>
      {tip.cta && (
        <span className="mt-3 font-body text-sm font-semibold text-navy-700">{tip.cta} →</span>
      )}
    </Link>
  );
}
