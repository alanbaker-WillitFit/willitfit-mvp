import type { Metadata } from "next";
import Link from "next/link";
import { getAirlineReferences } from "@/services/airlines";
import AirlineCard from "@/components/AirlineCard";
import { siteUrl } from "@/lib/utils";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: siteUrl("/airlines") },
  title: "Cabin baggage size limits by airline",
  description:
    "Browse cabin bag and personal item size limits for every airline on WillitFit, updated from each airline's published baggage policy.",
};

export default async function AirlinesIndexPage() {
  const { airlines } = await getAirlineReferences();

  return (
    <section className="wf-container wf-section">
      <h1 className="font-heading text-3xl font-semibold text-navy-700">
        Cabin baggage size limits by airline
      </h1>
      <p className="mt-3 max-w-2xl font-body text-navy-500">
        Tap an airline to see its full cabin bag and personal item allowance, plus answers to the
        questions travellers ask most.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/baggage" className="wf-btn-cta px-5 py-2.5 text-sm">Baggage library</Link>
        <Link href="/compare" className="rounded-full border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-700">Compare sizes</Link>
        <Link href="/airline-summaries" className="rounded-full border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-700">Airline summaries</Link>
      </div>

      <div className="wf-grid-3 mt-8">
        {airlines.map((airline) => (
          <AirlineCard key={airline.airlineId} airline={airline} />
        ))}
      </div>
    </section>
  );
}
