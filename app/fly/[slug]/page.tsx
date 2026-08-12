import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DestinationLocationCard from "@/components/fly/DestinationLocationCard";
import TopicSummaryCard from "@/components/fly/TopicSummaryCard";
import styles from "@/components/fly/DestinationCards.module.css";
import { resolveTopicCard, type WillItFlyTopicId } from "@/lib/willitflyCards";
import {
  resolveDefaultOriginFlightTime,
  resolveDestinationTimeZone,
} from "@/lib/willitflyJourneyContext";
import { getWillItFlyCardsRuntimeBundle } from "@/services/willitflyCardsRuntime";
import { getWillItFlyRuntimeBundle } from "@/services/willitflyRuntime";

export const revalidate = 300;

const RC1_TOPICS: WillItFlyTopicId[] = ["POWER", "CONNECTIVITY", "MONEY", "ENTRY", "WEATHER"];

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function destinationBySlug(slug: string) {
  const bundle = await getWillItFlyRuntimeBundle();
  return bundle.destinations.find((destination) => destination.slug === slug) || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = await destinationBySlug(slug);
  if (!destination) return { robots: { index: false, follow: false } };

  return {
    title: `${destination.displayName} travel answers`,
    description: `Governed WillItFly travel information for ${destination.displayName}, covering power, connectivity, money, entry and climate guidance.`,
    robots: { index: false, follow: false },
  };
}

export default async function WillItFlyDestinationPage({ params }: PageProps) {
  const { slug } = await params;
  const [runtime, cardsRuntime] = await Promise.all([
    getWillItFlyRuntimeBundle(),
    getWillItFlyCardsRuntimeBundle(),
  ]);

  const destination = runtime.destinations.find((item) => item.slug === slug);
  if (!destination) return notFound();

  const cards = RC1_TOPICS.map((topicId) => resolveTopicCard({
    destinationId: destination.destinationId,
    topicId,
    facts: cardsRuntime.facts,
    cardSchemas: cardsRuntime.cardSchemas,
    cardFieldLinks: cardsRuntime.cardFieldLinks,
    assets: cardsRuntime.assets,
    publicSources: cardsRuntime.publicSources,
  }));

  const defaultOriginFlightTime = resolveDefaultOriginFlightTime(
    runtime.travelTimes,
    destination.destinationId,
  );
  const destinationTimeZone = resolveDestinationTimeZone(destination);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>WillItFly · RC1 destination preview</p>
        <h1 className={styles.heading}>{destination.displayName}</h1>
        <p className={styles.lead}>
          Practical travel answers from governed source evidence. Information that has not passed the complete Runtime contract stays unavailable rather than being guessed.
        </p>

        <div className={styles.layout}>
          <DestinationLocationCard
            destination={destination}
            averageFlightMinutes={defaultOriginFlightTime?.averageFlightMinutes ?? null}
            destinationTimeZone={destinationTimeZone.timeZone}
            multipleTimeZones={destinationTimeZone.multiple}
          />
          <section className={styles.cards} aria-label={`${destination.displayName} travel information`}>
            {cards.map((card) => <TopicSummaryCard card={card} key={card.cardId} />)}
          </section>
        </div>
      </div>
    </div>
  );
}
