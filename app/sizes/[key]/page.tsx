import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSizeGroup } from "@/services/baggageKnowledge";
import { getAirlineReferences } from "@/services/airlines";
import { siteUrl } from "@/lib/utils";
import { safeJsonLd } from "@/lib/jsonLd";

type Props = { params: Promise<{ key: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  const group = getSizeGroup(key);
  if (!group) return {};
  return {
    title: `${group.label} ${group.bagType} airline comparison`,
    description: `See which published airline baggage rules use ${group.label} for ${group.bagType.toLowerCase()}, including fares and weight limits.`,
    alternates: { canonical: siteUrl(`/sizes/${group.key}`) },
    robots: { index: true, follow: true },
  };
}

export default async function SizePage({ params }: Props) {
  const { key } = await params;
  const group = getSizeGroup(key);
  if (!group) return notFound();
  const { airlines } = await getAirlineReferences();
  const byId = new Map(airlines.map(a => [a.airlineId, a]));
  const rows = group.rules.map(rule => ({ rule, airline: byId.get(rule.airlineId) })).filter(x => x.airline);

  return (
    <main className="wf-container wf-container--narrow wf-section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${group.label} ${group.bagType} airline comparison`,
        url: siteUrl(`/sizes/${group.key}`),
        numberOfItems: rows.length,
        itemListElement: rows.map((row, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: { "@type": "WebPage", name: `${row.airline!.airlineName} - ${row.rule.fare}`, url: siteUrl(`/airlines/${row.airline!.slug}/fares/${row.rule.fareSlug}`) }
        }))
      }) }} />

      <p className="text-sm font-semibold uppercase tracking-wide text-green-700">{group.bagType} comparison</p>
      <h1 className="mt-2 font-heading text-4xl font-bold text-navy-700">{group.label}: which airline rules use this size?</h1>
      <p className="mt-4 text-lg leading-8 text-navy-600">These are published rule matches for the exact external dimensions. A matching size does not by itself prove your bag is included: fare, weight and entitlement still matter.</p>

      <div className="mt-8 overflow-x-auto rounded-xl border border-navy-100">
        <table className="wf-responsive-table min-w-full text-left text-sm">
          <thead className="bg-navy-50 text-navy-600"><tr><th className="px-4 py-3">Airline</th><th className="px-4 py-3">Fare</th><th className="px-4 py-3">Weight</th><th className="px-4 py-3">Rule</th></tr></thead>
          <tbody>
            {rows.map(({ rule, airline }) => (
              <tr key={rule.ruleId} className="border-t border-navy-100">
                <td className="px-4 py-3"><Link className="font-semibold text-green-700 underline" href={`/${airline!.slug}`}>{airline!.airlineName}</Link></td>
                <td className="px-4 py-3">{rule.fare}</td>
                <td className="px-4 py-3">{rule.weightKg ? `${rule.weightKg} kg` : "Not stated"}</td>
                <td className="px-4 py-3"><Link className="text-green-700 underline" href={`/airlines/${airline!.slug}/fares/${rule.fareSlug}`}>Details</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-sm text-navy-500">Compared from {rows.length} governed rule match{rows.length === 1 ? "" : "es"}. Always confirm the fare and current airline policy before travel.</p>
    </main>
  );
}
