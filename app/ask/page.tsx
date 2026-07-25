import Link from "next/link";
import type { Metadata } from "next";
import AskWillItFitSearch from "@/components/AskWillItFitSearch";
import { getAirlines } from "@/services/airlines";
import { getFaqs } from "@/services/faqs";

export const metadata: Metadata = {
  title: "Ask WillitFit",
  description: "Search WillitFit's focused travel knowledge for cabin bag, airline allowance, measuring and airport questions.",
};

export default async function AskWillItFitPage() {
  const [{ airlines }, { content: faqs }] = await Promise.all([
    getAirlines(),
    getFaqs(),
  ]);
  return (
    <>
      <section className="bg-navy-700">
        <div className="wf-container py-12 sm:py-16">
          <p className="font-body text-sm font-semibold uppercase tracking-wide text-green-400">Ask WillitFit</p>
          <h1 className="mt-2 max-w-3xl font-heading text-4xl font-bold leading-tight text-white sm:text-5xl">
            Start with your question.
          </h1>
          <p className="mt-4 max-w-2xl font-body text-lg leading-relaxed text-navy-100">
            Find a focused answer from the travel knowledge WillitFit has researched and chosen to publish.
          </p>
        </div>
      </section>
      <div className="wf-container wf-layout-home -mt-8 grid gap-8">
        <div className="min-w-0"><AskWillItFitSearch airlines={airlines} faqs={faqs} /></div>
        <aside className="wf-card wf-card--compact self-start">
          <h2 className="font-heading text-base font-semibold text-navy-700">Prefer to check a bag?</h2>
          <p className="mt-2 font-body text-sm leading-relaxed text-navy-500">Enter your measurements and compare them with the selected airline allowance.</p>
          <Link href="/#checker" className="wf-btn-cta mt-5 inline-block px-5 py-2.5 font-body text-sm">Check my bag</Link>
        </aside>
      </div>
    </>
  );
}
