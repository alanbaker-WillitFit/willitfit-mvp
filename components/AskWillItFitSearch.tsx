"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { Airline, RuntimeContentRecord } from "@/types";
import type { KnowledgeObject } from "@/services/knowledge";
import { scoreSearchFields } from "@/lib/searchRanking";

type SearchResult = { key: string; href?: string; title: string; description: string; kind: "Airline" | "Answer"; score: number };
type SubmitState = "idle" | "sending" | "sent" | "error";

export default function AskWillItFitSearch({
  items = [],
  airlines = [],
  faqs = [],
}: {
  items?: KnowledgeObject[];
  airlines?: Airline[];
  faqs?: RuntimeContentRecord[];
}) {
  const [query, setQuery] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitMessage, setSubmitMessage] = useState("");

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
    const knowledge: SearchResult[] = items.map((item) => ({
      key: item.knowledgeId, href: `/ask/${item.slug}`, title: item.primaryQuestion,
      description: item.quickAnswer, kind: "Answer",
      score: query.trim() ? scoreSearchFields(query, [
        { value: item.primaryQuestion, weight: 3 },
        { value: item.alternativeQuestions.join(" "), weight: 2 },
        { value: item.searchTerms.join(" "), weight: 1 },
      ]) : item.priority / 100,
    }));
    const airlineResults: SearchResult[] = query.trim() ? airlines.map((airline) => ({
      key: airline.airlineId, href: `/${airline.slug}`, title: airline.airlineName,
      description: `View cabin bag and personal item allowances for ${airline.airlineName}.`, kind: "Airline",
      score: scoreSearchFields(query, [{ value: airline.airlineName, weight: 4 }, { value: airline.country, weight: 1 }]),
    })) : [];
    return [...airlineResults, ...faqResults, ...knowledge]
      .filter((result) => !query.trim() || result.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [airlines, faqs, items, query]);

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = query.trim();
    if (question.length < 4 || submitState === "sending") return;

    setSubmitState("sending");
    setSubmitMessage("");
    try {
      const response = await fetch("/api/customer-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          source_page: typeof window !== "undefined" ? window.location.pathname : "/ask",
        }),
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Unable to submit question");
      setSubmitState("sent");
      setSubmitMessage("Thanks. We have added your question for review.");
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(error instanceof Error ? error.message : "We could not add that question for review just now.");
    }
  }

  return (
    <div className="wf-card wf-card--large">
      <label htmlFor="ask-willitfit" className="font-heading text-xl font-semibold text-navy-700">What would you like to know?</label>
      <p className="mt-2 font-body text-sm text-navy-500">Start typing an airline, cabin bag, measuring or airport question.</p>
      <input
        id="ask-willitfit"
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          if (submitState !== "idle") {
            setSubmitState("idle");
            setSubmitMessage("");
          }
        }}
        placeholder="For example: Ryanair wheels"
        autoComplete="off"
        aria-controls="ask-willitfit-results"
        className="wf-input mt-5 min-h-14 w-full border border-navy-200 bg-white px-4 py-3 font-body text-base text-navy-700 shadow-soft outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
      />
      <div id="ask-willitfit-results" className="mt-5" aria-live="polite">
        <p className="font-body text-xs font-semibold uppercase tracking-wide text-navy-400">{query.trim() ? "Suggested results" : "Popular questions"}</p>
        {results.length > 0 ? (
          <div className="mt-3 divide-y divide-navy-100 rounded-2xl border border-navy-100 bg-white">
            {results.map((result) => result.href ? (
              <Link key={`${result.kind}-${result.key}`} href={result.href} className="wf-interactive block p-4 hover:bg-navy-50">
                <span className="font-body text-xs font-semibold uppercase tracking-wide text-green-700">{result.kind}</span>
                <span className="mt-1 block font-body font-semibold text-navy-700">{result.title}</span>
                <span className="mt-1 block font-body text-sm leading-relaxed text-navy-500">{result.description}</span>
              </Link>
            ) : (
              <article key={`${result.kind}-${result.key}`} className="p-4">
                <span className="font-body text-xs font-semibold uppercase tracking-wide text-green-700">{result.kind}</span>
                <h2 className="mt-1 font-body font-semibold text-navy-700">{result.title}</h2>
                <p className="mt-1 font-body text-sm leading-relaxed text-navy-500">{result.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-navy-100 bg-navy-50 p-5">
            <p className="font-body font-semibold text-navy-700">We do not have that exact answer yet.</p>
            <p className="mt-1 font-body text-sm leading-relaxed text-navy-500">You can send the question to WillItFit for review. It will not publish automatically.</p>
            {query.trim().length >= 4 && submitState !== "sent" ? (
              <form onSubmit={submitQuestion} className="mt-4">
                <button type="submit" disabled={submitState === "sending"} className="wf-btn-cta px-5 py-2.5 font-body text-sm disabled:cursor-wait disabled:opacity-60">
                  {submitState === "sending" ? "Adding for review…" : "Send this question for review"}
                </button>
              </form>
            ) : null}
            {submitMessage ? (
              <p className={`mt-4 font-body text-sm ${submitState === "sent" ? "font-semibold text-green-700" : "text-red-700"}`} role="status">{submitMessage}</p>
            ) : null}
            <Link href="/#checker" className="mt-4 inline-block font-body text-sm font-semibold text-green-700 hover:underline">Check my bag instead →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
