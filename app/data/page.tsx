import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  alternates: { canonical: "/data" }, title: "Baggage data", description: "Explore governed airline baggage data and routes used by WillItFit." };
export default function DataPage(){return <section className="wf-container wf-container--narrow wf-section"><h1 className="font-heading text-3xl font-semibold text-navy-700">Baggage data</h1><p className="mt-4 font-body text-navy-600">WillItFit publishes traveller-facing routes from governed airline allowance evidence. Data that has not passed review stays unpublished.</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><Link className="wf-card p-5" href="/airlines"><strong>Airline allowances</strong><p>Browse published airline baggage rules.</p></Link><Link className="wf-card p-5" href="/ask"><strong>Question data</strong><p>Browse evidence-led baggage answers.</p></Link></div></section>}
