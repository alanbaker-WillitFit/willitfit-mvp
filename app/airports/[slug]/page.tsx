import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAirportReference,
  getAviationCurrent,
  getPublishingAirportBySlug,
} from "@/services/publishingData";

export const revalidate = 60;

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const airport = await getPublishingAirportBySlug(params.slug);
  if (!airport) return { title: "Airport not found | WillItFit" };

  return {
    title: `${airport.displayName} Airport | WillItFit`,
    description: `Practical information and current disruption status for ${airport.displayName} Airport.`,
  };
}

export default async function AirportPage({ params }: PageProps) {
  const airport = await getPublishingAirportBySlug(params.slug);
  if (!airport) notFound();

  const [reference, aviation] = await Promise.all([
    getAirportReference(airport.airportId),
    getAviationCurrent(),
  ]);

  const live = airport.iataCode ? aviation?.airports[airport.iataCode] : undefined;
  const freshness = aviation?.freshness ?? "UNAVAILABLE";

  return (
    <main>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="wf-container py-10 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-green-700">WillItFit Airports</p>
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
                  <p className="mt-1 text-2xl font-bold text-navy-900">{live.delayedDepartures ?? 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-navy-500">Delayed arrivals</p>
                  <p className="mt-1 text-2xl font-bold text-navy-900">{live.delayedArrivals ?? 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-navy-500">Cancellations</p>
                  <p className="mt-1 text-2xl font-bold text-navy-900">{live.cancellations ?? 0}</p>
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
                {reference.lastCheckedAt ? (
                  <p className="text-xs text-navy-500">Reference information last checked: {reference.lastCheckedAt}</p>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-navy-600">Airport reference information is currently unavailable.</p>
            )}
          </article>
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:self-start">
          <h2 className="font-heading text-lg font-semibold text-navy-900">Data policy</h2>
          <p className="mt-3 text-sm leading-6 text-navy-600">
            Live flight information is published from a validated WillIt snapshot. This page does not call airport,
            airline, comparator or Google APIs when you open it.
          </p>
        </aside>
      </section>
    </main>
  );
}
