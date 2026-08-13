import Link from "next/link";
import type { Metadata } from "next";
import AskWillItFitSearch from "@/components/AskWillItFitSearch";
import AskOpenQuestions from "@/components/AskOpenQuestions";
import { getAirlines } from "@/services/airlines";
import { getFaqs } from "@/services/faqs";
import { getTravelTips } from "@/services/tips";
import { getOpenQuestions } from "@/services/askWillItFit";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "FAQs / People often ask | WillItFit",
  description: "Browse reviewed questions people often ask, search WillItFit's travel knowledge, or submit a question privately for moderation.",
};

export default async function AskWillItFitPage() {
  const [{ airlines }, { content: faqs }, { tips }, openQuestions] = await Promise.all([
    getAirlines(),
    getFaqs(),
    getTravelTips(),
    getOpenQuestions(),
  ]);

  return (
    <>
      <section className="bg-navy-700">
        <div className="wf-container py-12 sm:py-16">
          <p className="font-body text-sm font-semibold uppercase tracking-wide text-green-400">FAQs / People often ask</p>
          <h1 className="mt-2 max-w-3xl font-heading text-4xl font-bold leading-tight text-white sm:text-5xl">
            Start with your question.
          </h1>
          <p className="mt-4 max-w-2xl font-body text-lg leading-relaxed text-navy-100">
            Search reviewed FAQs and travel tips first. Unanswered questions and suggested answers enter a private moderation queue—nothing is published automatically.
          </p>
        </div>
      </section>

      <div className="wf-container wf-layout-home -mt-8 grid gap-8">
        <div className="min-w-0">
          <AskWillItFitSearch airlines={airlines} faqs={faqs} tips={tips} />
        </div>

        <div className="space-y-5 self-start">
          <aside className="wf-card wf-card--compact">
            <h2 className="font-heading text-base font-semibold text-navy-700">Prefer to check a bag?</h2>
            <p className="mt-2 font-body text-sm leading-relaxed text-navy-500">
              Enter your measurements and compare them with the selected airline allowance.
            </p>
            <Link href="/#checker" className="wf-btn-cta mt-5 inline-block px-5 py-2.5 font-body text-sm">
              Check my bag
            </Link>
          </aside>
          <AskOpenQuestions questions={openQuestions} />
        </div>
      </div>
    </>
  );
}
