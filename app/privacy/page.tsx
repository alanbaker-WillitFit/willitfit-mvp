import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = { title: "Privacy", description: "How WillitFit handles information and protects traveller privacy." };
export default function PrivacyPage() {
  return <PolicyPage title="Privacy" intro="The cabin bag checker works without an account and does not store the measurements you enter."><section><h2 className="font-heading text-xl font-semibold text-navy-700">Information we use</h2><p className="mt-2">WillitFit may process essential technical logs needed to keep the service secure and reliable. We do not sell personal information.</p></section><section><h2 className="font-heading text-xl font-semibold text-navy-700">External links</h2><p className="mt-2">Airline and clearly disclosed affiliate links open third-party services with their own privacy terms.</p></section></PolicyPage>;
}
