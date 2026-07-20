import Link from "next/link";
import { WarningExclamation, ErrorCross } from "./StatusIcon";

// Evergreen educational content — not tied to a live fit result. Sits
// alongside the checker so first-time visitors understand the "close" and
// "no-fit" states before they ever run a check.
export default function AdvisoryPanels() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="wf-card wf-card--compact border-l-4 border-amber-500 bg-amber-50/60">
        <div className="flex items-center gap-2">
          <WarningExclamation size={20} />
          <h3 className="font-heading text-sm font-semibold text-navy-700">Close to the Limit?</h3>
        </div>
        <p className="mt-2 font-body text-sm text-navy-600">
          If your bag is soft or overpacked, it may not fit in the sizer. Pack smart and travel
          with peace of mind.
        </p>
        <Link href="/tips" className="mt-3 inline-block font-body text-sm font-semibold text-navy-700 hover:text-green-600">
          View packing tips →
        </Link>
      </div>

      <div className="wf-card wf-card--compact border-l-4 border-red-500 bg-red-50/60">
        <div className="flex items-center gap-2">
          <ErrorCross size={20} />
          <h3 className="font-heading text-sm font-semibold text-navy-700">Too Large?</h3>
        </div>
        <p className="mt-2 font-body text-sm text-navy-600">
          Your bag exceeds the allowance. You may be charged at the gate.
        </p>
        <Link href="/#recommended" className="mt-3 inline-block font-body text-sm font-semibold text-navy-700 hover:text-green-600">
          See replacement bags →
        </Link>
      </div>
    </div>
  );
}
