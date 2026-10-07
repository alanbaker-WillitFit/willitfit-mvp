import type { Metadata } from "next";
import { ENRICHED_RULES } from "@/services/baggageKnowledge";
import { getAirlineReferences } from "@/services/airlines";
import { siteUrl } from "@/lib/utils";
import ComparisonTable from "@/components/ComparisonTable";

export const metadata: Metadata = {
  title: "Cabin bag size comparison by airline",
  description: "Compare published cabin bag dimensions and fare-specific rules across airlines in the WillItFit certified dataset.",
  alternates: { canonical: siteUrl("/compare/cabin-bag-sizes") },
};
export default async function Page() {
  const { airlines } = await getAirlineReferences();
  const byId = new Map(airlines.map(a => [a.airlineId,a]));
  const rows = ENRICHED_RULES.filter(r => r.bagType.toLowerCase().includes("cabin") && r.lengthCm && r.widthCm && r.depthCm)
    .map(rule => ({ rule, airline: byId.get(rule.airlineId) })).filter((x): x is { rule: typeof ENRICHED_RULES[number]; airline: NonNullable<typeof x.airline> } => Boolean(x.airline))
    .sort((a,b) => a.airline.airlineName.localeCompare(b.airline.airlineName) || a.rule.fare.localeCompare(b.rule.fare));
  return <main className="wf-container wf-section"><p className="text-sm font-semibold uppercase tracking-wide text-green-700">Comparison</p><h1 className="mt-2 font-heading text-4xl font-bold text-navy-700">Cabin bag size comparison by airline</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-navy-600">Compare the published external dimensions attached to cabin-bag rules. Fare conditions and weight limits can still change what is included.</p><ComparisonTable rows={rows} mode="size" /></main>;
}
