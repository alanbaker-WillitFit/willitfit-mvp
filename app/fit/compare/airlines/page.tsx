import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import AirlineComparison from "@/components/AirlineComparison";
import { getCachedAirlines } from "@/services/airlines";
import { siteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Compare airline baggage allowances | WillItFit",
  description: "Compare personal-item, cabin-bag and checked-baggage allowances between two airlines and their published fare options.",
  alternates: { canonical: siteUrl("/fit/compare/airlines") },
};

export default async function CompareAirlinesPage() {
  const { airlines } = await getCachedAirlines();
  return (
    <main className="wf-container wf-section">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Airlines", href: "/airlines" }, { label: "Compare airlines" }]} />
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-green-700">WillItFit comparison</p>
      <h1 className="mt-2 font-heading text-3xl font-bold text-navy-900">Compare airline baggage allowances</h1>
      <p className="mt-3 max-w-3xl text-navy-600">Choose two airlines and, where published, the fare or option for each. WillItFit compares baggage rules only and does not compare ticket prices.</p>
      <div className="mt-8"><AirlineComparison airlines={airlines} /></div>
    </main>
  );
}
