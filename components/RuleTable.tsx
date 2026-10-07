import Link from "next/link";
import type { Airline } from "@/types";
import type { EnrichedRule } from "@/services/baggageKnowledge";
import { dimensionLabel } from "@/services/baggageKnowledge";

export default function RuleTable({ airline, rules }: { airline: Airline; rules: EnrichedRule[] }) {
  if (!rules.length) return null;
  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-navy-100 bg-white">
      <table className="wf-responsive-table min-w-full text-left font-body text-sm">
        <thead className="bg-navy-50 text-navy-600">
          <tr>
            <th className="px-4 py-3">Fare</th>
            <th className="px-4 py-3">Bag</th>
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Weight</th>
            <th className="px-4 py-3">Detail</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.ruleId} className="border-t border-navy-100 text-navy-600">
              <td className="px-4 py-3 font-semibold">{rule.fare}</td>
              <td className="px-4 py-3">{rule.bagType}</td>
              <td className="px-4 py-3">{dimensionLabel(rule) ?? (rule.linearSizeCm ? `${rule.linearSizeCm} cm linear` : "Not dimensioned")}</td>
              <td className="px-4 py-3">{rule.weightKg ? `${rule.weightKg} kg` : "Not stated"}</td>
              <td className="px-4 py-3"><Link className="font-semibold text-green-700 underline" href={`/airlines/${airline.slug}/fares/${rule.fareSlug}`}>View fare</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
