import Link from "next/link";
import type { Airline } from "@/types";
import type { EnrichedRule } from "@/services/baggageKnowledge";
import { dimensionLabel } from "@/services/baggageKnowledge";

export default function ComparisonTable({ rows, mode }: { rows: Array<{ airline: Airline; rule: EnrichedRule }>; mode: "size" | "weight" }) {
  return (
    <div className="mt-8 overflow-x-auto rounded-xl border border-navy-100 bg-white">
      <table className="wf-responsive-table min-w-full text-left text-sm">
        <thead className="bg-navy-50 text-navy-600">
          <tr>
            <th className="px-4 py-3">Airline</th>
            <th className="px-4 py-3">Fare / option</th>
            <th className="px-4 py-3">{mode === "size" ? "Dimensions" : "Checked weight"}</th>
            <th className="px-4 py-3">Details</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ airline, rule }) => (
            <tr key={rule.ruleId} className="border-t border-navy-100 text-navy-600">
              <td className="px-4 py-3"><Link className="font-semibold text-green-700 underline" href={`/${airline.slug}`}>{airline.airlineName}</Link></td>
              <td className="px-4 py-3">{rule.fare}</td>
              <td className="px-4 py-3">{mode === "size" ? (dimensionLabel(rule) ?? "Not dimensioned") : (rule.weightKg ? `${rule.weightKg} kg` : "Not stated")}</td>
              <td className="px-4 py-3"><Link className="text-green-700 underline" href={`/airlines/${airline.slug}/fares/${rule.fareSlug}`}>Rule detail</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
