import type { Airline, TravelTip } from "@/types";
import { airlineFaq, airlineWebPageSchema, breadcrumbSchema, faqSchema } from "@/lib/schema";
import DimensionForm from "@/components/DimensionForm";
import FAQSection from "@/components/FAQSection";
import AirlineSeoHub from "@/components/AirlineSeoHub";
import AirlineCard from "@/components/AirlineCard";
import AirlineGuidance from "@/components/AirlineGuidance";
import { safeJsonLd } from "@/lib/jsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";

interface AirlinePageProps {
  airline: Airline;
  airlines: Airline[];
  relatedAirlines: Airline[];
  tips: TravelTip[];
  source: "sheet" | "fallback";
}

function formatDimensions(value: Airline["cabinBag"]): string {
  return `${value.heightCm} × ${value.widthCm} × ${value.depthCm} cm`;
}

export default function AirlinePage({
  airline: current,
  airlines,
  relatedAirlines,
  tips,
  source,
}: AirlinePageProps) {
  const faq = airlineFaq(current);
  const availableFareClasses = current.fareClasses.filter(
    (fare) => fare.cabinBag || fare.personalItem
  );

  return (
    <section className="wf-container wf-container--narrow wf-section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@graph": [
              airlineWebPageSchema(current),
              faqSchema(faq),
              breadcrumbSchema([
                { name: "Home", path: "/" },
                { name: "Airlines", path: "/airlines" },
                { name: current.airlineName, path: `/${current.slug}` },
              ]),
            ].filter(Boolean),
          }),
        }}
      />

      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Airlines", href: "/airlines" }, { label: current.airlineName }]} />

      <div className="wf-layout-airline grid gap-8 lg:items-start">
        <div>
          <p className="font-body text-sm font-semibold uppercase tracking-wide text-green-600">Airline baggage guide</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold text-navy-700">{current.airlineName} cabin bag size guide</h1>
          <p className="mt-3 font-body text-navy-500">
            Check {current.airlineName}&apos;s cabin bag and personal item allowance, compare fare options,
            then test your own measurements before you reach the airport.
          </p>
        </div>

        <aside className="wf-card wf-card--compact p-5">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-navy-300">Data status</p>
          <p className="mt-1 font-body text-sm text-navy-600">
            {source === "sheet" ? `Reviewed ${current.lastUpdated || "date unavailable"}` : "Fallback reference data in use"}
          </p>
          <p className="mt-3 font-body text-xs text-navy-400">
            Allowances can change. {current.websiteUrl ? (
              <>Confirm final details on <a href={current.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">{current.airlineName}&apos;s own site</a>.</>
            ) : "Check the airline's official baggage policy before travel."}
          </p>
        </aside>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="wf-card wf-card--compact p-5">
          <h2 className="font-heading text-base font-semibold text-navy-700">Cabin bag</h2>
          <p className="mt-2 font-mono text-lg text-navy-700">{formatDimensions(current.cabinBag)}</p>
          {current.weightLimitKg && <p className="mt-1 font-body text-sm text-navy-400">Max weight: {current.weightLimitKg} kg</p>}
        </div>
        <div className="wf-card wf-card--compact p-5">
          <h2 className="font-heading text-base font-semibold text-navy-700">Personal item</h2>
          <p className="mt-2 font-mono text-lg text-navy-700">{formatDimensions(current.personalItem)}</p>
        </div>
      </div>

      {availableFareClasses.length > 0 && (
        <div className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-navy-700">Allowance by fare or option</h2>
          <div className="mt-4 rounded-xl border border-navy-100">
            <table className="wf-responsive-table min-w-full text-left font-body text-sm">
              <thead className="bg-navy-50 text-navy-500">
                <tr><th className="px-4 py-3">Fare or option</th><th className="px-4 py-3">Cabin bag</th><th className="px-4 py-3">Personal item</th><th className="px-4 py-3">Weight</th></tr>
              </thead>
              <tbody>
                {availableFareClasses.map((fare) => (
                  <tr key={fare.fareClass} className="border-t border-navy-100 text-navy-600">
                    <th className="px-4 py-3 font-semibold">{fare.fareClass}</th>
                    <td data-label="Cabin bag" className="px-4 py-3">{fare.cabinBag ? formatDimensions(fare.cabinBag) : "Not listed"}</td>
                    <td data-label="Personal item" className="px-4 py-3">{fare.personalItem ? formatDimensions(fare.personalItem) : "Not listed"}</td>
                    <td data-label="Weight" className="px-4 py-3">{fare.weightLimitKg ? `${fare.weightLimitKg} kg` : "Not listed"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-body text-xs text-navy-400">Your selected fare or add-on may change what is included. Use the checker option that matches your booking.</p>
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-navy-700">Check your bag against {current.airlineName}</h2>
        <div className="mt-4"><DimensionForm airlines={airlines} initialAirline={current} /></div>
      </div>

      <AirlineGuidance airline={current} tips={tips} />

      <AirlineSeoHub airline={current} tips={tips} />

      {relatedAirlines.length > 0 && (
        <div className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-navy-700">Compare similar airlines</h2>
          <div className="wf-grid-3 mt-4">
            {relatedAirlines.map((airline) => <AirlineCard key={airline.airlineId} airline={airline} />)}
          </div>
        </div>
      )}

      {faq.length > 0 && (
        <div className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-navy-700">{current.airlineName} baggage FAQs</h2>
          <div className="mt-4"><FAQSection items={faq} /></div>
        </div>
      )}
    </section>
  );
}
