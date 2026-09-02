import type { AviationFreshnessState } from "@/lib/publishing/contracts";

type LiveStatusBannerProps = {
  freshness: AviationFreshnessState;
  lastCheckedAt?: string;
  lastMaterialChangeAt?: string;
};

const COPY: Record<AviationFreshnessState, { label: string; detail: string; className: string }> = {
  LIVE: {
    label: "Live",
    detail: "Operational information is current.",
    className: "border-green-200 bg-green-50 text-green-900",
  },
  DELAYED: {
    label: "Updates delayed",
    detail: "The latest operational update is running behind schedule.",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  UNAVAILABLE: {
    label: "Live information unavailable",
    detail: "Current counts are suppressed until a fresh operational update is available.",
    className: "border-slate-200 bg-slate-50 text-navy-800",
  },
};

export default function LiveStatusBanner({ freshness, lastCheckedAt, lastMaterialChangeAt }: LiveStatusBannerProps) {
  const state = COPY[freshness];

  return (
    <section className={`rounded-xl border px-4 py-4 sm:px-5 ${state.className}`} aria-live="polite">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold">{state.label}</p>
          <p className="mt-1 text-sm">{state.detail}</p>
        </div>
        {(lastCheckedAt || lastMaterialChangeAt) && (
          <dl className="grid shrink-0 gap-1 text-xs sm:text-right">
            {lastCheckedAt && (
              <div><dt className="inline font-semibold">Last checked: </dt><dd className="inline">{lastCheckedAt}</dd></div>
            )}
            {lastMaterialChangeAt && (
              <div><dt className="inline font-semibold">Last changed: </dt><dd className="inline">{lastMaterialChangeAt}</dd></div>
            )}
          </dl>
        )}
      </div>
    </section>
  );
}
