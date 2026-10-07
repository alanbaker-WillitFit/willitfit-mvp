import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAirlineBySlug } from "@/services/airlines";
import { getFareGroup, dimensionLabel } from "@/services/baggageKnowledge";
import { siteUrl } from "@/lib/utils";
import { safeJsonLd } from "@/lib/jsonLd";
import { breadcrumbSchema } from "@/lib/schema";

type Props = { params: Promise<{ slug: string; fare: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, fare } = await params;
  const { airline } = await getAirlineBySlug(slug);
  if (!airline) return {};
  const group = getFareGroup(airline.airlineId, fare);
  if (!group) return {};
  return {
    title: `${airline.airlineName} ${group.fare} baggage allowance`,
    description: `See the published ${airline.airlineName} ${group.fare} baggage allowance by bag type, including size, weight and evidence details.`,
    alternates: { canonical: siteUrl(`/airlines/${airline.slug}/fares/${group.fareSlug}`) },
    robots: { index: true, follow: true },
  };
}

export default async function FarePage({ params }: Props) {
  const { slug, fare } = await params;
  const { airline } = await getAirlineBySlug(slug);
  if (!airline) return notFound();
  const group = getFareGroup(airline.airlineId, fare);
  if (!group) return notFound();
  const reviewed = group.rules.map(r => r.lastChecked).filter(Boolean).sort().at(-1) || airline.lastUpdated;

  return (
    <main className="wf-container wf-container--narrow wf-section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "WebPage", name: `${airline.airlineName} ${group.fare} baggage allowance`, url: siteUrl(`/airlines/${airline.slug}/fares/${group.fareSlug}`), dateModified: reviewed || undefined, about: { "@type": "Organization", name: airline.airlineName } },
          breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Airlines", path: "/airlines" }, { name: airline.airlineName, path: `/${airline.slug}` }, { name: "Baggage", path: `/airlines/${airline.slug}/baggage` }, { name: group.fare, path: `/airlines/${airline.slug}/fares/${group.fareSlug}` }])
        ]
      }) }} />

      <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Fare / option detail</p>
      <h1 className="mt-2 font-heading text-4xl font-bold text-navy-700">{airline.airlineName} {group.fare} baggage allowance</h1>
      <p className="mt-4 text-lg leading-8 text-navy-600">Published baggage rules associated with the {group.fare} fare or option. Confirm that this matches the fare on your booking before relying on it.</p>

      <div className="mt-8 grid gap-4">
        {group.rules.map(rule => (
          <section key={rule.ruleId} className="wf-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{rule.bagType}</p>
                <h2 className="mt-1 font-heading text-2xl font-semibold text-navy-700">{dimensionLabel(rule) ?? (rule.linearSizeCm ? `${rule.linearSizeCm} cm linear size` : "No dimensional limit published in this dataset")}</h2>
              </div>
              {rule.weightKg ? <strong className="rounded-full bg-navy-50 px-3 py-1 text-sm text-navy-700">{rule.weightKg} kg</strong> : null}
            </div>
            {rule.ruleWording ? <p className="mt-4 leading-7 text-navy-600">{rule.ruleWording}</p> : null}
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="font-semibold text-navy-700">Wheels</dt><dd className="text-navy-500">{rule.wheelsIncluded || "Not stated"}</dd></div>
              <div><dt className="font-semibold text-navy-700">Handles</dt><dd className="text-navy-500">{rule.handlesIncluded || "Not stated"}</dd></div>
              <div><dt className="font-semibold text-navy-700">Under-seat</dt><dd className="text-navy-500">{rule.fitsUnderSeat || "Not stated"}</dd></div>
              <div><dt className="font-semibold text-navy-700">Sizing method</dt><dd className="text-navy-500">{rule.sizingMethod || "Not stated"}</dd></div>
            </dl>
            {rule.softBagGuidance ? <p className="mt-4 rounded-xl bg-navy-50 p-4 text-sm text-navy-600"><strong>Soft-bag guidance:</strong> {rule.softBagGuidance}</p> : null}
            <p className="mt-4 text-xs text-navy-400">Rule {rule.ruleId} · reviewed {rule.lastChecked || "date unavailable"}</p>
          </section>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="wf-btn-secondary px-4 py-2" href={`/airlines/${airline.slug}/baggage`}>All {airline.airlineName} baggage rules</Link>
        <Link className="wf-btn-secondary px-4 py-2" href={`/${airline.slug}`}>Airline summary</Link>
      </div>
    </main>
  );
}
