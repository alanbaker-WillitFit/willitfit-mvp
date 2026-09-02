import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAirportReference,
  getAviationCurrent,
  getPublishingAirportBySlug,
} from "@/services/publishingData";
import { getCachedAirlines } from "@/services/airlines";
import Breadcrumbs from "@/components/Breadcrumbs";
import { breadcrumbSchema } from "@/lib/schema";
import { safeJsonLd } from "@/lib/jsonLd";
import { siteUrl } from "@/lib/utils";
import PublishingCommercialSlot from "@/components/PublishingCommercialSlot";

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const airport = await getPublishingAirportBySlug((await params).slug);
  if (!airport) return { title: "Airport not found | WillItFit" };

  const canonical = siteUrl(`/airports/${airport.slug}`);
  return {
    title: `${airport.displayName} Airport | WillItFit`,
    description: `Practical information and current disruption status for ${airport.displayName} Airport.`,
    alternates: { canonical },
    openGraph: { title: `${airport.displayName} Airport | WillItFit`, url: canonical, siteName: "WillItFit", type: "website" },
  };
}

export default async function AirportPage({ params }: PageProps) {
  const airport = await getPublishingAirportBySlug((await params).slug);
  if (!airport) notFound();

  const [reference, aviation, { airlines }] = await Promise.all([
    getAirportReference(airport.airportId),
    getAviationCurrent(),
    getCachedAirlines(),
  ]);

  const live = airport.iataCode ? aviation?.airports[airport.iataCode] : undefined;
  const freshness = aviation?.freshness ?? "UNAVAILABLE";
  const airlineById = new Map(airlines.map((item) => [item.airlineId, item]));
  const affectedAirlines = Array.from(new Set((live?.events ?? []).map((event) => event.airlineId).filter(Boolean)))
    .map((id) => airlineById.get(id as string))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Airports", path: "/airports" },
        { name: `${airport.displayName} Airport`, path: `/airports/${airport.slug}` },
      ])) }} />
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="wf-container py-10 sm:py-14">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Airports", href: "/airports" }, { label: airport.displayName }]} />
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.14em] text-green-700">WillItFit Airports</p>
          <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight text-navy-900 sm:text-5xl">
            {airport.displayName} Airport
          </h1>
          <p className="mt-3 text-base text-navy-600">
            {[airport.iataCode, airport.municipality].filter(Boolean).join(" · ")}
          </p>
        </div>
      </section>

      <section className="wf-container grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-navy-500">Current flight disruption</p>
                <h2 className="mt-1 font-heading text-2xl font-semibold text-navy-900">
                  {freshness === "UNAVAILABLE"
                    ? "Live status temporarily unavailable"
                    : freshness === "DELAYED"
                      ? "Live data is delayed"
                      : "Live status"}
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-navy-700">{freshness}</span>
            </div>

            {freshness !== "UNAVAILABLE" && live ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-navy-500">Delayed departures</p>
                  <p className="mt-1 text-2xl font-bold text-navy-900">{live.delayedDepartures ?? "—"}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-navy-500">Delayed arrivals</p>
                  <p className="mt-1 text-2xl font-bold text-navy-900">{live.delayedArrivals ?? "—"}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-navy-500">Cancellations</p>
                  <p className="mt-1 text-2xl font-bold text-navy-900">{live.cancellations ?? "—"}</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-navy-600">
                We will not show stale flight counts as current. Please check again shortly.
              </p>
            )}

            <Link
              href={`/airports/${airport.slug}/delays`}
              className="mt-5 inline-flex min-h-11 items-center font-semibold text-blue-700 underline-offset-4 hover:underline"
            >
              View arrivals, departures and disruption details →
            </Link>
          </article>

          {affectedAirlines.length > 0 ? (
            <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-heading text-2xl font-semibold text-navy-900">Airlines in current disruption events</h2>
              <p className="mt-2 text-sm text-navy-600">These links connect the current airport events back to the governed baggage guide and checker for each resolved airline.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {affectedAirlines.map((item) => <Link key={item.airlineId} href={`/${item.slug}`} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:underline">{item.airlineName}</Link>)}
              </div>
            </article>
          ) : null}

          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-2xl font-semibold text-navy-900">Airport information</h2>
            {reference ? (
              <div className="mt-4 space-y-4 text-navy-700">
                {reference.terminals?.length ? (
                  <div>
                    <h3 className="font-semibold text-navy-900">Terminals</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {reference.terminals.map((terminal) => (
                        <li key={terminal.terminalId}>{terminal.name}{terminal.notes ? ` — ${terminal.notes}` : ""}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {reference.transport?.length ? (
                  <div>
                    <h3 className="font-semibold text-navy-900">Getting there</h3>
                    <ul className="mt-2 space-y-2">
                      {reference.transport.map((item, index) => (
                        <li key={`${item.mode}-${index}`}>
                          <span className="font-medium">{item.title}</span>{item.summary ? ` — ${item.summary}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {reference.parking?.length ? (
                  <div><h3 className="font-semibold text-navy-900">Parking</h3><ul className="mt-2 space-y-2">{reference.parking.map((item, index) => <li key={`${item.title}-${index}`}><a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{item.title}</a></li>)}</ul></div>
                ) : null}
                {reference.lounges?.length ? (
                  <div><h3 className="font-semibold text-navy-900">Lounges</h3><ul className="mt-2 space-y-2">{reference.lounges.map((item, index) => <li key={`${item.title}-${index}`}>{item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{item.title}</a> : item.title}</li>)}</ul></div>
                ) : null}
                {reference.facilities?.length ? (
                  <div><h3 className="font-semibold text-navy-900">Facilities and assistance</h3><ul className="mt-2 space-y-2">{reference.facilities.map((item, index) => { const link = item.summary && /^https?:\/\//i.test(item.summary) ? item.summary : null; return <li key={`${item.title}-${index}`}>{link ? <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{item.title}</a> : <><span className="font-medium">{item.title}</span>{item.summary ? ` — ${item.summary}` : ""}</>}</li>; })}</ul></div>
                ) : null}
                {reference.lastCheckedAt ? (
                  <p className="text-xs text-navy-500">Reference information last checked: {reference.lastCheckedAt}</p>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-navy-600">Airport reference information is currently unavailable.</p>
            )}
          </article>
        </div>

        <div className="space-y-4 lg:self-start">
          <PublishingCommercialSlot pageType="airport" entityId={airport.airportId} slotId="COMMERCIAL_TOP" />
          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-navy-900">Data policy</h2>
            <p className="mt-3 text-sm leading-6 text-navy-600">
              Live flight information is published from a validated WillIt snapshot. This page does not call airport,
              airline, comparator or Google APIs when you open it.
            </p>
          </aside>
          <PublishingCommercialSlot pageType="airport" entityId={airport.airportId} slotId="COMMERCIAL_BOTTOM" />
        </div>
      </section>
    </main>
  );
}
