import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = { title: "Accessibility", description: "WillitFit accessibility commitment and contact route." };
export default function AccessibilityPage() {
  return <PolicyPage title="Accessibility" intro="WillitFit is designed so travellers can check a bag using a keyboard, screen reader, zoomed text or reduced-motion settings."><section><h2 className="font-heading text-xl font-semibold text-navy-700">Our approach</h2><p className="mt-2">We use labelled controls, visible focus, meaningful headings, text alongside result colours and responsive layouts without horizontal scrolling.</p></section><section><h2 className="font-heading text-xl font-semibold text-navy-700">Tell us about a barrier</h2><p className="mt-2">If something prevents you from completing a check, <Link href="/contact" className="font-semibold text-green-700 underline">contact us</Link> and describe the page, device and assistive technology involved.</p></section></PolicyPage>;
}
