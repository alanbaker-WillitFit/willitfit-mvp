import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our data",
  description: "How WillitFit sources and maintains airline baggage allowance data.",
};

export default function AboutPage() {
  return (
    <section className="wf-container wf-container--narrow wf-section">
      <h1 className="font-heading text-3xl font-semibold text-navy-700">Where our data comes from</h1>
      <div className="mt-6 space-y-4 font-body text-navy-600">
        <p>
          Every allowance on WillitFit is sourced from each airline&apos;s own published baggage
          policy. We review and update the underlying data set regularly, but airlines can change
          their rules without notice — always confirm with your airline directly before you travel
          if your trip is time-sensitive.
        </p>
        <p>
          WillitFit doesn&apos;t store anything about you. We don&apos;t require an account, and
          the dimensions you enter into the checker are never saved or shared.
        </p>
      </div>
    </section>
  );
}
