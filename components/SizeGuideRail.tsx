"use client";

import Link from "next/link";
import { useState } from "react";
import type { SizeGuideGroup } from "@/services/sizeGuides";

function AirlineList({ group }: { group: SizeGuideGroup }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? group.airlines : group.airlines.slice(0, 5);
  const remaining = Math.max(0, group.airlines.length - 5);

  return (
    <div className="mt-5 flex flex-1 flex-col">
      <ul className="space-y-2" aria-label={`Airlines using ${group.dimensions.heightCm} by ${group.dimensions.widthCm} by ${group.dimensions.depthCm} centimetres`}>
        {visible.map((airline) => (
          <li key={airline.airlineId}>
            <Link className="font-body text-sm font-semibold text-navy-600 underline decoration-navy-200 underline-offset-4 hover:text-green-600" href={`/airlines/${airline.slug}`}>{airline.airlineName}</Link>
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <button type="button" className="mt-auto pt-5 text-left font-body text-sm font-bold text-green-600 underline underline-offset-4" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Show less" : `+ ${remaining} more airlines`}
        </button>
      )}
    </div>
  );
}

export default function SizeGuideRail({ groups }: { groups: SizeGuideGroup[] }) {
  if (groups.length === 0) {
    return <div className="wf-card mt-8 min-h-[300px] p-6"><p className="font-body text-navy-500">No eligible published dimension groups are currently available.</p></div>;
  }

  return (
    <div className="mt-8 flex snap-x snap-mandatory items-start gap-5 overflow-x-auto pb-5" aria-label="Published baggage dimension groups">
      {groups.map((group) => (
        <article key={group.key} className="wf-card flex min-h-[300px] min-w-[84%] snap-start flex-col p-6 sm:min-w-[48%] lg:min-w-[calc((100%_-_2.5rem)/3)]">
          <p className="font-body text-xs font-bold uppercase tracking-wide text-green-600">{group.airlines.length} {group.airlines.length === 1 ? "airline" : "airlines"}</p>
          <h2 className="mt-2 min-h-[58px] font-heading text-2xl font-bold text-navy-700">{group.dimensions.heightCm} × {group.dimensions.widthCm} × {group.dimensions.depthCm} cm</h2>
          <p className="mt-3 min-h-[48px] font-body text-sm leading-6 text-navy-400">Height × width × depth</p>
          <AirlineList group={group} />
        </article>
      ))}
    </div>
  );
}
