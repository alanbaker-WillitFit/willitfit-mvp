import type { Metadata } from "next";
import Link from "next/link";
import { getSizeGroups } from "@/services/baggageKnowledge";
import { siteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Baggage size guides and airline comparisons",
  description: "Browse common cabin bag and personal-item dimensions and see which published airline rules use each size.",
  alternates: { canonical: siteUrl("/sizes") },
};

export default function SizesIndexPage() {
  const groups = getSizeGroups();
  return (
    <main className="wf-container wf-section">
      <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Size guides</p>
      <h1 className="mt-2 font-heading text-4xl font-bold text-navy-700">Compare baggage sizes across airlines</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-navy-600">Each page groups published airline rules that use the same external dimensions. Fare conditions and weight limits still apply, so use the comparison as a starting point rather than a universal allowance.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(group => (
          <Link key={group.key} href={`/sizes/${group.key}`} className="wf-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{group.bagType}</p>
            <h2 className="mt-1 font-heading text-xl font-semibold text-navy-700">{group.label}</h2>
            <p className="mt-2 text-sm text-navy-500">{group.rules.length} published rule{group.rules.length === 1 ? "" : "s"}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
