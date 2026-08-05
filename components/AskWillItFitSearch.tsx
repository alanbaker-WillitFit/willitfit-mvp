"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Airline, RuntimeContentRecord, TravelTip } from "@/types";
import type { KnowledgeObject } from "@/services/knowledge";
import { scoreSearchFields } from "@/lib/searchRanking";

type SearchResult = {
  key: string;
  href?: string;
  title: string;
  description: string;
  kind: "Airline" | "Answer" | "Tip";
  score: number;
};

export default function AskWillItFitSearch({
  items = [],
  airlines = [],
  faqs = [],
  tips = [],
}: {
  items?: KnowledgeObject[];
  airlines?: Airline[];
  faqs?: RuntimeContentRecord[];
  tips?: TravelTip[];
}) {
  const [query, setQuery] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [submissionMessage, setSubmissionMessage] = useState("");

  const results = useMemo(() => {
    const faqResults: SearchResult[] = faqs.map((faq) => ({
      key: faq.contentId,
      title: faq.title,
      description: faq.body,
      kind: "Answer",
      score: query.trim()
        ? scoreSearchFields(query, [
            { value: faq.title, weight: 3 },
            { value: faq.body, weight: 2 },
            { value: faq.supportingText, weight: 1 },
          ])
        : Math.max(0, 1000 - faq.displayOrder),
    }));
    const tipResults: SearchResult[] = tips.map((tip) => ({
      key: tip.tipId,
      href: `/travel-tips/${tip.slug}`,
      title: tip.title,
      description: tip.content,
      kind: "Tip",
      score: query.trim()
        ? scoreSearchFields(query, [
            { value: tip.title, weight: 3 },
            { value: tip.content, weight: 2 },
            { value: tip.seoKeyword, weight: 1 },
          ])
        : 0,
    }));
    const knowledge: SearchResult[] = items.map((item) => ({
      key: item.knowledgeId,
      href: `/ask/${item.slug}`,
      title: item.primaryQuestion,
      description: item.quickAnswer,
      kind: "Answer",
      score: query.trim() ? scoreSearchFields(query, [
        { value: item.primaryQuestion, weight: 3 },
        { value: item.alternativeQuestions.join(" "), weight: 2 },
        { value: item.searchTerms.join(" "), weight: 1 },
      ]) : item.priority / 100,
    }));
    const airlineResults: SearchResult[] = query.trim() ? airlines.map((airline) => ({
      key: airline.airlineId,
      href: `/${airline.slug}`,
      title: airline.airlineName,
      description: `View baggage allowances for ${airline.airlineName}.`,
      kind: "Airline",
      score: scoreSearchFields(query, [
        { value: airline.airlineName, weight: 4 },
        { value: airline.country, weight: 1 },
      ]),
    })) : [];

    return [...airlineResults, ...faqResults, ...tipResults, ...knowledge]
      .filter((result) => !query.trim() || result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [airlines, faqs, items, query, tips]);

  const hasUsefulMatch = query.trim().length > 0 && results.some((result) => result.score >= 2);
  const canSubmitQuestion = query.trim().length >= 12 && !hasUsefulMatch;

  async function submitQuestion(event: React.FormEvent) {
    event.preventDefault();
    setSubmissionStatus("sending");
    setSubmissionMessage("");
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "question", question: query, website: "" }),
    });
    const payload = await response.json() as { ok?: boolean; id?: string; error?: string };
    if (!response.ok || !payload.ok) {
      setSubmissionStatus("error");
      setSubmissionMessage(payload.error || "Your question could not be submitted.");
      return;
    }
    setSubmissionStatus("sent");
    setSubmissionMessage(`Question ${payload.id} has been received for private review.`);
  }

  return (
    <div className="wf-card wf-card--large">
      <label htmlFor="ask-willitfit" className="font-heading text-xl font-semibold text-navy-700">
        What would you like to know?
      </label>
      <p className="mt-2 font-body text-sm text-navy-500">
        Start typing an airline, baggage, measuring, packing or airport question.
      </p>
      <input
        id="ask-willitfit"
        type="search"
        value={query}
        onChange={(event) => { setQuery(event.target.value); setSubmissionStatus("idle"); setSubmissionMessage(""); }}
        placeholder="For example: Ryanair wheels"
        autoComplete="off"
        aria-controls="ask-willitfit-results"
        className="wf-input mt-5 min-h-14 w-full border border-navy-200 bg-white px-4 py-3 font-body text-base text-navy-700 shadow-soft outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
      />

      <div id="ask-willitfit-results" className="mt-5" aria-live="polite">
        <p className="font-body text-xs font-semibold uppercase tracking-wide text-navy-400">
          {query.trim() ? "Suggested results" : "Popular questions"}
        </p>
        {results.length > 0 ? (
          <div className="mt-3 divide-y divide-navy-100 rounded-2xl border border-navy-100 bg-white">
            {results.map((result) => result.href ? (
              <Link key={`${result.kind}-${result.key}`} href={result.href} className="wf-interactive block p-4 hover:bg-navy-50">
                <span className="font-body text-xs font-semibold uppercase tracking-wide text-green-700">{result.kind}</span>
                <span className="mt-1 block font-body font-semibold text-navy-700">{result.title}</span>
                <span className="mt-1 block line-clamp-3 font-body text-sm leading-relaxed text-navy-500">{result.description}</span>
              </Link>
            ) : (
              <article key={`${result.kind}-${result.key}`} className="p-4">
                <span className="font-body text-xs font-semibold uppercase tracking-wide text-green-700">{result.kind}</span>
                <h2 className="mt-1 font-body font-semibold text-navy-700">{result.title}</h2>
                <p className="mt-1 font-body text-sm leading-relaxed text-navy-500">{result.description}</p>
              </article>
            ))}
          </div>
        ) : query.trim() ? (
          <div className="mt-3 rounded-2xl border border-navy-100 bg-navy-50 p-5">
            <p className="font-body font-semibold text-navy-700">We do not have that exact answer yet.</p>
            <p className="mt-1 font-body text-sm text-navy-500">Your question can be sent to WillItFit for private review.</p>
          </div>
        ) : null}
      </div>

      {query.trim() && !hasUsefulMatch && (
        <form onSubmit={submitQuestion} className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5">
          <h2 className="font-heading text-lg font-semibold text-navy-700">Ask WillItFit</h2>
          <p className="mt-2 font-body text-sm leading-relaxed text-navy-500">
            Your question will enter a private review queue. It will not be published automatically. Please remove names, contact details, booking references and other personal information.
          </p>
          <p className="mt-3 rounded-xl bg-white p-3 font-body text-sm text-navy-700">{query}</p>
          {submissionMessage && (
            <p className={`mt-3 font-body text-sm ${submissionStatus === "error" ? "text-red-700" : "text-green-700"}`}>
              {submissionMessage}
            </p>
          )}
          <button type="submit" disabled={!canSubmitQuestion || submissionStatus === "sending" || submissionStatus === "sent"} className="wf-btn-cta mt-4 px-5 py-2.5 font-body text-sm disabled:opacity-60">
            {submissionStatus === "sending" ? "Submitting…" : submissionStatus === "sent" ? "Submitted" : "Submit question for review"}
          </button>
        </form>
      )}
    </div>
  );
}
