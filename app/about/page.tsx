import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About WillItFly",
  description: "How WillItFly uses governed destination data to provide practical travel answers.",
};

export default function AboutPage() {
  return (
    <section className="wf-container wf-container--narrow wf-section">
      <h1 className="font-heading text-3xl font-semibold text-navy-700">About WillItFly</h1>
      <div className="mt-6 space-y-6 font-body text-navy-600">
        <section>
          <h2 className="font-heading text-xl font-semibold text-navy-700">Governed destination answers</h2>
          <p className="mt-2">WillItFly presents practical destination information from reviewed Runtime records. Missing or unpublished information is not invented.</p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-navy-700">Know Before You Go</h2>
          <p className="mt-2">The aim is to make useful travel information easier to understand while keeping source evidence and review controls behind each published answer.</p>
        </section>
      </div>
    </section>
  );
}
