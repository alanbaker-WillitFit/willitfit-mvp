import Link from "next/link";
import { Airline, TravelTip } from "@/types";

type AirlineSeoHubProps = {
  airline: Airline;
  tips: TravelTip[];
};

function formatDimensions(label: string, dims: Airline["cabinBag"]): string {
  return `${label}: ${dims.heightCm} × ${dims.widthCm} × ${dims.depthCm} cm`;
}

export default function AirlineSeoHub({ airline, tips }: AirlineSeoHubProps) {
  const visibleTips = tips.slice(0, 6);
  const relatedSearches = [
    `${airline.airlineName} cabin bag size`,
    `${airline.airlineName} personal item size`,
    `${airline.airlineName} baggage allowance`,
    `${airline.airlineName} underseat bag`,
  ];

  return (
    <div className="mt-10 space-y-10">
      <section className="wf-card p-6">
        <h2 className="font-heading text-xl font-semibold text-navy-700">
          {airline.airlineName} baggage allowance summary
        </h2>
        <p className="mt-3 font-body text-navy-500">
          Use this quick guide to compare your bag against {airline.airlineName}&apos;s
          published cabin bag and personal item limits. The WillitFit checker is
          designed to help travellers spot oversize bags before they reach the gate.
        </p>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-navy-100 bg-white p-4">
            <dt className="font-heading text-sm font-semibold text-navy-700">
              Cabin bag size
            </dt>
            <dd className="mt-1 font-mono text-base text-navy-700">
              {formatDimensions("", airline.cabinBag).replace(": ", "")}
            </dd>
            {airline.weightLimitKg && (
              <dd className="mt-1 font-body text-sm text-navy-400">
                Weight limit: {airline.weightLimitKg} kg
              </dd>
            )}
          </div>

          <div className="rounded-2xl border border-navy-100 bg-white p-4">
            <dt className="font-heading text-sm font-semibold text-navy-700">
              Personal item size
            </dt>
            <dd className="mt-1 font-mono text-base text-navy-700">
              {formatDimensions("", airline.personalItem).replace(": ", "")}
            </dd>
            <dd className="mt-1 font-body text-sm text-navy-400">
              Usually stored under the seat in front.
            </dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="wf-card p-5">
          <h2 className="font-heading text-lg font-semibold text-navy-700">
            Before you pack
          </h2>
          <p className="mt-2 font-body text-sm text-navy-500">
            Measure the packed bag, not the empty manufacturer size. Bulging pockets,
            handles and wheels can affect whether the bag fits the sizer.
          </p>
        </div>
        <div className="wf-card p-5">
          <h2 className="font-heading text-lg font-semibold text-navy-700">
            At the airport
          </h2>
          <p className="mt-2 font-body text-sm text-navy-500">
            Keep documents, liquids and electronics easy to reach so you do not need
            to open and repack your bag during security or boarding.
          </p>
        </div>
        <div className="wf-card p-5">
          <h2 className="font-heading text-lg font-semibold text-navy-700">
            If your bag is close
          </h2>
          <p className="mt-2 font-body text-sm text-navy-500">
            A close result means there may be little tolerance. Use the checker, reduce
            soft contents where possible, and confirm the latest rules with the airline.
          </p>
        </div>
      </section>

      {visibleTips.length > 0 && (
        <section>
          <h2 className="font-heading text-xl font-semibold text-navy-700">
            {airline.airlineName} travel tips
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {visibleTips.map((tip) => (
              <article key={tip.tipId || tip.slug} className="wf-card p-5">
                <p className="font-body text-xs font-semibold uppercase tracking-wide text-green-600">
                  {tip.category || "Travel tip"}
                </p>
                <h3 className="mt-2 font-heading text-base font-semibold text-navy-700">
                  {tip.title}
                </h3>
                <p className="mt-2 font-body text-sm text-navy-500">{tip.content}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="wf-card p-6">
        <h2 className="font-heading text-xl font-semibold text-navy-700">
          Common {airline.airlineName} searches
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {relatedSearches.map((search) => (
            <span
              key={search}
              className="rounded-full border border-navy-100 bg-white px-3 py-1 font-body text-sm text-navy-500"
            >
              {search}
            </span>
          ))}
        </div>
        <p className="mt-4 font-body text-sm text-navy-400">
          These terms are included naturally to help travellers and search engines
          understand the page topic without keyword stuffing.
        </p>
      </section>

      <section className="rounded-3xl bg-navy-700 p-6 text-white">
        <h2 className="font-heading text-xl font-semibold">
          Still unsure whether your bag fits {airline.airlineName}?
        </h2>
        <p className="mt-2 font-body text-sm text-navy-100">
          Use the free WillitFit checker before you travel. It compares your bag
          dimensions against the airline allowance and explains the result clearly.
        </p>
        <Link
          href={`/?airline=${airline.slug}`}
          className="mt-4 inline-flex rounded-full bg-green-600 px-5 py-2 font-body text-sm font-semibold text-white hover:bg-green-700"
        >
          Check my bag
        </Link>
      </section>
    </div>
  );
}
