"use client";

import { FitResult } from "@/types";
import { SuccessTick, ErrorCross, WarningExclamation } from "./StatusIcon";
import BagVisualizer from "./BagVisualizer";
import Link from "next/link";
import type { LabConfiguration } from "@/types";
import { selectLabInvitation } from "@/lib/lab";

const PRESENTATION = {
  fits: { eyebrow: "PASS", title: "Good to go", lead: "Your bag fits" },
  close: { eyebrow: "CLOSE FIT", title: "Check before you fly", lead: "Your bag is close to the limit" },
  "no-fit": { eyebrow: "TOO LARGE", title: "Your bag does not fit", lead: "Your bag exceeds the allowance" },
} as const;

const ICONS = {
  fits: SuccessTick,
  close: WarningExclamation,
  "no-fit": ErrorCross,
} as const;

function resultDetail(result: FitResult) {
  if (result.weightVerdict === "no-fit" && result.userWeightKg !== null && result.weightLimitKg !== null) {
    return `${Math.round((result.userWeightKg - result.weightLimitKg) * 10) / 10} kg over the published weight limit`;
  }

  if (result.sizingRule.method === "linear-total" && result.linearMarginCm !== null) {
    if (result.linearMarginCm > 0) return `${result.linearMarginCm} cm below the published total-size limit`;
    if (result.linearMarginCm === 0) {
      return result.linearOperator === "lte"
        ? "Your combined total matches the published limit"
        : "Your combined total equals a strict under-limit rule";
    }
    return `${Math.abs(result.linearMarginCm)} cm above the published total-size limit`;
  }

  if (result.verdict === "fits") {
    const spareValues = Object.values(result.spareCm).filter((value): value is number => typeof value === "number");
    const spare = spareValues.length ? Math.min(...spareValues) : 0;
    return spare > 0 ? `You have ${spare} cm to spare` : "Your bag matches the allowance exactly";
  }
  if (result.verdict === "close") return `Within ${result.withinCm} cm of the allowance`;
  const overValues = Object.values(result.overBy).filter((value): value is number => typeof value === "number");
  const over = overValues.length ? Math.max(...overValues) : 0;
  return over > 0 ? `${over} cm over the allowance` : "Your bag exceeds the published allowance";
}

function operatorCopy(result: FitResult): string {
  return result.linearOperator === "lte" ? "At or under" : "Under";
}

export default function FitResultCard({ result, labConfigs = [] }: { result: FitResult; labConfigs?: LabConfiguration[] }) {
  const view = PRESENTATION[result.verdict];
  const Icon = ICONS[result.verdict];
  const labInvitation = selectLabInvitation(labConfigs, result);
  const linear = result.sizingRule.method === "linear-total";

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

      {!linear && result.orientationUsed && result.limit && (
        <BagVisualizer
          bagType={result.bagType}
          verdict={result.verdict}
          dimensions={result.orientationUsed}
          limit={result.limit}
        />
      )}

      <dl className="wf-result-facts">
        <div><dt>Your dimensions (including wheels &amp; handles)</dt><dd>{result.userDimensions.heightCm} × {result.userDimensions.widthCm} × {result.userDimensions.depthCm} cm</dd></div>
        {linear ? (
          <>
            <div><dt>Combined total</dt><dd>{result.userDimensions.heightCm} + {result.userDimensions.widthCm} + {result.userDimensions.depthCm} = {result.userLinearTotalCm} cm</dd></div>
            <div><dt>Published total-size rule</dt><dd>{operatorCopy(result)} {result.linearLimitCm} cm</dd></div>
            {result.linearMarginCm !== null && (
              <div><dt>Margin</dt><dd>{result.linearMarginCm >= 0 ? `${result.linearMarginCm} cm below the limit` : `${Math.abs(result.linearMarginCm)} cm above the limit`}</dd></div>
            )}
          </>
        ) : result.limit ? (
          <div><dt>Airline allowance</dt><dd>{result.limit.heightCm} × {result.limit.widthCm} × {result.limit.depthCm} cm</dd></div>
        ) : null}
        {result.weightLimitKg !== null && <div><dt>Maximum published weight</dt><dd>{result.weightLimitKg} kg</dd></div>}
        {result.userWeightKg !== null && <div><dt>Your entered weight</dt><dd>{result.userWeightKg} kg</dd></div>}
      </dl>
      {linear && <p className="wf-result-notice"><span aria-hidden="true">i</span> This airline publishes a combined total rather than a fixed baggage box.</p>}
      <p className="wf-result-notice"><span aria-hidden="true">i</span> Always check {result.airline.airlineName}&apos;s latest rules before you fly.</p>
      {labInvitation && (
        <aside className="wf-lab-invitation">
          <strong>{labInvitation.invitationTitle}</strong>
          <p>{labInvitation.invitationBody}</p>
          <Link href={labInvitation.gamePath}>{labInvitation.cta} &rarr;</Link>
        </aside>
      )}
    </section>
  );
}
