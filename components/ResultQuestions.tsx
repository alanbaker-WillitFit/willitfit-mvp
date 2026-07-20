import Link from "next/link";
import type { FitResult } from "@/types";
import { getResultQuestions } from "@/services/knowledge";

export default function ResultQuestions({ result }: { result: FitResult }) {
  const questions = getResultQuestions(result);
  if (questions.length === 0) return null;

  return (
    <section className="mt-6 border-t border-navy-100 pt-5" aria-labelledby="result-questions-heading">
      <h4 id="result-questions-heading" className="font-heading text-lg font-semibold text-navy-700">
        Before you go
      </h4>
      <p className="mt-1 font-body text-sm text-navy-500">
        A few checks based on this result and the selected allowance.
      </p>
      <div className="mt-3 grid gap-3">
        {questions.map((question) => (
          <Link
            key={question.routingId}
            href={question.destinationUrl}
            className="wf-interactive rounded-2xl border border-navy-100 bg-white p-4 hover:bg-navy-50"
          >
            <span className="block font-body font-semibold text-navy-700">{question.primaryQuestion}</span>
            <span className="mt-1 block font-body text-sm leading-relaxed text-navy-500">{question.quickAnswer}</span>
            <span className="mt-2 block font-body text-sm font-semibold text-green-700">{question.nextActionLabel} →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
