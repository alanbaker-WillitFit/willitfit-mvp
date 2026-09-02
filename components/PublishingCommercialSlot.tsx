import { getCommercialSnapshot } from "@/services/publishingData";
import type { PublishingPageType } from "@/lib/publishing/contracts";

export default async function PublishingCommercialSlot({
  pageType,
  entityId,
  slotId,
}: {
  pageType: PublishingPageType;
  entityId?: string;
  slotId: string;
}) {
  const snapshot = await getCommercialSnapshot();
  const placement = snapshot?.placements
    .filter((item) => item.active && item.brand === "WillItFit" && item.pageType === pageType)
    .filter((item) => !item.entityId || item.entityId === entityId)
    .filter((item) => item.commercialSlotId === slotId)
    .sort((left, right) => left.priority - right.priority)[0];

  if (!placement?.destinationUrl) return null;

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Sponsored travel option">
      {placement.sponsoredLabelRequired ? <p className="text-xs font-bold uppercase tracking-wide text-navy-400">Sponsored</p> : null}
      <p className="mt-2 font-heading text-lg font-semibold text-navy-900">{placement.category || "Travel option"}</p>
      <a href={placement.destinationUrl} rel="noopener noreferrer sponsored" className="mt-3 inline-flex min-h-11 items-center font-semibold text-blue-700 underline-offset-4 hover:underline">View option →</a>
    </aside>
  );
}
