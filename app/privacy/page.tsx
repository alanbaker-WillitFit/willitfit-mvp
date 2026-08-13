import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How WillItFly handles information and protects traveller privacy.",
};

export default function PrivacyPage() {
  return (
    <PolicyPage title="Privacy" intro="The core WillItFly destination experience does not require an account or personal profile.">
      <section><h2 className="font-heading text-xl font-semibold text-navy-700">Information we use</h2><p className="mt-2">WillItFly may process essential technical information needed to operate, secure and improve the service. Personal information is not sold.</p></section>
      <section><h2 className="font-heading text-xl font-semibold text-navy-700">External sources</h2><p className="mt-2">Links to official or third-party sources open services with their own privacy terms.</p></section>
    </PolicyPage>
  );
}
