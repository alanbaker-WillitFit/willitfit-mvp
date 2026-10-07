import Link from "next/link";
import type { Airline } from "@/types";
import type { AirlineRuleDetail } from "@/services/airlineRuleDetails";

function dims(rule: AirlineRuleDetail): string {
  return rule.lengthCm && rule.widthCm && rule.depthCm
    ? `${rule.lengthCm} × ${rule.widthCm} × ${rule.depthCm} cm`
    : rule.linearSizeCm ? `${rule.linearSizeCm} cm linear size` : "Not published";
}
function value(v: string): string { return v || "Not stated"; }

export default function AirlineRuleEvidence({ airline, rules }: { airline: Airline; rules: AirlineRuleDetail[] }) {
  if (!rules.length) return null;
  const bagTypes = Array.from(new Set(rules.map((r) => r.bagType)));
  const fares = Array.from(new Set(rules.map((r) => r.fare).filter(Boolean)));
  const latest = rules.map((r) => r.lastChecked).filter(Boolean).sort().at(-1) || airline.lastUpdated;

  return (
    <section className="mt-10" aria-labelledby="rule-evidence-heading">
      <div className="wf-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-wide text-green-700">Governed baggage evidence</p>
            <h2 id="rule-evidence-heading" className="mt-1 font-heading text-xl font-semibold text-navy-700">{airline.airlineName} rule detail</h2>
            <p className="mt-2 max-w-3xl font-body text-sm leading-6 text-navy-500">Published rule rows are shown separately so fare and bag-type differences are visible rather than flattened into one allowance.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-navy-50 px-3 py-2"><strong className="block text-navy-700">{rules.length}</strong><span className="text-xs text-navy-400">rules</span></div>
            <div className="rounded-xl bg-navy-50 px-3 py-2"><strong className="block text-navy-700">{bagTypes.length}</strong><span className="text-xs text-navy-400">bag types</span></div>
            <div className="rounded-xl bg-navy-50 px-3 py-2"><strong className="block text-navy-700">{fares.length || 1}</strong><span className="text-xs text-navy-400">fares/options</span></div>
          </div>
        </div>
        {latest && <p className="mt-3 font-body text-xs text-navy-400">Latest published review in this rule set: {latest}</p>}
      </div>

      <div className="mt-4 space-y-4">
        {rules.map((rule) => (
          <article key={rule.ruleId} className="wf-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-body text-xs font-semibold uppercase tracking-wide text-green-700">{rule.bagType}</p>
                <h3 className="mt-1 font-heading text-lg font-semibold text-navy-700">{rule.fare || "General allowance"}</h3>
              </div>
              <code className="rounded bg-navy-50 px-2 py-1 text-xs text-navy-400">{rule.ruleId}</code>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div><dt className="text-xs text-navy-300">Size</dt><dd className="mt-1 font-mono text-sm text-navy-700">{dims(rule)}</dd></div>
              <div><dt className="text-xs text-navy-300">Weight</dt><dd className="mt-1 text-sm text-navy-700">{rule.weightKg ? `${rule.weightKg} kg` : "Not published"}</dd></div>
              <div><dt className="text-xs text-navy-300">Sizing method</dt><dd className="mt-1 text-sm text-navy-700">{value(rule.sizingMethod)}</dd></div>
              <div><dt className="text-xs text-navy-300">Limit</dt><dd className="mt-1 text-sm text-navy-700">{value(rule.limitOperator)}</dd></div>
              <div><dt className="text-xs text-navy-300">Wheels included</dt><dd className="mt-1 text-sm text-navy-700">{value(rule.wheelsIncluded)}</dd></div>
              <div><dt className="text-xs text-navy-300">Handles included</dt><dd className="mt-1 text-sm text-navy-700">{value(rule.handlesIncluded)}</dd></div>
              <div><dt className="text-xs text-navy-300">Under-seat</dt><dd className="mt-1 text-sm text-navy-700">{value(rule.fitsUnderSeat)}</dd></div>
              <div><dt className="text-xs text-navy-300">Reviewed</dt><dd className="mt-1 text-sm text-navy-700">{value(rule.lastChecked)}</dd></div>
            </dl>
            {rule.ruleWording && <p className="mt-4 rounded-xl bg-navy-50 p-4 font-body text-sm leading-6 text-navy-600">{rule.ruleWording}</p>}
            {rule.softBagGuidance && <p className="mt-3 font-body text-sm text-navy-500"><strong>Soft bag guidance:</strong> {rule.softBagGuidance}</p>}
            {rule.notes && <p className="mt-2 font-body text-xs text-navy-400">{rule.notes}</p>}
            {rule.sourceReference && (
              <p className="mt-3 font-body text-xs text-navy-400">Source reference: {rule.sourceReference.startsWith("http") ? <a className="text-green-700 underline" href={rule.sourceReference} target="_blank" rel="noopener noreferrer">official source</a> : rule.sourceReference}</p>
            )}
          </article>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/airlines/${airline.slug}/baggage`} className="wf-btn-cta px-5 py-2.5 font-body text-sm">Full baggage breakdown</Link>
        <Link href="/compare" className="rounded-full border border-navy-200 px-5 py-2.5 font-body text-sm font-semibold text-navy-700">Compare sizes</Link>
      </div>
    </section>
  );
}
