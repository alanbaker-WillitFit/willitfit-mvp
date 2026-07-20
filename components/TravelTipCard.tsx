import Link from "next/link";
import { TravelTip } from "@/types";

export default function TravelTipCard({ tip }: { tip: TravelTip }) {
  return (
    <Link
      href={`/tips/${tip.slug}`}
      className="wf-card wf-card--compact group p-5"
    >
      <span className="font-body text-xs font-semibold uppercase tracking-wide text-green-700">
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
