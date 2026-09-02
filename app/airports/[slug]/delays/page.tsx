import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAviationCurrent, getPublishingAirportBySlug } from "@/services/publishingData";

export const revalidate = 60;

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const airport = await getPublishingAirportBySlug(params.slug);
  if (!airport) return { title: "Airport delays | WillItFit" };
  return {
    title: `${airport.displayName} delays and cancellations | WillItFit`,
    description: `Current delays, cancellations, arrivals and departures for ${airport.displayName} Airport.`,
  };
}

export default async function AirportDelaysPage({ params }: PageProps) {
  const airport = await getPublishingAirportBySlug(params.slug);
  if (!airport) notFound();

  const aviation = await getAviationCurrent();
  const current = airport.iataCode ? aviation?.airports[airport.iataCode] : undefined;
  const freshness = aviation?.freshness ?? "UNAVAILABLE";
  const generatedAt = aviation?.generatedAt;

  const events = freshness === "UNAVAILABLE" ? [] : (current?.events ?? []);
  const departures = events.filter((event) => event.direction === "departure");
  const arrivals = events.filter((event) => event.direction === "arrival");

  return (
    <main>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="wf-container py-10 sm:py-14">
          <Link href={`/airports/${airport.slug}`} className="text-sm font-semibold text-blue-700 hover:underline">
            ← {airport.displayName} Airport
          </Link>
          <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight text-navy-900 sm:text-5xl">
            {airport.displayName} delays and cancellations
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-navy-600">
            Current operational status from WillIt-validated flight data. Reasons are shown only when explicitly evidenced.
          </p>
        </div>
      </section>

      <section className="wf-container py-8 sm:py-10">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-navy-500">Feed status</p>
              <h2 className="mt-1 font-heading text-2xl font-semibold text-navy-900">
                {freshness === "LIVE"
                  ? "Live"
                  : freshness === "DELAYED"
                    ? "Live data is delayed"
                    : "Live status temporarily unavailable"}
              </h2>
            </div>
            {generatedAt && freshness !== "UNAVAILABLE" ? (
              <p className="text-xs text-navy-500">Snapshot: {generatedAt}</p>
            ) : null}
          </div>

          {freshness === "UNAVAILABLE" ? (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-navy-600">
              The latest validated snapshot is more than 20 minutes old or unavailable. WillIt suppresses stale live
              counts rather than presenting them as current.
            </p>
          ) : current ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-navy-500">Delayed departures</p>
                <p className="mt-1 text-2xl font-bold text-navy-900">{current.delayedDepartures ?? 0}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-navy-500">Delayed arrivals</p>
                <p className="mt-1 text-2xl font-bold text-navy-900">{current.delayedArrivals ?? 0}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-navy-500">Cancellations</p>
                <p className="mt-1 text-2xl font-bold text-navy-900">{current.cancellations ?? 0}</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-navy-600">No validated airport feed is available for this airport.</p>
          )}
        </div>

        {freshness !== "UNAVAILABLE" ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <FlightList title="Departures" events={departures} />
            <FlightList title="Arrivals" events={arrivals} />
          </div>
        ) : null}

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="font-heading text-lg font-semibold text-navy-900">How WillIt handles live data</h2>
          <p className="mt-2 text-sm leading-6 text-navy-600">
            Status can publish before a reason is known. A cause is never inferred from timing, nearby weather,
            transport disruption or generic keywords. This page reads WillIt-owned publication data only; it does not
            call Google, airport, airline or comparator APIs during your visit.
          </p>
        </div>
      </section>
    </main>
  );
}

function FlightList({ title, events }: { title: string; events: Array<{
  eventId: string;
  flightNumber?: string;
  origin?: string;
  destination?: string;
  scheduledTime?: string;
  estimatedTime?: string;
  status: string;
  causeSummary?: string;
  causeConfidence?: "HIGH" | "MEDIUM" | "LOW" | "UNVERIFIED";
}> }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-heading text-2xl font-semibold text-navy-900">{title}</h2>
      {events.length === 0 ? (
        <p className="mt-4 text-sm text-navy-600">No current validated disruption events to display.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {events.map((event) => (
            <article key={event.eventId} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy-900">{event.flightNumber || "Flight"}</p>
                  <p className="mt-1 text-sm text-navy-600">
                    {event.origin && event.destination ? `${event.origin} → ${event.destination}` : event.origin || event.destination || ""}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-navy-700">{event.status}</span>
              </div>
              {(event.scheduledTime || event.estimatedTime) ? (
                <p className="mt-3 text-sm text-navy-600">
                  Scheduled {event.scheduledTime || "—"}{event.estimatedTime ? ` · Estimated ${event.estimatedTime}` : ""}
                </p>
              ) : null}
              {event.causeSummary && event.causeConfidence !== "UNVERIFIED" ? (
                <p className="mt-2 text-sm text-navy-700">Reason: {event.causeSummary}</p>
              ) : (
                <p className="mt-2 text-sm text-navy-500">Reason not yet confirmed.</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
