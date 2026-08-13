import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Terms and legal",
  description: "Important terms for using WillItFly destination guidance.",
};

export default function LegalPage() {
  return (
    <PolicyPage title="Terms and legal" intro="WillItFly provides independent travel guidance from governed information; official authorities and service providers remain the final source for decisions that affect your journey.">
      <section><h2 className="font-heading text-xl font-semibold text-navy-700">Information changes</h2><p className="mt-2">Travel information can change. Check relevant official requirements before relying on information for a time-sensitive or consequential decision.</p></section>
      <section><h2 className="font-heading text-xl font-semibold text-navy-700">Evidence and review</h2><p className="mt-2">WillItFly publishes governed records and source evidence where available. Missing or unapproved information should fail closed rather than be invented.</p></section>
    </PolicyPage>
  );
}
