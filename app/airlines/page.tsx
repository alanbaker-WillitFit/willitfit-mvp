import type { Metadata } from "next";
import { getAirlines } from "@/services/airlines";
import AirlineCard from "@/components/AirlineCard";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Cabin baggage size limits by airline",
  description:
    "Browse cabin bag and personal item size limits for every airline on WillitFit, updated from each airline's published baggage policy.",
};

export default async function AirlinesIndexPage() {
  const { airlines } = await getAirlines();

  return (
    <section className="wf-container wf-section">
      <h1 className="font-heading text-3xl font-semibold text-navy-700">
        Cabin baggage size limits by airline
      </h1>
      <p className="mt-3 max-w-2xl font-body text-navy-500">
        Tap an airline to see its full cabin bag and personal item allowance, plus answers to the
        questions travellers ask most.
      </p>

      <div className="wf-grid-3 mt-8">
        {airlines.map((airline) => (
          <AirlineCard key={airline.airlineId} airline={airline} />
        ))}
      </div>
    </section>
  );
}
