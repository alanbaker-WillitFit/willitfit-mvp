import { FitResult } from "@/types";
import { VERDICT_COPY } from "@/lib/fitCalculator";
import { cn } from "@/lib/utils";
import BagVisualizer from "./BagVisualizer";

const TONE_STYLES = {
  good: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
  warn: { bg: "bg-amber-100", border: "border-amber-500/30", text: "text-amber-700" },
  bad: { bg: "bg-coral-100", border: "border-coral-500/30", text: "text-coral-700" },
};

export default function FitResultCard({ result }: { result: FitResult }) {
  const { airline, bagType, userDimensions, verdict, overBy, withinCm } = result;
  const limit = bagType === "cabinBag" ? airline.cabinBag : airline.personalItem;
  const copy = VERDICT_COPY[verdict];
  const tone = TONE_STYLES[copy.tone];

  return (
    <div
      className={cn(
        "animate-fade-up rounded-card border bg-white p-6 shadow-soft sm:p-8",
        tone.border
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className={cn("inline-flex items-center rounded-full px-3 py-1 font-body text-sm font-semibold", tone.bg, tone.text)}>
            {copy.label}
          </span>
          <h3 className="mt-3 font-heading text-xl font-semibold text-navy-700">
            {airline.airlineName} — {bagType === "cabinBag" ? "Cabin bag" : "Personal item"}
          </h3>
          <p className="mt-1 font-body text-sm text-navy-400">
            Allowance: <span className="font-mono">{limit.heightCm} × {limit.widthCm} × {limit.depthCm} cm</span>
            {airline.weightLimitKg ? <> · max <span className="font-mono">{airline.weightLimitKg} kg</span></> : null}
          </p>

          <p className="mt-4 font-body text-sm text-navy-600">
            {verdict === "fits" && "Your bag is within the allowance for this airline. Safe to pack."}
            {verdict === "close" &&
              `Your bag is within ${withinCm} cm of the limit. Soft-sided bags can compress — measure at the fullest point before you fly.`}
            {verdict === "no-fit" &&
              "Your bag exceeds the allowance on at least one dimension. It may be gate-checked or charged as an extra bag."}
          </p>

          {verdict === "no-fit" && overBy && Object.keys(overBy).length > 0 && (
            <dl className="mt-4 flex flex-wrap gap-4 font-mono text-sm text-coral-700">
              {overBy.heightCm !== undefined && (
                <div><dt className="inline text-navy-400">Height +</dt> <dd className="inline">{overBy.heightCm} cm</dd></div>
              )}
              {overBy.widthCm !== undefined && (
                <div><dt className="inline text-navy-400">Width +</dt> <dd className="inline">{overBy.widthCm} cm</dd></div>
              )}
              {overBy.depthCm !== undefined && (
                <div><dt className="inline text-navy-400">Depth +</dt> <dd className="inline">{overBy.depthCm} cm</dd></div>
              )}
            </dl>
          )}

          <p className="mt-4 font-mono text-xs text-navy-300">
            Your bag: {userDimensions.heightCm} × {userDimensions.widthCm} × {userDimensions.depthCm} cm
          </p>
        </div>

        <div className="flex shrink-0 justify-center">
          <BagVisualizer userDimensions={result.orientationUsed} limit={limit} verdict={verdict} />
        </div>
      </div>
    </div>
  );
}
