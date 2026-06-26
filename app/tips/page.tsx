import type { Metadata } from "next";
import { getTravelTips } from "@/services/tips";
import TravelTipCard from "@/components/TravelTipCard";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Travel tips",
  description: "Packing and baggage tips to help your bag clear airline checks every time.",
};

export default async function TipsIndexPage() {
  const { tips } = await getTravelTips();

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-semibold text-navy-700">Travel tips</h1>
      <p className="mt-3 max-w-2xl font-body text-navy-500">
        Practical advice for packing smarter and avoiding gate-check surprises.
      </p>

      {tips.length === 0 ? (
        <p className="mt-8 font-body text-navy-300">No tips published yet — check back soon.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip) => (
            <TravelTipCard key={tip.tipId} tip={tip} />
          ))}
        </div>
      )}
    </section>
  );
}
