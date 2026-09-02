import Link from "next/link";
import type { Airline, BaggageSizingRule, TravelTip } from "@/types";
import { airlineFaq, airlineWebPageSchema, breadcrumbSchema, faqSchema } from "@/lib/schema";
import DimensionForm from "@/components/DimensionForm";
import FAQSection from "@/components/FAQSection";
import AirlineSeoHub from "@/components/AirlineSeoHub";
import AirlineCard from "@/components/AirlineCard";
import AirlineGuidance from "@/components/AirlineGuidance";
import { safeJsonLd } from "@/lib/jsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { airlineHasBagType } from "@/lib/dimensions";
import { getRuntimeContent } from "@/services/runtimeContent";
import { getAffiliateSlots } from "@/services/runtimeAffiliates";
import { getLabConfigurations } from "@/services/labConfig";
import { getAirlinePageDetails } from "@/services/airlinePageDetails";

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

function formatCheckedRule(rule: BaggageSizingRule | null | undefined, weightKg: number | null | undefined): string {
  if (!rule) return weightKg ? `${weightKg} kg — dimensions not published` : "Not published";
  if (rule.method === "fixed-dimensions") return formatDimensions(rule.dimensions);
  if (rule.method === "linear-total") return `${rule.operator === "lt" ? "Under" : "At or under"} ${rule.linearLimitCm} cm total`;
  return weightKg ? `${weightKg} kg — dimensions not universally published` : "Weight-only rule";
}

