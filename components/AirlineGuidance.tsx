import type { Airline, TravelTip } from "@/types";

function unique(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function buildAirlineGuidance(airline: Airline, tips: TravelTip[]): string[] {
  const guidance = [
    airline.notes,
    airline.fareClasses.length > 1
      ? `Your ${airline.airlineName} allowance varies by fare or purchased option. Match the checker selection to your booking.`
      : "Measure the bag when fully packed, including wheels, handles and any bulging pockets.",
    "Airline staff may require the bag to fit completely inside a rigid airport sizer.",
    ...tips.slice(0, 3).map((tip) => tip.content),
  ];
  return unique(guidance).slice(0, 6);
}

export default function AirlineGuidance({ airline, tips }: { airline: Airline; tips: TravelTip[] }) {
  const guidance = buildAirlineGuidance(airline, tips);
  if (guidance.length === 0) return null;
  return (
    <section className="mt-10" aria-labelledby="airline-guidance-heading">
      <h2 id="airline-guidance-heading" className="font-heading text-xl font-semibold text-navy-700">
        Before you fly with {airline.airlineName}
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {guidance.map((item) => (
          <div key={item} className="wf-card wf-card--compact p-4">
            <p className="font-body text-sm leading-6 text-navy-600">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
