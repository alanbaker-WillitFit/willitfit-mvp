import Link from "next/link";
import { Airline } from "@/types";
import { resolveLimit } from "@/lib/fitCalculator";
import { hasFareSpecificVariation } from "@/lib/allowanceSemantics";
import { ShieldCheckIcon } from "./icons";

interface AllowancePreviewProps {
  airline: Airline | null;
  bagType: "cabinBag" | "personalItem";
  fareClass?: string | null;
}

// Shows the selected airline's published allowance up front, before the
// person even submits the form — mirrors what they'd see on the airline's
// own site, so there's no surprise once they hit "Check my bag". Resolves
// to the specific fare class when one is picked. If published allowances vary,
// the preview fails closed until the traveller selects the fare or option on the booking.
export default function AllowancePreview({ airline, bagType, fareClass = null }: AllowancePreviewProps) {
  const bagLabel = bagType === "cabinBag" ? "Cabin Bag" : "Personal Item";

  if (!airline) {

    return (
      <div className="wf-card wf-card--compact flex h-full flex-col justify-center bg-navy-50 text-center">
        <p className="font-body text-sm text-navy-400">
          Pick an airline to see its {bagLabel.toLowerCase()} allowance here.
        </p>
      </div>
    );
  }

if (!fareClass && hasFareSpecificVariation(airline, bagType)) {
  return (
    <div className="wf-card wf-card--compact bg-amber-50">
      <p className="font-body text-xs font-semibold uppercase tracking-wide text-amber-700">Fare or option required</p>
      <p className="mt-2 font-body text-sm text-navy-600">This airline publishes different {bagLabel.toLowerCase()} allowances. Select the fare or option shown on your booking to see the applicable size and weight.</p>
    </div>
  );
}

const { sizingRule, fareClass: resolvedFareClass } = resolveLimit(airline, bagType, fareClass);

if (sizingRule.method !== "fixed-dimensions") {
  return null;
}

const limit = sizingRule.dimensions;
  return (
    <div className="wf-card wf-card--compact bg-navy-50">
      <p className="font-body text-xs font-semibold uppercase tracking-wide text-navy-400">
        Airline Allowance ({bagLabel})
      </p>

      <p className="mt-1 font-heading text-lg font-semibold text-navy-700">{airline.airlineName}</p>

      <div className="mt-3 flex items-start gap-2">
        <ShieldCheckIcon size={20} className="mt-0.5 shrink-0 text-green-600" />
        <p className="font-mono text-base font-semibold text-navy-700">
          {limit.heightCm} x {limit.widthCm} x {limit.depthCm} cm
        </p>
      </div>
      <p className="mt-1 font-body text-xs text-navy-400">
        {resolvedFareClass ? `${resolvedFareClass} allowance` : "Published allowance"} —
        including wheels and handles
      </p>

      <Link
        href={`/${airline.slug}`}
        className="mt-3 inline-block font-body text-sm font-semibold text-navy-700 hover:text-green-600"
      >
        View details & fees →
      </Link>
    </div>
  );
}
