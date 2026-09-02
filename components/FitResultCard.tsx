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

export function linearResultDetail(result: FitResult): string | null {
  if (result.sizingRule.method !== "linear-total" || result.linearMarginCm === null) {
    return null;
  }

  if (result.linearOperator === "lt" && result.linearMarginCm === 0) {
    return `Your combined total reaches ${result.linearLimitCm} cm, but this airline requires it to be under ${result.linearLimitCm} cm`;
  }

  if (result.linearMarginCm > 0) {
    return `${result.linearMarginCm} cm below the published total-size limit`;
  }

  if (result.linearMarginCm === 0) {
    return "Your combined total matches the published limit";
  }

  return `${Math.abs(result.linearMarginCm)} cm above the published total-size limit`;
}

export function linearMarginCopy(result: FitResult): string | null {
  if (result.sizingRule.method !== "linear-total" || result.linearMarginCm === null) {
    return null;
  }

  if (result.linearOperator === "lt" && result.linearMarginCm === 0) {
    return `Limit reached — must be under ${result.linearLimitCm} cm`;
  }

  return result.linearMarginCm >= 0
    ? `${result.linearMarginCm} cm below the limit`
    : `${Math.abs(result.linearMarginCm)} cm above the limit`;
}

function weightDetail(result: FitResult): string | null {
  if (result.userWeightKg === null || result.weightLimitKg === null) return null;
  const margin = Math.round((result.weightLimitKg - result.userWeightKg) * 10) / 10;
  if (margin < 0) return `${Math.abs(margin)} kg over the published weight limit`;
  if (margin === 0) return "Your bag matches the published weight limit";
  return `${margin} kg below the published weight limit`;
}

function resultDetail(result: FitResult) {
  const weight = weightDetail(result);
  if (result.sizingRule.method === "weight-only" && weight) return weight;
  if (result.weightVerdict === "no-fit" && weight) return weight;

  const linearDetail = linearResultDetail(result);
  if (linearDetail) return linearDetail;

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
  const weightOnly = result.sizingRule.method === "weight-only";
  const marginCopy = linearMarginCopy(result);

  return (
    <section aria-labelledby="fit-result-heading" aria-live="polite" className="wf-result-card">
      <div className="wf-result-status">
        <Icon />
        <div><p>{view.eyebrow}</p><h3 id="fit-result-heading">{view.title}</h3></div>
      </div>
      <div className="wf-result-copy">
        <strong>{weightOnly ? "Your checked bag meets the published weight rule" : view.lead}</strong>
        <p>{resultDetail(result)}</p>
      </div>

      {linear && result.bagType === "checkedBag" ? (
        <BagVisualizer
          bagType="checkedBag"
          verdict={result.verdict}
          dimensions={result.userDimensions}
          userWeightKg={result.userWeightKg}
          weightLimitKg={result.weightLimitKg}
          weightVerdict={result.weightVerdict}
        />
      ) : weightOnly ? (
        <BagVisualizer
          bagType="checkedBag"
          verdict={result.verdict}
          dimensions={result.userDimensions}
          userWeightKg={result.userWeightKg}
          weightLimitKg={result.weightLimitKg}
          weightVerdict={result.weightVerdict}
        />
      ) : result.orientationUsed && result.limit ? (
        <BagVisualizer
          bagType={result.bagType}
          verdict={result.verdict}
          dimensions={result.orientationUsed}
          limit={result.limit}
          userWeightKg={result.userWeightKg}
          weightLimitKg={result.weightLimitKg}
          weightVerdict={result.weightVerdict}
        />
      ) : null}

      <dl className="wf-result-facts">
        {!weightOnly && <div><dt>Your dimensions (including wheels &amp; handles)</dt><dd>{result.userDimensions.heightCm} × {result.userDimensions.widthCm} × {result.userDimensions.depthCm} cm</dd></div>}
        {linear ? (
          <>
            <div><dt>Combined total</dt><dd>{result.userDimensions.heightCm} + {result.userDimensions.widthCm} + {result.userDimensions.depthCm} = {result.userLinearTotalCm} cm</dd></div>
            <div><dt>Published total-size rule</dt><dd>{operatorCopy(result)} {result.linearLimitCm} cm</dd></div>
            {marginCopy && <div><dt>Margin</dt><dd>{marginCopy}</dd></div>}
          </>
        ) : result.limit ? (
          <>
            <div><dt>Airline allowance</dt><dd>{result.limit.heightCm} × {result.limit.widthCm} × {result.limit.depthCm} cm</dd></div>
            {result.orientationUsed ? ([
              ["Height", result.orientationUsed.heightCm, result.limit.heightCm],
              ["Width", result.orientationUsed.widthCm, result.limit.widthCm],
              ["Depth", result.orientationUsed.depthCm, result.limit.depthCm],
            ] as const).map(([label, entered, allowance]) => {
              const difference = Math.round((allowance - entered) * 10) / 10;
              return <div key={label}><dt>{label} margin</dt><dd>{entered} cm vs {allowance} cm · {difference >= 0 ? `${difference} cm spare` : `${Math.abs(difference)} cm over`}</dd></div>;
            }) : null}
          </>
        ) : null}
        {result.weightLimitKg !== null && <div><dt>Maximum published weight</dt><dd>{result.weightLimitKg} kg</dd></div>}
        {result.userWeightKg !== null && <div><dt>Your entered weight</dt><dd>{result.userWeightKg} kg</dd></div>}
      </dl>
      {linear && <p className="wf-result-notice"><span aria-hidden="true">i</span> This airline publishes a combined total rather than a fixed baggage box.</p>}
      {weightOnly && <p className="wf-result-notice"><span aria-hidden="true">i</span> This airline publishes a maximum checked-bag weight but no universal dimensions. Size restrictions may vary by aircraft, route or booking. Check your booking before travel.</p>}
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
