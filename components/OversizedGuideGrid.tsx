"use client";

import { useState } from "react";
import type { SpecialBaggageResult } from "@/types";

function adviceItems(item: SpecialBaggageResult): string[] {
  return [item.summary, item.preparationGuidance, item.feeGuidance, item.notes]
    .map((value) => value.trim())
    .filter(Boolean);
}

export default function OversizedGuideGrid({ items }: { items: SpecialBaggageResult[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="wf-card mt-8 min-h-[260px] p-6">
        <p className="font-body text-navy-500">Oversized baggage guidance is temporarily unavailable. Check your airline directly before travel.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const expanded = openId === item.resultId;
        const advice = adviceItems(item);
        return (
          <article key={item.resultId} className="wf-card flex min-h-[300px] flex-col p-6">
            <p className="font-body text-xs font-bold uppercase tracking-wide text-green-600">Oversized baggage</p>
            <h2 className="mt-2 min-h-[58px] font-heading text-2xl font-bold text-navy-700">{item.title || item.category}</h2>
            <p className="mt-3 min-h-[72px] font-body text-sm leading-6 text-navy-500">{item.summary}</p>

            {expanded ? (
              <div className="mt-5 border-t border-navy-100 pt-5">
                <ul className="space-y-3">
                  {advice.slice(1).map((adviceItem, index) => (
                    <li key={`${item.resultId}-${index}`} className="font-body text-sm leading-6 text-navy-500">• {adviceItem}</li>
                  ))}
                </ul>
                <p className="mt-5 font-body text-sm font-semibold leading-6 text-navy-600">
                  Policies, charges and handling requirements vary. Check your booking and contact the airline before travelling.
                </p>
              </div>
            ) : null}

            <button
              type="button"
              className="mt-auto pt-6 text-left font-body text-sm font-bold text-green-600 underline underline-offset-4"
              aria-expanded={expanded}
              onClick={() => setOpenId(expanded ? null : item.resultId)}
            >
              {expanded ? "Show less" : "View brief advice"}
            </button>
          </article>
        );
      })}
    </div>
  );
}
