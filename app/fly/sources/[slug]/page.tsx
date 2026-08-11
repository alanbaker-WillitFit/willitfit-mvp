import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWillItFlyRuntimeBundle, type WillItFlyPublicSource } from "@/services/willitflyRuntime";
import styles from "./SourceDetail.module.css";

export const metadata: Metadata = {
  title: "Country Sources",
  description: "Approved public sources used by WillItFly for destination information and travel intelligence.",
  robots: { index: false, follow: false },
};

function label(value: string | undefined) {
  const cleaned = String(value || "General").trim().replace(/[_-]+/g, " ").toLowerCase();
  return cleaned.replace(/\b\w/g, (character) => character.toUpperCase());
}

function groupedSources(sources: WillItFlyPublicSource[]) {
  const groups = new Map<string, WillItFlyPublicSource[]>();
  for (const source of sources) {
    const key = label(source.topicId || source.entityType || "General");
    const current = groups.get(key) || [];
    current.push(source);
    groups.set(key, current);
  }
  return Array.from(groups.entries())
    .map(([groupLabel, items]) => [groupLabel, items.sort((a, b) => a.sourceName.localeCompare(b.sourceName))] as const)
    .sort(([a], [b]) => a.localeCompare(b));
}

export default async function CountrySourcesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = await getWillItFlyRuntimeBundle();
  const destination = bundle.destinations.find((item) => item.slug === slug);
  if (!destination) notFound();

  const sources = bundle.publicSources.filter((source) => (
    source.entityId === destination.destinationId || source.entityId === destination.countryId
  ));
  const groups = groupedSources(sources);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <Link className={styles.backLink} href="/fly/sources">← All source countries</Link>
          <div className={styles.titleRow}>
            <h1>{destination.displayName}</h1>
            {destination.displayFlagEmoji ? <span className={styles.flag} aria-hidden="true">{destination.displayFlagEmoji}</span> : null}
          </div>
          <p className={styles.lead}>
            The approved public sources WillItFly can expose for this destination. Operational scrape URLs, parser endpoints and internal monitoring fallbacks stay inside the Operations Node and Cockpit.
          </p>
          <p className={styles.summary}>{sources.length} public {sources.length === 1 ? "source" : "sources"} across {groups.length} {groups.length === 1 ? "section" : "sections"}</p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          {groups.length > 0 ? (
            <div className={styles.sectionList}>
              {groups.map(([groupLabel, items]) => (
                <section className={`wf-card ${styles.group}`} key={groupLabel}>
                  <h2>{groupLabel}</h2>
                  <div className={styles.sourceList}>
                    {items.map((source) => (
                      <article className={styles.sourceRow} key={source.sourceId}>
                        <div className={styles.sourceName}>
                          <strong>{source.sourceName}</strong>
                          <small>{source.authorityLevel ? `${label(source.authorityLevel)} source` : "Approved public source"}</small>
                        </div>
                        <div className={styles.sourceMeta}>
                          {source.lastChecked ? <span>Last checked {source.lastChecked}</span> : <span>Check date not projected</span>}
                          {source.reviewDue ? <span>Review due {source.reviewDue}</span> : null}
                        </div>
                        <a className={styles.sourceLink} href={source.url} target="_blank" rel="noreferrer">Visit source ↗</a>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className={`wf-card ${styles.empty}`}>
              <h2>Public sources are being prepared</h2>
              <p>No governed public-source records are currently projected for this country. The page fails closed rather than exposing internal monitoring URLs.</p>
            </div>
          )}

          <div className={styles.note}>
            <strong>Why the list is curated:</strong> the Pi may monitor several technical URLs for one authority. WillItFly exposes the useful public source, not every internal feed, mirror, fallback or scrape endpoint.
          </div>
        </div>
      </section>
    </main>
  );
}
