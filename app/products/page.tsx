import type { Metadata } from "next";
import TravelEssentials from "@/components/TravelEssentials";
import { getAffiliateSlots } from "@/services/runtimeAffiliates";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Travel essentials",
  description: "Practical travel products picked to help your bag pass the sizer and your trip go smoothly.",
};

export default async function ProductsIndexPage() {
  const { slots, source } = await getAffiliateSlots();
  return (
    <section className="wf-container wf-section">
      <h1 className="font-heading text-3xl font-semibold text-navy-700">Travel essentials</h1>
      <p className="mt-3 max-w-2xl font-body text-navy-500">
        Explore governed recommendations for smarter travel. Empty positions remain clearly labelled placeholders.
      </p>
      <div className="mt-8"><TravelEssentials heading={false} slots={slots} /></div>
      <p className="wf-runtime-source">Runtime source: {source === "sheet" ? "Google Sheets" : "validated local placeholders"}.</p>
    </section>
  );
}