export default async function AirlinePage({
  airline: current,
  airlines,
  relatedAirlines,
  tips,
  source,
}: AirlinePageProps) {
  const [{ content: notices }, { slots: affiliateSlots }, labConfigs, pageDetails] = await Promise.all([
    getRuntimeContent({ module: "Notices", page: "checker" }),
    getAffiliateSlots(),
    getLabConfigurations(),
    getAirlinePageDetails(current.airlineId),
  ]);
  const faq = airlineFaq(current);
  const hasCabin = airlineHasBagType(current, "cabinBag");
  const hasPersonal = airlineHasBagType(current, "personalItem");
  const hasChecked = airlineHasBagType(current, "checkedBag");
  const availableFareClasses = current.fareClasses.filter(
    (fare) => fare.cabinBag || fare.personalItem || fare.checkedBag || fare.checkedWeightLimitKg !== null
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
          <h1 className="mt-3 font-heading text-3xl font-semibold text-navy-700">{current.airlineName} baggage allowance guide</h1>
          <p className="mt-3 font-body text-navy-500">
            Compare {current.airlineName}&apos;s personal-item, cabin and checked-baggage rules, review fare options,
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
        <div className="wf-card wf-card--compact flex min-h-[180px] flex-col p-5">
          <h2 className="font-heading text-base font-semibold text-navy-700">Personal item</h2>
          {hasPersonal ? (
            <p className="mt-2 font-mono text-lg text-navy-700">{formatDimensions(current.personalItem)}</p>
          ) : (
            <div className="mt-2 text-sm text-navy-500">
              <strong>{notices.find((item) => item.section === "personalItem-unavailable")?.title}</strong>
              <p>{notices.find((item) => item.section === "personalItem-unavailable")?.body}</p>
            </div>
          )}
        </div>

        <div className="wf-card wf-card--compact flex min-h-[180px] flex-col p-5">
          <h2 className="font-heading text-base font-semibold text-navy-700">Cabin bag</h2>
          {hasCabin ? (
            <>
              <p className="mt-2 font-mono text-lg text-navy-700">{formatDimensions(current.cabinBag)}</p>
              {current.weightLimitKg ? <p className="mt-1 font-body text-sm text-navy-400">Max weight: {current.weightLimitKg} kg</p> : <p className="mt-1 font-body text-sm text-navy-400">No published universal weight limit.</p>}
            </>
          ) : (
            <div className="mt-2 text-sm text-navy-500">
              <strong>{notices.find((item) => item.section === "cabinBag-unavailable")?.title}</strong>
              <p>{notices.find((item) => item.section === "cabinBag-unavailable")?.body}</p>
            </div>
          )}
        </div>

        <div className="wf-card wf-card--compact flex min-h-[180px] flex-col p-5">
          <h2 className="font-heading text-base font-semibold text-navy-700">Checked baggage</h2>
          {hasChecked ? (
            <>
              <p className="mt-2 font-mono text-lg text-navy-700">{formatCheckedRule(current.checkedBag, current.checkedWeightLimitKg)}</p>
              {current.checkedWeightLimitKg ? <p className="mt-1 font-body text-sm text-navy-400">Max weight: {current.checkedWeightLimitKg} kg</p> : <p className="mt-1 font-body text-sm text-navy-400">Weight varies by fare, route or booking.</p>}
            </>
          ) : (
            <p className="mt-2 font-body text-sm leading-6 text-navy-500">No eligible published checked-baggage rule is currently available. Check your booking before travel.</p>
          )}
        </div>

        <div className="wf-card wf-card--compact flex min-h-[180px] flex-col p-5">
          <h2 className="font-heading text-base font-semibold text-navy-700">Oversized and specialist baggage</h2>
          <p className="mt-2 flex-1 font-body text-sm leading-6 text-navy-500">
            {pageDetails.oversizedSummary || `${current.airlineName} applies separate rules to sports equipment, mobility items and other specialist baggage. Booking, fees, packaging and weight limits can vary by item.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/size-guides/oversized-baggage" className="font-body text-sm font-bold text-green-600 underline underline-offset-4">View oversized baggage guide</Link>
            {pageDetails.oversizedPolicyUrl && <a href={pageDetails.oversizedPolicyUrl} target="_blank" rel="noopener noreferrer" className="font-body text-sm font-bold text-navy-500 underline underline-offset-4">Official airline policy</a>}
          </div>
        </div>
      </div>

      {availableFareClasses.length > 0 && (
        <div className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-navy-700">Allowance by fare or option</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-navy-100">
            <table className="wf-responsive-table min-w-full text-left font-body text-sm">
              <thead className="bg-navy-50 text-navy-500">
                <tr>
                  <th className="px-4 py-3">Fare or option</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Personal item</th>
                  <th className="px-4 py-3">Cabin bag</th>
                  <th className="px-4 py-3">Checked baggage</th>
                  <th className="px-4 py-3">Weight guidance</th>
                </tr>
              </thead>
              <tbody>
                {availableFareClasses.map((fare) => {
                  const editorial = pageDetails.fareDetails[fare.fareClass];
                  const weightText = editorial?.weightGuidance
                    || (fare.checkedWeightLimitKg ? `Checked: ${fare.checkedWeightLimitKg} kg` : fare.weightLimitKg ? `Cabin: ${fare.weightLimitKg} kg` : editorial?.weightStatus === "not-published" ? "No universal weight limit published" : "Check booking");
                  return (
                    <tr key={fare.fareClass} className="border-t border-navy-100 text-navy-600">
                      <th className="px-4 py-3 font-semibold">{fare.fareClass}</th>
                      <td data-label="Description" className="px-4 py-3">{editorial?.description || "Allowance varies by booking option."}</td>
                      <td data-label="Personal item" className="px-4 py-3">{fare.personalItem ? formatDimensions(fare.personalItem) : "Not listed"}</td>
                      <td data-label="Cabin bag" className="px-4 py-3">{fare.cabinBag ? formatDimensions(fare.cabinBag) : "Not listed"}</td>
                      <td data-label="Checked baggage" className="px-4 py-3">{formatCheckedRule(fare.checkedBag, fare.checkedWeightLimitKg)}</td>
                      <td data-label="Weight guidance" className="px-4 py-3">{weightText}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-body text-xs text-navy-400">Your selected fare or add-on may change what is included. Use the checker option that matches your booking.</p>
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-navy-700">Check your bag against {current.airlineName}</h2>
        <div className="mt-4"><DimensionForm airlines={airlines} initialAirline={current} notices={notices} affiliateSlots={affiliateSlots} labConfigs={labConfigs} /></div>
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
