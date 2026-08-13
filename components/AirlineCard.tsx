import Link from "next/link";
import { Airline } from "@/types";
import { airlineHasBagType } from "@/lib/dimensions";

function dimensions(airline: Airline, bagType: "cabinBag" | "personalItem"): string {
  if (!airlineHasBagType(airline, bagType)) return "Not published";
  const value = airline[bagType];
  return `${value.heightCm} × ${value.widthCm} × ${value.depthCm} cm`;
}

export default function AirlineCard({ airline }: { airline: Airline }) {
  return (
    <Link href={`/${airline.slug}`} className="wf-card wf-card--compact group flex h-full flex-col p-5">
      <span className="font-body text-xs font-semibold uppercase tracking-wide text-green-700">
        Airline baggage guide
      </span>

      <div className="mt-2 flex items-start justify-between gap-4">
        <h2 className="font-heading text-lg font-semibold text-navy-700 group-hover:text-green-600">
          {airline.airlineName}
        </h2>
        {airline.country && <span className="font-body text-xs font-semibold text-navy-300">{airline.country}</span>}
      </div>

      <p className="mt-2 font-body text-sm text-navy-500">
        Check the published personal-item and cabin-bag allowances before you travel.
      </p>

      <dl className="mt-4 space-y-3 border-t border-navy-100 pt-4 font-body text-sm text-navy-600">
        <div>
          <dt className="font-semibold text-navy-700">Cabin bag</dt>
          <dd className="mt-1">{dimensions(airline, "cabinBag")}</dd>
        </div>
        <div>
          <dt className="font-semibold text-navy-700">Personal item</dt>
          <dd className="mt-1">{dimensions(airline, "personalItem")}</dd>
        </div>
      </dl>

      {airline.weightLimitKg && airlineHasBagType(airline, "cabinBag") && (
        <p className="mt-3 font-body text-xs text-navy-400">Published cabin weight limit: {airline.weightLimitKg} kg</p>
      )}

      <span className="mt-auto pt-5 font-body text-sm font-semibold text-navy-700 group-hover:text-green-600">
        Click more →
      </span>
    </Link>
  );
}
