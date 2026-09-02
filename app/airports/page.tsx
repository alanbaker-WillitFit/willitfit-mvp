import type { Metadata } from "next";
import Link from "next/link";
import { getPublishingAirports } from "@/services/publishingData";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Airports | WillItFit",
  description: "Airport travel information, live disruption links and practical journey guidance from WillItFit.",
  robots: { index: false, follow: false },
};

export default async function AirportsIndexPage() {
  const airports = (await getPublishingAirports())
    .sort((a, b) => (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER));

  return (
    <main>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="wf-container py-12 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-green-700">WillItFit Airports</p>
          <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight text-navy-900 sm:text-5xl">Airports</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-navy-600 sm:text-lg">
            Practical airport information with live disruption links where verified operational coverage is available.
          </p>
        </div>
      </section>

      <section className="wf-container py-10 sm:py-12">
        {airports.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-navy-700 shadow-sm">
            Airport publishing data is currently unavailable. No airport facts are inferred or substituted.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {airports.map((airport) => (
              <article key={airport.airportId} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-xl font-semibold text-navy-900">{airport.displayName}</h2>
                    <p className="mt-1 text-sm text-navy-500">
                      {[airport.iataCode, airport.municipality].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {airport.iataCode && (
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold tracking-wide text-navy-700">
                      {airport.iataCode}
                    </span>
                  )}
                </div>
                <Link
                  href={`/airports/${airport.slug}`}
                  className="mt-5 inline-flex min-h-11 items-center font-semibold text-blue-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Airport guide <span className="ml-2" aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
