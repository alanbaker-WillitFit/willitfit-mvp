import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "WillItFly accessibility commitment.",
};

export default function AccessibilityPage() {
  return (
    <PolicyPage title="Accessibility" intro="WillItFly is designed to make destination information usable with keyboards, screen readers, zoomed text and reduced-motion settings.">
      <section><h2 className="font-heading text-xl font-semibold text-navy-700">Our approach</h2><p className="mt-2">We use labelled controls, visible focus, meaningful headings, text alongside visual states and responsive layouts.</p></section>
      <section><h2 className="font-heading text-xl font-semibold text-navy-700">Report a barrier</h2><p className="mt-2">Accessibility issues should be reported through the published WillItFly contact channel so they can be reviewed and corrected.</p></section>
    </PolicyPage>
  );
}
