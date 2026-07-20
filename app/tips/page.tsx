import type { Metadata } from "next";
import Link from "next/link";
import { getTravelTips, getTipCategories } from "@/services/tips";
import TravelTipCard from "@/components/TravelTipCard";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Travel tips",
  description: "Packing and baggage tips to help your bag clear airline checks every time.",
};

export default async function TipsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [{ tips: allTips }, categories] = await Promise.all([
    getTravelTips(),
    getTipCategories(),
  ]);

  const tips = category
    ? allTips.filter((tip) => tip.category?.toLowerCase() === category.toLowerCase())
    : allTips;

  return (
    <section className="wf-container wf-section">
      <h1 className="font-heading text-3xl font-semibold text-navy-700">Travel tips</h1>
      <p className="mt-3 max-w-2xl font-body text-navy-500">
        Practical advice for packing smarter and avoiding gate-check surprises.
      </p>

      {categories.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/tips"
            className={cn(
              "rounded-full border px-3.5 py-1.5 font-body text-sm font-medium",
              !category
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-navy-100 bg-white text-navy-500 hover:bg-navy-50"
            )}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/tips?category=${encodeURIComponent(c)}`}
              className={cn(
                "rounded-full border px-3.5 py-1.5 font-body text-sm font-medium",
                category?.toLowerCase() === c.toLowerCase()
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-navy-100 bg-white text-navy-500 hover:bg-navy-50"
              )}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      {tips.length === 0 ? (
        <p className="mt-8 font-body text-navy-300">
          {category ? `No tips in "${category}" yet — check back soon.` : "No tips published yet — check back soon."}
        </p>
      ) : (
        <div className="wf-grid-3 mt-8">
          {tips.map((tip) => (
            <TravelTipCard key={tip.tipId} tip={tip} />
          ))}
        </div>
      )}
    </section>
  );
}
