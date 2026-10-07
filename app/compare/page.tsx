import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Compare airline baggage allowances",
  description: "Compare cabin bag sizes, personal-item dimensions and checked-bag weights across published airline rules.",
  alternates: { canonical: siteUrl("/compare") },
};

const cards = [
  ["Cabin bag sizes", "/compare/cabin-bag-sizes", "Compare published cabin-bag dimensions by airline and fare."],
  ["Personal item sizes", "/compare/personal-item-sizes", "Compare under-seat and personal-item dimensions."],
  ["Checked baggage weights", "/compare/checked-bag-weights", "Compare published checked-bag weight limits by fare or option."],
  ["Exact size guides", "/sizes", "See which published airline rules use the same external dimensions."],
] as const;

export default function ComparePage() {
  return (
    <main className="wf-container wf-section">
      <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Compare</p>
      <h1 className="mt-2 font-heading text-4xl font-bold text-navy-700">Compare airline baggage allowances</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-navy-600">Start with the measurement or rule that matters to you, then open the airline and fare detail before relying on the result.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map(([title, href, body]) => (
          <Link key={href} href={href} className="wf-card p-6">
            <h2 className="font-heading text-xl font-semibold text-navy-700">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-navy-500">{body}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
