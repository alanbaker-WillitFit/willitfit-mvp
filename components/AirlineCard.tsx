import Link from "next/link";
import { Airline } from "@/types";
import { airlineHasBagType } from "@/lib/dimensions";

function dimensions(airline: Airline, bagType: "cabinBag" | "personalItem"): string {
  if (!airlineHasBagType(airline, bagType)) return "Unavailable";
  const value = airline[bagType];
  return `${value.heightCm}×${value.widthCm}×${value.depthCm} cm`;
}

export default function AirlineCard({ airline }: { airline: Airline }) {
  return (
    <Link href={`/${airline.slug}`} className="wf-card wf-allowance-card group p-5 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <h3 className="wf-airline-name font-heading text-base font-semibold group-hover:text-green-600">
          {airline.airlineName}
        </h3>
        <span className="font-body text-xs text-navy-300">{airline.country}</span>
      </div>
      <dl className="mt-3 space-y-1 font-mono text-sm text-navy-500">
        <div><dt className="inline text-navy-300">Cabin: </dt><dd className="inline">{dimensions(airline, "cabinBag")}</dd></div>
        <div><dt className="inline text-navy-300">Personal item: </dt><dd className="inline">{dimensions(airline, "personalItem")}</dd></div>
      </dl>
      {airline.weightLimitKg && airlineHasBagType(airline, "cabinBag") && (
        <p className="mt-2 font-body text-xs text-navy-300">Weight limit: {airline.weightLimitKg} kg</p>
      )}
    </Link>
  );
}
