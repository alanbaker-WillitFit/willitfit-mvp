import Link from "next/link";
import { Airline } from "@/types";

export default function AirlineCard({ airline }: { airline: Airline }) {
  return (
    <Link
      href={`/airlines/${airline.slug}`}
      className="group flex flex-col rounded-card border border-navy-100 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-liftedh"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base font-semibold text-navy-700 group-hover:text-green-600">
          {airline.airlineName}
        </h3>
        <span className="font-body text-xs text-navy-300">{airline.country}</span>
      </div>
      <dl className="mt-3 space-y-1 font-mono text-sm text-navy-500">
        <div>
          <dt className="inline text-navy-300">Cabin: </dt>
          <dd className="inline">
            {airline.cabinBag.heightCm}×{airline.cabinBag.widthCm}×{airline.cabinBag.depthCm} cm
          </dd>
        </div>
        <div>
          <dt className="inline text-navy-300">Personal item: </dt>
          <dd className="inline">
            {airline.personalItem.heightCm}×{airline.personalItem.widthCm}×{airline.personalItem.depthCm} cm
          </dd>
        </div>
      </dl>
      {airline.weightLimitKg && (
        <p className="mt-2 font-body text-xs text-navy-300">Weight limit: {airline.weightLimitKg} kg</p>
      )}
    </Link>
  );
}
