import { getAirlines } from "@/services/airlines";
import { getTravelTips } from "@/services/tips";
import { getAffiliateLinks } from "@/services/affiliates";
import DimensionForm from "@/components/DimensionForm";
import TravelTipCard from "@/components/TravelTipCard";
import AffiliateCard from "@/components/AffiliateCard";
import FAQSection from "@/components/FAQSection";

export const revalidate = 3600;

const DATA_REVIEWED_DATE = "26 Jun 2026";

const HOME_FAQ = [
  {
    question: "How accurate is WillItFit?",
    answer:
      "We use cabin baggage allowances from each airline's published policy and review them regularly. Always double-check against the airline's own site before flying, since allowances can change without notice.",
  },
  {
    question: "Does WillItFit check weight as well as size?",
    answer:
      "Where an airline publishes a cabin bag weight limit, we show it alongside the size result — but weight isn't factored into the fit verdict itself, since gate checks are almost always size-based.",
  },
  {
    question: "What's the difference between a personal item and a cabin bag?",
    answer:
      "A personal item is the smaller bag that fits under the seat in front of you, such as a handbag, laptop bag or small backpack. A cabin bag is the larger case that goes in the overhead locker.",
  },
];

export default async function HomePage() {
  const [{ airlines }, { tips }, affiliates] = await Promise.all([
    getAirlines(),
    getTravelTips(),
    getAffiliateLinks(),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-navy-700">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-green-300/30 bg-white/10 px-3 py-1.5 font-body text-xs font-semibold text-green-200">
              <span>Official airline size data</span>
              <span className="text-green-400">•</span>
              <span>UK&apos;s top 10 airlines</span>
              <span className="text-green-400">•</span>
              <span>Reviewed: {DATA_REVIEWED_DATE}</span>
            </div>

            <h1 className="mt-6 font-heading text-4xl font-bold leading-tight text-white sm:text-6xl">
              Know before you go.
            </h1>

            <p className="mt-5 max-w-2xl font-body text-lg leading-relaxed text-navy-100 sm:text-xl">
              Check your cabin bag or personal item against airline size limits in seconds—before
              the gate agent does it for you.
            </p>
          </div>
        </div>

        <svg
          className="absolute -bottom-1 left-0 w-full"
          viewBox="0 0 1440 64"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 64h1440V0C1080 48 360 48 0 0v64z" fill="#FBFAF7" />
        </svg>
      </section>

      <section className="mx-auto -mt-8 max-w-3xl px-4 sm:px-6">
        <DimensionForm airlines={airlines} />
      </section>

      {tips.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-heading text-2xl font-semibold text-navy-700">Travel tips</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {tips.slice(0, 3).map((tip) => (
              <TravelTipCard key={tip.tipId} tip={tip} />
            ))}
          </div>
        </section>
      )}

      {affiliates.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-heading text-2xl font-semibold text-navy-700">
            Bags that fit almost anything
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {affiliates.slice(0, 3).map((link) => (
              <AffiliateCard key={link.affiliateId} link={link} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="font-heading text-2xl font-semibold text-navy-700">Common questions</h2>
        <div className="mt-6">
          <FAQSection items={HOME_FAQ} />
        </div>
      </section>
    </>
  );
}