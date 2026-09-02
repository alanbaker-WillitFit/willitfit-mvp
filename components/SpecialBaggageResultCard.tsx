"use client";

import Image from "next/image";
import type { Airline, SpecialBaggageResult } from "@/types";

const HERO = "/assets/special-baggage/advanced-oversized-baggage-hero-rc5.webp";

export default function SpecialBaggageResultCard({
  airline,
  result,
}: {
  airline: Airline;
  result: SpecialBaggageResult;
}) {
  return (
    <section aria-labelledby="special-baggage-result-heading" aria-live="polite" className="wf-result-card wf-special-result-card">
      <div className="wf-result-status">
        <span className="wf-special-result-card__status" aria-hidden="true">✓</span>
        <div>
          <p>SPECIAL BAGGAGE</p>
          <h3 id="special-baggage-result-heading">Check before you fly</h3>
        </div>
      </div>

      <div className="wf-result-copy">
        <strong>{result.title}</strong>
        <p>{result.summary}</p>
      </div>

      <figure className="wf-special-result-card__hero">
        <Image
          src={HERO}
          alt={`${result.title} special baggage guidance`}
          width={1200}
          height={675}
          sizes="(max-width: 767px) 92vw, 420px"
          priority
        />
      </figure>

      <dl className="wf-result-facts">
        <div><dt>Airline</dt><dd>{airline.airlineName}</dd></div>
        <div><dt>Category</dt><dd>{result.category || result.title}</dd></div>
        {result.preparationGuidance && <div><dt>Prepare</dt><dd>{result.preparationGuidance}</dd></div>}
        {result.feeGuidance && <div><dt>Fees and booking</dt><dd>{result.feeGuidance}</dd></div>}
        {result.mobilityOrMedical && <div><dt>Accessibility</dt><dd>Contact the airline before travel to confirm assistance and carriage arrangements.</dd></div>}
      </dl>

      {result.policyLinkSource.startsWith("https://") && (
        <p className="wf-result-notice">
          <span aria-hidden="true">i</span>{" "}
          <a href={result.policyLinkSource} target="_blank" rel="noopener noreferrer">
            {result.policyLinkLabel || "Read the airline policy"}
          </a>
        </p>
      )}
      <p className="wf-result-notice"><span aria-hidden="true">i</span> Always confirm special-baggage arrangements with {airline.airlineName} before you travel.</p>
    </section>
  );
}
