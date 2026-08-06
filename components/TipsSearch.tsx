"use client";

import { useMemo, useState } from "react";
import TravelTipCard from "@/components/TravelTipCard";
import type { TravelTip } from "@/types";

function searchableText(tip: TravelTip): string {
  return [
    tip.title,
    tip.content,
    tip.category,
    tip.seoKeyword,
    tip.focusAirline,
    tip.journeyStage,
    tip.resultContext,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function TipsSearch({ tips }: { tips: TravelTip[] }) {
  const [query, setQuery] = useState("");
  const normalisedQuery = query.trim().toLowerCase();

  const visibleTips = useMemo(() => {
    if (!normalisedQuery) return tips;
    return tips.filter((tip) => searchableText(tip).includes(normalisedQuery));
  }, [normalisedQuery, tips]);

  return (
    <>
      <div className="mt-6 max-w-xl">
        <label htmlFor="tips-search" className="font-body text-sm font-semibold text-navy-700">
          Search travel tips
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="tips-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search packing, batteries, liquids, airlines…"
            className="min-h-12 w-full rounded-xl border border-navy-100 bg-white px-4 font-body text-navy-700 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="min-h-12 rounded-xl border border-navy-100 bg-white px-4 font-body text-sm font-semibold text-navy-600 hover:bg-navy-50"
            >
              Clear
            </button>
          )}
        </div>
        <p className="mt-2 font-body text-xs text-navy-400" aria-live="polite">
          {visibleTips.length} {visibleTips.length === 1 ? "tip" : "tips"} found
        </p>
      </div>

      {visibleTips.length === 0 ? (
        <div className="wf-card mt-8 p-6">
          <h2 className="font-heading text-lg font-semibold text-navy-700">No matching tips</h2>
          <p className="mt-2 font-body text-sm text-navy-500">Try a broader term or clear the search.</p>
        </div>
      ) : (
        <div className="wf-grid-3 mt-8">
          {visibleTips.map((tip) => (
            <TravelTipCard key={tip.tipId} tip={tip} />
          ))}
        </div>
      )}
    </>
  );
}
