"use client";

import { FitResult } from "@/types";
import { SuccessTick, ErrorCross, WarningExclamation } from "./StatusIcon";
import BagVisualizer from "./BagVisualizer";

const PRESENTATION = {
  fits: { eyebrow: "PASS", title: "Good to go", lead: "Your bag fits", Icon: SuccessTick },
  close: { eyebrow: "CLOSE FIT", title: "Check before you fly", lead: "Your bag is close to the limit", Icon: WarningExclamation },
  "no-fit": { eyebrow: "TOO LARGE", title: "Your bag does not fit", lead: "Your bag exceeds the allowance", Icon: ErrorCross },
} as const;

function resultDetail(result: FitResult) {
  if (result.verdict === "fits") {
    const spare = Math.min(...Object.values(result.spareCm).filter((value): value is number => typeof value === "number"));
    return spare > 0 ? `You have ${spare} cm to spare` : "Your bag matches the allowance exactly";
  }
  if (result.verdict === "close") return `Within ${result.withinCm} cm of the allowance`;
  const over = Math.max(...Object.values(result.overBy).filter((value): value is number => typeof value === "number"));
  return `${over} cm over the allowance`;
}

export default function FitResultCard({ result }: { result: FitResult }) {
  const view = PRESENTATION[result.verdict];
  const { Icon } = view;
  return (
    <section aria-labelledby="fit-result-heading" aria-live="polite" className="wf-result-card">
      <div className="wf-result-status">
        <Icon />
        <div><p>{view.eyebrow}</p><h3 id="fit-result-heading">{view.title}</h3></div>
      </div>
      <div className="wf-result-copy">
        <strong>{view.lead}</strong>
        <p>{resultDetail(result)}</p>
      </div>
      <BagVisualizer bagType={result.bagType} verdict={result.verdict} dimensions={result.userDimensions} />
      <dl className="wf-result-facts">
        <div><dt>Total dimensions (including wheels &amp; handles)</dt><dd>{result.userDimensions.heightCm} × {result.userDimensions.widthCm} × {result.userDimensions.depthCm} cm</dd></div>
        <div><dt>Airline allowance</dt><dd>{result.limit.heightCm} × {result.limit.widthCm} × {result.limit.depthCm} cm</dd></div>
        {result.weightLimitKg && <div><dt>Maximum published weight</dt><dd>{result.weightLimitKg} kg</dd></div>}
      </dl>
      <p className="wf-result-notice"><span aria-hidden="true">i</span> Always check {result.airline.airlineName}&apos;s latest rules before you fly.</p>
    </section>
  );
}
