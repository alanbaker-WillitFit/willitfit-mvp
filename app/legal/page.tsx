import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = { title: "Terms and legal", description: "Important terms for using WillitFit guidance." };
export default function LegalPage() {
  return <PolicyPage title="Terms and legal" intro="WillitFit provides independent guidance to help you prepare; your airline makes the final baggage decision."><section><h2 className="font-heading text-xl font-semibold text-navy-700">Allowance changes</h2><p className="mt-2">Airlines can change policies without notice. Confirm your final allowance with the operating airline before travel.</p></section><section><h2 className="font-heading text-xl font-semibold text-navy-700">Commercial links</h2><p className="mt-2">Affiliate links are labelled. A possible commission never changes the checker result or airline guidance.</p></section></PolicyPage>;
}
