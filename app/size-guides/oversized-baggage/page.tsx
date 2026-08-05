import type { Metadata } from "next";
import Link from "next/link";
import GuideHero from "@/components/GuideHero";
import OversizedGuideGrid from "@/components/OversizedGuideGrid";
import { getSpecialBaggageResults } from "@/services/specialBaggage";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Oversized Baggage Guide",
  description: "Brief guidance for bicycles, golf clubs, buggies, mobility equipment and other specialist baggage.",
};

export default async function OversizedBaggageGuidePage() {
  const items = await getSpecialBaggageResults();

  return (
    <main className="wf-container wf-section">
      <GuideHero
        eyebrow="WillItFit baggage guides"
        title="Oversized Baggage Guide"
        description="Specialist baggage is governed by the item, airline, route and booking rather than one universal size rule. Select what you are travelling with for brief preparation guidance."
        note="This guide provides general preparation advice. Always confirm the current policy, fees and booking requirements with your airline before travel."
        image="/assets/special-baggage/advanced-oversized-baggage-hero-rc5.webp"
        imageAlt="Oversized and specialist baggage prepared for air travel"
      />

      <section className="mt-12" aria-labelledby="oversized-subjects-heading">
        <h2 id="oversized-subjects-heading" className="font-heading text-2xl font-bold text-navy-700">Choose your baggage type</h2>
        <p className="mt-2 font-body text-sm text-navy-400">Open a card for concise advice. The page remains aligned with the Personal Item, Cabin Bag and Checked Bag guides.</p>
        <OversizedGuideGrid items={items} />
      </section>

      <section className="wf-card mt-12 min-h-[210px] p-7 text-center">
        <h2 className="font-heading text-2xl font-bold text-navy-700">Travelling with a standard bag?</h2>
        <p className="mx-auto mt-3 max-w-xl font-body text-sm leading-6 text-navy-500">Use the WillItFit checker for published personal-item, cabin-bag and checked-bag allowances.</p>
        <Link href="/#checker" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-lg bg-green-500 px-6 font-body font-bold text-white">Open the bag checker</Link>
      </section>
    </main>
  );
}
