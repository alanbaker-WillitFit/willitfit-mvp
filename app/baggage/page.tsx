import type { Metadata } from "next";
import Link from "next/link";
import { getAirlineReferences } from "@/services/airlines";
import { getAllAirlineRuleDetails } from "@/services/airlineRuleDetails";
import { siteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Airline baggage allowances",
  description: "Browse governed cabin, personal-item and checked-baggage rules by airline, fare and bag type.",
  alternates: { canonical: siteUrl("/baggage") },
};
export default async function BaggageIndexPage() {
  const [{ airlines }, rules] = await Promise.all([getAirlineReferences(), getAllAirlineRuleDetails()]);
  const counts = new Map<string, number>(); rules.forEach((r) => counts.set(r.airlineId, (counts.get(r.airlineId) ?? 0) + 1));
  return <main className="wf-container wf-section">
    <section className="rounded-3xl bg-navy-700 p-7 text-white sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-green-400">WillItFit baggage library</p>
      <h1 className="mt-2 font-heading text-4xl font-bold">Airline baggage allowances</h1>
      <p className="mt-4 max-w-3xl text-navy-100">Explore the published rule rows behind the checker: cabin bags, personal items, checked baggage, fare differences, weights, dimensions and evidence notes.</p>
      <div className="mt-6 flex flex-wrap gap-3"><Link className="rounded-full bg-green-600 px-5 py-2.5 font-semibold" href="/compare">Compare bag sizes</Link><Link className="rounded-full border border-white/30 px-5 py-2.5 font-semibold" href="/airline-summaries">Airline summaries</Link></div>
    </section>
    <div className="wf-grid-3 mt-8">{airlines.map((a)=><Link key={a.airlineId} href={`/airlines/${a.slug}/baggage`} className="wf-card p-5"><p className="text-xs font-semibold uppercase tracking-wide text-green-700">{a.country || "Airline"}</p><h2 className="mt-1 font-heading text-lg font-semibold text-navy-700">{a.airlineName}</h2><p className="mt-2 text-sm text-navy-500">{counts.get(a.airlineId) ?? 0} published baggage rules</p><p className="mt-3 text-sm font-semibold text-green-700">View baggage detail →</p></Link>)}</div>
  </main>;
}
