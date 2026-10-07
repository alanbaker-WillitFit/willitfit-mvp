import type { Metadata } from "next";
import { ENRICHED_RULES } from "@/services/baggageKnowledge";
import { getAirlineReferences } from "@/services/airlines";
import { siteUrl } from "@/lib/utils";
import ComparisonTable from "@/components/ComparisonTable";

export const metadata: Metadata = {
  title: "Checked baggage weight comparison by airline",
  description: "Compare published checked-bag weight rules by airline and fare from the WillItFit certified dataset.",
  alternates: { canonical: siteUrl("/compare/checked-bag-weights") },
};
export default async function Page() {
  const { airlines } = await getAirlineReferences();
  const byId = new Map(airlines.map(a => [a.airlineId,a]));
  const rows = ENRICHED_RULES.filter(r => /checked|hold|check-in/i.test(r.bagType) && r.weightKg)
    .map(rule => ({ rule, airline: byId.get(rule.airlineId) })).filter((x): x is { rule: typeof ENRICHED_RULES[number]; airline: NonNullable<typeof x.airline> } => Boolean(x.airline))
    .sort((a,b) => a.airline.airlineName.localeCompare(b.airline.airlineName) || (a.rule.weightKg ?? 0) - (b.rule.weightKg ?? 0));
  return <main className="wf-container wf-section"><p className="text-sm font-semibold uppercase tracking-wide text-green-700">Comparison</p><h1 className="mt-2 font-heading text-4xl font-bold text-navy-700">Checked baggage weight comparison by airline</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-navy-600">Compare published checked-bag weights by fare or option. Included bag count, route and ticket conditions can still vary.</p><ComparisonTable rows={rows} mode="weight" /></main>;
}
