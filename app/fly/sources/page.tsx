import type { Metadata } from "next";
import SourceExplorer, { type SourceExplorerCountry } from "@/components/fly/SourceExplorer";
import { WILLITFLY_HERO_MAP_ASSET } from "@/lib/willitflyAssets";
import { getWillItFlyRuntimeBundle } from "@/services/willitflyRuntime";
import styles from "./SourceExplorer.module.css";

export const metadata: Metadata = {
  title: "Our Sources",
  description: "Explore the governed public sources WillItFly uses to support destination information and monitored travel intelligence.",
  robots: { index: false, follow: false },
};

function isCountry(destinationType: string, parentDestinationId?: string) {
  const type = destinationType.trim().toUpperCase();
  return type === "COUNTRY" || (!parentDestinationId && type !== "REGION");
}

function topicsForSourceIds(sourceIds: string[]) {
  return Array.from(new Set(sourceIds.map((value) => value.trim()).filter(Boolean))).sort();
}

export default async function WillItFlySourcesPage() {
  const bundle = await getWillItFlyRuntimeBundle();

  const countries: SourceExplorerCountry[] = bundle.destinations
    .filter((destination) => isCountry(destination.destinationType, destination.parentDestinationId))
    .map((destination) => {
      const sources = bundle.publicSources.filter((source) => (
        source.entityId === destination.destinationId || source.entityId === destination.countryId
      ));
      return {
        destinationId: destination.destinationId,
        slug: destination.slug,
        displayName: destination.displayName,
        flagEmoji: destination.displayFlagEmoji,
        aliases: destination.aliases,
        sourceCount: sources.length,
        topics: topicsForSourceIds(sources.map((source) => source.topicId || "")),
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <img className={styles.heroMap} src={WILLITFLY_HERO_MAP_ASSET} alt="" aria-hidden="true" />
        <div className={styles.heroFade} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>WillItFly transparency</p>
            <h1>Explore our sources.</h1>
            <p className={styles.heroLead}>
              See the approved public sources behind WillItFly destination information and monitored travel intelligence. Choose a country to go deeper.
            </p>
          </div>
        </div>
      </section>

      <SourceExplorer countries={countries} />
    </main>
  );
}
