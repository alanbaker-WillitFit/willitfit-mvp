"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Airline } from "@/types";
import type { KnowledgeObject } from "@/services/knowledge";
import { scoreSearchFields } from "@/lib/searchRanking";

type SearchResult = { key: string; href: string; title: string; description: string; kind: "Airline" | "Answer"; score: number };

export default function AskWillItFitSearch({ items, airlines = [] }: { items: KnowledgeObject[]; airlines?: Airline[] }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
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
    return [...airlineResults, ...knowledge].filter((result) => !query.trim() || result.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);
  }, [airlines, items, query]);

  return (
    <div className="wf-card wf-card--large">
      <label htmlFor="ask-willitfit" className="font-heading text-xl font-semibold text-navy-700">What would you like to know?</label>
      <p className="mt-2 font-body text-sm text-navy-500">Start typing an airline, cabin bag, measuring or airport question.</p>
      <input id="ask-willitfit" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="For example: Ryanair wheels" autoComplete="off" aria-controls="ask-willitfit-results" className="wf-input mt-5 min-h-14 w-full border border-navy-200 bg-white px-4 py-3 font-body text-base text-navy-700 shadow-soft outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100" />
      <div id="ask-willitfit-results" className="mt-5" aria-live="polite">
        <p className="font-body text-xs font-semibold uppercase tracking-wide text-navy-400">{query.trim() ? "Suggested results" : "Popular questions"}</p>
        {results.length > 0 ? (
          <div className="mt-3 divide-y divide-navy-100 rounded-2xl border border-navy-100 bg-white">
            {results.map((result) => (
              <Link key={`${result.kind}-${result.key}`} href={result.href} className="wf-interactive block p-4 hover:bg-navy-50">
                <span className="font-body text-xs font-semibold uppercase tracking-wide text-green-700">{result.kind}</span>
                <span className="mt-1 block font-body font-semibold text-navy-700">{result.title}</span>
                <span className="mt-1 block font-body text-sm leading-relaxed text-navy-500">{result.description}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-navy-100 bg-navy-50 p-5"><p className="font-body font-semibold text-navy-700">We do not have that exact answer yet.</p><p className="mt-1 font-body text-sm text-navy-500">Try fewer words or check your bag against an airline allowance.</p><Link href="/#checker" className="mt-4 inline-block font-body text-sm font-semibold text-green-700 hover:underline">Check my bag instead →</Link></div>
        )}
      </div>
    </div>
  );
}
