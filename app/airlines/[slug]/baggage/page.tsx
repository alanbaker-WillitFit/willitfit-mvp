import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAirlineBySlug } from "@/services/airlines";
import { getRulesForAirline, getFareGroups } from "@/services/baggageKnowledge";
import { siteUrl } from "@/lib/utils";
import { safeJsonLd } from "@/lib/jsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import RuleTable from "@/components/RuleTable";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { airline } = await getAirlineBySlug(slug);
  if (!airline) return {};
  const title = `${airline.airlineName} baggage allowance by fare`;
  const description = `See ${airline.airlineName} cabin, personal-item and checked-bag rules by fare, including dimensions, weights and official-source review details.`;
  return {
    title,
    description,
    alternates: { canonical: siteUrl(`/airlines/${airline.slug}/baggage`) },
    robots: { index: true, follow: true },
  };
}

export default async function AirlineBaggagePage({ params }: Props) {
  const { slug } = await params;
  const { airline } = await getAirlineBySlug(slug);
  if (!airline) return notFound();
  const rules = getRulesForAirline(airline.airlineId);
  if (!rules.length) return notFound();
  const fares = getFareGroups(airline.airlineId);
  const reviewed = rules.map(r => r.lastChecked).filter(Boolean).sort().at(-1) || airline.lastUpdated;
  const sources = Array.from(new Set(rules.map(r => r.sourceReference).filter(Boolean)));

  return (
    <main className="wf-container wf-container--narrow wf-section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "WebPage", name: `${airline.airlineName} baggage allowance by fare`, url: siteUrl(`/airlines/${airline.slug}/baggage`), dateModified: reviewed || undefined, about: { "@type": "Organization", name: airline.airlineName } },
          breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Airlines", path: "/airlines" }, { name: airline.airlineName, path: `/${airline.slug}` }, { name: "Baggage", path: `/airlines/${airline.slug}/baggage` }])
        ]
      }) }} />

      <p className="font-body text-sm font-semibold uppercase tracking-wide text-green-700">Baggage detail</p>
      <h1 className="mt-2 font-heading text-4xl font-bold text-navy-700">{airline.airlineName} baggage allowance by fare</h1>
      <p className="mt-4 max-w-3xl font-body text-lg leading-8 text-navy-600">
        A governed view of the published rules held for {airline.airlineName}. Use the fare shown on your booking: allowances can differ by fare and bag type.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link className="wf-btn-secondary px-4 py-2" href={`/${airline.slug}`}>Airline summary</Link>
        <Link className="wf-btn-secondary px-4 py-2" href="/compare/cabin-bag-sizes">Compare cabin bags</Link>
        <Link className="wf-btn-secondary px-4 py-2" href="/compare/personal-item-sizes">Compare personal items</Link>
      </div>

      <section className="mt-10">
        <h2 className="font-heading text-2xl font-semibold text-navy-700">Published allowance rules</h2>
        <p className="mt-2 text-sm text-navy-500">{rules.length} rule{rules.length === 1 ? "" : "s"} across {fares.length} fare or option{fares.length === 1 ? "" : "s"}.</p>
        <RuleTable airline={airline} rules={rules} />
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {fares.map(fare => (
          <Link key={fare.fareSlug} href={`/airlines/${airline.slug}/fares/${fare.fareSlug}`} className="wf-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Fare / option</p>
            <h2 className="mt-1 font-heading text-xl font-semibold text-navy-700">{fare.fare}</h2>
            <p className="mt-2 text-sm text-navy-500">{fare.rules.map(r => r.bagType).join(" · ")}</p>
          </Link>
        ))}
      </section>

      <section className="mt-10 rounded-2xl bg-navy-50 p-6">
        <h2 className="font-heading text-xl font-semibold text-navy-700">Evidence and review</h2>
        <p className="mt-2 text-sm text-navy-600">Last reviewed: {reviewed || "review date unavailable"}.</p>
        <p className="mt-2 text-sm text-navy-500">{sources.length} source reference{sources.length === 1 ? "" : "s"} support this published rule set.</p>
        {airline.websiteUrl ? <p className="mt-3 text-sm"><a href={airline.websiteUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-green-700 underline">Check {airline.airlineName}&apos;s official baggage page</a></p> : null}
      </section>
    </main>
  );
}
