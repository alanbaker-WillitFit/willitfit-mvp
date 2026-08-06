import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GuideHero from "@/components/GuideHero";
import SizeGuideRail from "@/components/SizeGuideRail";
import { getSizeGuide, SIZE_GUIDE_CONFIG, type SizeGuideKind } from "@/services/sizeGuides";

export const revalidate = 3600;

const KINDS: SizeGuideKind[] = ["personal-item", "cabin-bag", "checked-bag"];

function isGuideKind(value: string): value is SizeGuideKind {
  return KINDS.includes(value as SizeGuideKind);
}

export function generateStaticParams() {
  return KINDS.map((bagType) => ({ bagType }));
}

export async function generateMetadata({ params }: { params: Promise<{ bagType: string }> }): Promise<Metadata> {
  const { bagType } = await params;
  if (!isGuideKind(bagType)) return {};
  const config = SIZE_GUIDE_CONFIG[bagType];
  return { title: config.title, description: config.description };
}

export default async function SizeGuidePage({ params }: { params: Promise<{ bagType: string }> }) {
  const { bagType } = await params;
  if (!isGuideKind(bagType)) notFound();

  const config = SIZE_GUIDE_CONFIG[bagType];
  const guide = await getSizeGuide(bagType);
  const supplement = guide.checkedSupplement;

  return (
    <main className="wf-container wf-section">
      <GuideHero
        eyebrow="WillItFit size comparison"
        title={config.title}
        description={config.description}
        note="Cards are ordered by the number of supported airlines using the published allowance. Use the horizontal rail to compare additional ranges."
        image={config.image}
        imageAlt={config.imageAlt}
      />

      <section className="mt-12" aria-labelledby="common-sizes-heading">
        <h2 id="common-sizes-heading" className="font-heading text-2xl font-bold text-navy-700">Published size ranges</h2>
        <p className="mt-2 font-body text-sm text-navy-400">Three cards remain visible on desktop; swipe or scroll horizontally for more.</p>
        <SizeGuideRail groups={guide.groups} />
      </section>

      {supplement && supplement.linearTotals.length > 0 && (
        <section className="mt-12" aria-labelledby="linear-rules-heading">
          <h2 id="linear-rules-heading" className="font-heading text-2xl font-bold text-navy-700">Linear-total rules</h2>
          <div className="mt-5 grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
            {supplement.linearTotals.map((group) => (
              <article key={group.key} className="wf-card flex min-h-[300px] flex-col p-6">
                <p className="font-body text-xs font-bold uppercase tracking-wide text-green-600">{group.airlines.length} {group.airlines.length === 1 ? "airline" : "airlines"}</p>
                <h3 className="mt-2 min-h-[58px] font-heading text-2xl font-bold text-navy-700">{group.operator === "lt" ? "Under" : "At or under"} {group.limitCm} cm total</h3>
                <p className="mt-3 min-h-[48px] font-body text-sm leading-6 text-navy-400">Combined height, width and depth allowance</p>
                <ul className="mt-5 space-y-2">
                  {group.airlines.slice(0, 5).map((airline) => (
                    <li key={airline.airlineId}><Link className="font-body text-sm font-semibold text-navy-600 underline underline-offset-4" href={`/airlines/${airline.slug}`}>{airline.airlineName}</Link></li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      {supplement && supplement.weightOnlyAirlines.length > 0 && (
        <section className="wf-card mt-12 min-h-[210px] p-7" aria-labelledby="weight-only-heading">
          <h2 id="weight-only-heading" className="font-heading text-2xl font-bold text-navy-700">Weight-only checked-bag rules</h2>
          <p className="mt-3 max-w-3xl font-body text-sm leading-6 text-navy-500">These airlines publish a checked-bag weight limit but no universal dimensions. Size restrictions may vary by aircraft, route or booking, so always check the booking-specific policy.</p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {supplement.weightOnlyAirlines.map((airline) => (
              <li key={airline.airlineId}><Link className="font-body text-sm font-semibold text-navy-600 underline underline-offset-4" href={`/airlines/${airline.slug}`}>{airline.airlineName}</Link></li>
            ))}
          </ul>
        </section>
      )}

      <section className="wf-card mt-12 min-h-[210px] p-7 text-center">
        <h2 className="font-heading text-2xl font-bold text-navy-700">Not seeing your airline?</h2>
        <p className="mx-auto mt-3 max-w-xl font-body text-sm leading-6 text-navy-500">Check your exact published allowance with the WillItFit bag checker.</p>
        <Link href="/#checker" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-lg bg-green-500 px-6 font-body font-bold text-white">{config.checkerLabel}</Link>
      </section>

      <p className="mt-8 font-body text-xs text-navy-300">Data source: {guide.source === "sheet" ? "governed Runtime" : "validated local fallback"}.</p>
    </main>
  );
}
