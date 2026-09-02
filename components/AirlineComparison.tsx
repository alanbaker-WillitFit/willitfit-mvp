"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Airline, BagType, BaggageSizingRule, Dimensions } from "@/types";
import { resolveLimit } from "@/lib/fitCalculator";
import { airlineHasBagType } from "@/lib/dimensions";

function dimensions(value: Dimensions | null | undefined): string {
  return value ? `${value.heightCm} × ${value.widthCm} × ${value.depthCm} cm` : "Not published";
}

function ruleText(rule: BaggageSizingRule | null | undefined, weight: number | null | undefined): string {
  if (!rule) return weight ? `${weight} kg · dimensions not published` : "Not published";
  if (rule.method === "fixed-dimensions") return dimensions(rule.dimensions);
  if (rule.method === "linear-total") return `${rule.operator === "lt" ? "Under" : "At or under"} ${rule.linearLimitCm} cm total`;
  return weight ? `${weight} kg · weight-only rule` : "Weight-only rule";
}

function allowance(airline: Airline, bagType: BagType, fareClass: string | null): string {
  if (!airlineHasBagType(airline, bagType)) return "Not published";
  try {
    const resolved = resolveLimit(airline, bagType, fareClass);
    if (bagType === "checkedBag") return ruleText(resolved.sizingRule, resolved.weightLimitKg);
    if (resolved.sizingRule.method === "fixed-dimensions") {
      const weight = resolved.weightLimitKg ? ` · ${resolved.weightLimitKg} kg` : "";
      return `${dimensions(resolved.sizingRule.dimensions)}${weight}`;
    }
    return ruleText(resolved.sizingRule, resolved.weightLimitKg);
  } catch {
    return "Check booking";
  }
}

function AirlineColumn({ airline, fareClass, setFareClass }: { airline: Airline; fareClass: string | null; setFareClass: (value: string | null) => void }) {
  return (
    <div className="wf-card p-5">
      <h2 className="font-heading text-xl font-bold text-navy-900">{airline.airlineName}</h2>
      <p className="mt-1 text-sm text-navy-500">{[airline.iataCode, airline.country].filter(Boolean).join(" · ")}</p>
      {airline.fareClasses.length > 0 ? (
        <label className="mt-4 block text-sm font-semibold text-navy-700">Fare or option
          <select value={fareClass ?? ""} onChange={(event) => setFareClass(event.target.value || null)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3">
            <option value="">Published baseline</option>
            {airline.fareClasses.map((fare) => <option key={fare.fareClass} value={fare.fareClass}>{fare.fareClass}</option>)}
          </select>
        </label>
      ) : null}
      <dl className="mt-5 space-y-3 text-sm">
        <div><dt className="font-semibold text-navy-900">Personal item</dt><dd className="text-navy-600">{allowance(airline, "personalItem", fareClass)}</dd></div>
        <div><dt className="font-semibold text-navy-900">Cabin bag</dt><dd className="text-navy-600">{allowance(airline, "cabinBag", fareClass)}</dd></div>
        <div><dt className="font-semibold text-navy-900">Checked baggage</dt><dd className="text-navy-600">{allowance(airline, "checkedBag", fareClass)}</dd></div>
      </dl>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/?airline=${airline.slug}#checker`} className="font-semibold text-green-700 underline">Check my bag</Link>
        <Link href={`/${airline.slug}`} className="font-semibold text-blue-700 underline">Full baggage guide</Link>
      </div>
      <p className="mt-4 text-xs text-navy-500">Reviewed: {airline.lastUpdated || "date unavailable"}</p>
    </div>
  );
}

export default function AirlineComparison({ airlines }: { airlines: Airline[] }) {
  const initial = airlines.slice(0, 2);
  const [leftId, setLeftId] = useState(initial[0]?.airlineId ?? "");
  const [rightId, setRightId] = useState(initial[1]?.airlineId ?? initial[0]?.airlineId ?? "");
  const [leftFare, setLeftFare] = useState<string | null>(null);
  const [rightFare, setRightFare] = useState<string | null>(null);
  const byId = useMemo(() => new Map(airlines.map((airline) => [airline.airlineId, airline])), [airlines]);
  const left = byId.get(leftId);
  const right = byId.get(rightId);

  return (
    <section>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-navy-700">First airline<select className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3" value={leftId} onChange={(event) => { setLeftId(event.target.value); setLeftFare(null); }}>{airlines.map((airline) => <option key={airline.airlineId} value={airline.airlineId}>{airline.airlineName}</option>)}</select></label>
        <label className="text-sm font-semibold text-navy-700">Second airline<select className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3" value={rightId} onChange={(event) => { setRightId(event.target.value); setRightFare(null); }}>{airlines.map((airline) => <option key={airline.airlineId} value={airline.airlineId}>{airline.airlineName}</option>)}</select></label>
      </div>
      {left && right ? <div className="mt-6 grid gap-5 lg:grid-cols-2"><AirlineColumn airline={left} fareClass={leftFare} setFareClass={setLeftFare} /><AirlineColumn airline={right} fareClass={rightFare} setFareClass={setRightFare} /></div> : null}
      <p className="mt-6 text-sm text-navy-500">This compares baggage entitlement only, not ticket prices. Official fare names are preserved and missing rules remain visibly unresolved.</p>
    </section>
  );
}
