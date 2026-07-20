"use client";

import { useEffect, useState } from "react";
import type { FitResult } from "@/types";
import type { RecommendationDecision } from "@/services/recommendations";
import AffiliateCard from "./AffiliateCard";

export default function ResultRecommendation({ result }: { result: FitResult }) {
  const [recommendation, setRecommendation] = useState<RecommendationDecision | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setRecommendation(null);

    fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result }),
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : { recommendation: null }))
      .then((payload: { recommendation?: RecommendationDecision | null }) => {
        setRecommendation(payload.recommendation ?? null);
      })
      .catch((error) => {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("[recommendations] client request failed", error);
        }
      });

    return () => controller.abort();
  }, [result]);

  if (!recommendation || recommendation.products.length === 0) return null;

  return (
    <section className="mt-6 border-t border-navy-100 pt-5" aria-labelledby="result-recommendation-heading">
      <h4 id="result-recommendation-heading" className="font-heading text-lg font-semibold text-navy-700">
        {recommendation.headline}
      </h4>
      <p className="mt-1 font-body text-sm text-navy-500">
        Selected because it addresses this result. The answer above is not influenced by commission.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {recommendation.products.map((product) => (
          <AffiliateCard key={product.affiliateId} link={{ ...product, status: "Live" }} ctaText={recommendation.ctaText} />
        ))}
      </div>
      <p className="mt-3 font-body text-xs text-navy-400">{recommendation.disclosure}</p>
    </section>
  );
}
