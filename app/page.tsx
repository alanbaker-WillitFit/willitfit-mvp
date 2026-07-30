import Link from "next/link";
import Image from "next/image";
import DimensionForm from "@/components/DimensionForm";
import TravelTipCard from "@/components/TravelTipCard";
import TravelEssentials from "@/components/TravelEssentials";
import { getAirlines } from "@/services/airlines";
import { getTravelTips } from "@/services/tips";
import { InfoIcon, PlaneIcon } from "@/components/HomeIcons";
import { ShieldCheckIcon, LockIcon, GlobeIcon } from "@/components/icons";
import { getRuntimeContent } from "@/services/runtimeContent";
import { getAffiliateSlots } from "@/services/runtimeAffiliates";
import { getLabConfigurations } from "@/services/labConfig";
import { getSpecialBaggageResults } from "@/services/specialBaggage";

export const revalidate = 3600;

const NEXT_STEPS = [
  ["Check Another Bag", "/#checker", "Start a new baggage check.", "cabin"],
  ["Airlines", "/airlines", "Browse official baggage guides.", "plane"],
  ["Ask WillitFit", "/ask", "Search real questions and get answers.", "?"],
  ["Travel Tips", "/tips", "Practical advice for smoother travel.", "info"],
  ["Travel Essentials", "/products", "Explore governed travel essentials.", "personal"],
  ["FAQs", "/ask", "Find clear answers before you fly.", "?"],
] as const;

export default async function HomePage({ searchParams }: { searchParams: Promise<{ airline?: string }> }) {
  const [{ airlines, source }, { tips }, { airline: airlineParam }, { content: notices }, { content: hints }, { slots: affiliateSlots }, labConfigs, specialBaggageResults] = await Promise.all([
    getAirlines(),
    getTravelTips(),
    searchParams,
    getRuntimeContent({ module: "Notices", page: "checker" }),
    getRuntimeContent({ module: "Hints", page: "checker", section: "pre-check" }),
    getAffiliateSlots(),
    getLabConfigurations(),
    getSpecialBaggageResults(),
  ]);
  const preselectedAirline = airlineParam ? airlines.find(airline => airline.slug === airlineParam) ?? null : null;
  const priorityAirlines = airlines.slice(0, 5);
  const selectedTips = tips.slice(0, 3);

  return (
    <>
      <section className="wf-home-hero" aria-labelledby="home-heading">
        <div className="wf-home-hero__image" aria-hidden="true" />
        <div className="wf-container wf-home-hero__content">
          <h1 id="home-heading">Know<br />Before You <span>Go.</span></h1>
          <p>Check personal items, cabin bags and checked bags against official airline rules.</p>
        </div>
      </section>

      <div className="wf-home-main wf-container">
        <div className="wf-home-workspace">
          <main className="wf-home-workspace__main">
            <DimensionForm airlines={airlines} initialAirline={preselectedAirline} notices={notices} hints={hints} affiliateSlots={affiliateSlots} labConfigs={labConfigs} specialBaggageResults={specialBaggageResults} />

            <section className="wf-home-tips" aria-labelledby="home-tips-heading">
              <div className="wf-section-heading"><h2 id="home-tips-heading">Travel Tips</h2><Link href="/tips">View all tips →</Link></div>
              <div className="wf-home-tips__grid">{selectedTips.map(tip => <TravelTipCard key={tip.tipId} tip={tip} />)}</div>
            </section>

            <section className="wf-mobile-recommendation" aria-label="Recommended next reading">
              {selectedTips[0] ? <TravelTipCard tip={selectedTips[0]} /> : null}
            </section>

        <section className="wf-next-steps" aria-labelledby="next-steps-heading">
          <h2 id="next-steps-heading">What do you want to do next?</h2>
          <div className="wf-next-steps__grid">
            {NEXT_STEPS.map(([label, href, description, icon]) => (
              label === "Check Another Bag" ? (
                <a key={label} href={href} className="wf-next-card">
                  <span className="wf-next-card__icon" aria-hidden="true"><Image src="/assets/icons/cabin-bag-photo-rc4.jpg" alt="" width={24} height={24} /></span>
                  <span><strong>{label}</strong><small>{description}</small></span><span aria-hidden="true">&rarr;</span>
                </a>
              ) : (
                <Link key={label} href={href} className="wf-next-card">
                  <span className="wf-next-card__icon" aria-hidden="true">{icon === "plane" ? <PlaneIcon /> : icon === "info" ? <InfoIcon /> : icon === "personal" ? <Image src="/assets/icons/personal-item-photo-rc4.jpg" alt="" width={24} height={24} /> : "?"}</span>
                  <span><strong>{label}</strong><small>{description}</small></span><span aria-hidden="true">&rarr;</span>
                </Link>
              )
            ))}
          </div>
        </section>

        <section className="wf-top-airlines" aria-labelledby="top-airlines-heading">
          <div><PlaneIcon /><span><h2 id="top-airlines-heading">Top airlines</h2><p>Check supported baggage rules</p></span></div>
          <nav aria-label="Top airlines">{priorityAirlines.map(airline => <Link key={airline.airlineId} href={`/airlines/${airline.slug}`}>{airline.airlineName}</Link>)}<Link href="/airlines">View all →</Link></nav>
        </section>

        <section className="wf-trust-strip" aria-label="WillitFit trust commitments">
          <div><ShieldCheckIcon /><span><strong>Official data</strong><small>From official airline sources</small></span></div>
          <div><GlobeIcon /><span><strong>Trusted by travellers</strong><small>Traveller-first guidance</small></span></div>
          <div><LockIcon /><span><strong>No personal data</strong><small>No sign-up required</small></span></div>
        </section>
            <p className="wf-runtime-source">Runtime source: {source === "sheet" ? "Google Sheets" : "validated local fallback"}.</p>
          </main>
          <aside className="wf-affiliate-rail" aria-label="Travel Essentials categories">
            <TravelEssentials variant="rail" slots={affiliateSlots} />
          </aside>
        </div>
      </div>
    </>
  );
}
