import type { Metadata } from "next";
import Link from "next/link";

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
      <section id="willit-lab" className="mt-10 scroll-mt-24 border-t border-navy-100 pt-8">
        <h2 className="font-heading text-2xl font-semibold text-navy-700">WillIt Lab</h2>
        <p className="mt-3 font-body leading-relaxed text-navy-600">WillIt Lab is our optional space for small travel experiments. It is kept separate from the cabin bag checker, so experiments can never change baggage results or airline data.</p>
        <Link href="/lab" className="mt-4 inline-flex min-h-11 items-center font-body text-sm font-semibold text-green-700 underline">Visit WillIt Lab</Link>
      </section>
    </section>
  );
}
