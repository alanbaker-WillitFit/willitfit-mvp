import type { Metadata } from "next";
import Link from "next/link";
import {
  canShowAllClear,
  resolveDestinationLiveIncidents,
  type RuntimeLiveIncident,
  type WillItFlyLiveTopic,
} from "@/lib/willitflyLiveIntelligence";
import { projectLatLongToHeroMap } from "@/lib/willitflyMapProjection";
import { WILLITFLY_HERO_MAP_ASSET } from "@/lib/willitflyAssets";
import {
  getWillItFlyRuntimeBundle,
  resolveWillItFlyPublicSource,
  type WillItFlyDestination,
  type WillItFlyPublicSource,
} from "@/services/willitflyRuntime";
import styles from "./TravelUpdates.module.css";

export const metadata: Metadata = {
  title: "Travel Updates",
  description: "Current governed travel updates that may materially affect your trip, monitored by WillItFly and presented as practical traveller impact.",
  robots: { index: false, follow: false },
};

const TOPICS: Array<{ key: "ALL" | WillItFlyLiveTopic; label: string }> = [
  { key: "ALL", label: "All updates" },
  { key: "TRANSPORT", label: "Transport" },
  { key: "WEATHER", label: "Weather" },
  { key: "AIRPORT", label: "Airports" },
  { key: "ENTRY", label: "Entry" },
  { key: "OFFICIAL_ADVICE", label: "Official advice" },
  { key: "DESTINATION_EVENT", label: "Destination events" },
];

const LIVE_TOPIC_KEYS = new Set<WillItFlyLiveTopic>([
  "TRANSPORT",
  "WEATHER",
  "AIRPORT",
  "ENTRY",
  "OFFICIAL_ADVICE",
  "DESTINATION_EVENT",
]);

const TOPIC_LABELS: Record<WillItFlyLiveTopic, string> = {
  TRANSPORT: "Transport",
  WEATHER: "Weather",
  AIRPORT: "Airport",
  ENTRY: "Entry",
  OFFICIAL_ADVICE: "Official advice",
  DESTINATION_EVENT: "Destination event",
};

const SEVERITY_LABELS: Record<RuntimeLiveIncident["severity"], string> = {
  ADVISORY: "Advisory",
  DISRUPTION: "Disruption",
  SEVERE: "Severe",
};

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatChecked(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Check time unavailable";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(parsed);
}

function resolveDestination(input: string | undefined, destinations: WillItFlyDestination[]) {
  const wanted = String(input || "").trim().toLowerCase();
  if (!wanted) return undefined;
  return destinations.find((destination) => (
    destination.destinationId.toLowerCase() === wanted ||
    destination.slug.toLowerCase() === wanted ||
    destination.displayName.toLowerCase() === wanted ||
    destination.aliases.some((alias) => alias.toLowerCase() === wanted)
  ));
}

function filterHref(topic: "ALL" | WillItFlyLiveTopic, destination?: WillItFlyDestination): string {
  const params = new URLSearchParams();
  if (topic !== "ALL") params.set("topic", topic);
  if (destination) params.set("destination", destination.slug || destination.destinationId);
  const query = params.toString();
  return query ? `/fly/travel-updates?${query}` : "/fly/travel-updates";
}

export default async function TravelUpdatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const bundle = await getWillItFlyRuntimeBundle();
  const destinationInput = one(params.destination);
  const destination = resolveDestination(destinationInput, bundle.destinations);
  const selectedDestinationId = destination?.destinationId;
  const requestedTopic = one(params.topic)?.trim().toUpperCase();
  const selectedTopic = requestedTopic && LIVE_TOPIC_KEYS.has(requestedTopic as WillItFlyLiveTopic)
    ? requestedTopic as WillItFlyLiveTopic
    : undefined;

  const incidents = resolveDestinationLiveIncidents(
    bundle.liveIncidents,
    selectedDestinationId,
    selectedTopic,
  );

  const monitoredDestinations = bundle.destinations
    .filter((item) => bundle.liveIncidents.some((incident) => incident.destinationIds.includes(item.destinationId)))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const pinDestinations = monitoredDestinations.flatMap((item) => {
    const point = projectLatLongToHeroMap(item.latitude, item.longitude);
    if (!point) return [];
    const count = bundle.liveIncidents.filter((incident) => incident.destinationIds.includes(item.destinationId)).length;
    return [{ item, point, count }];
  });

  const relevantMonitoring = selectedDestinationId
    ? bundle.liveMonitoring.filter((status) => (
        status.destinationId === selectedDestinationId &&
        (selectedTopic ? status.topic === selectedTopic : status.topic === "ALL")
      ))
    : [];

  const allClear = incidents.length === 0 && relevantMonitoring.some((status) => canShowAllClear(status));

  const checkTimes = [
    ...incidents.map((incident) => incident.lastChecked),
    ...relevantMonitoring.map((status) => status.lastChecked),
  ]
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());
  const latestCheck = checkTimes[0];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>WillIt Live Intelligence</p>
              <h1>Know what&apos;s changing before you fly.</h1>
              <p className={styles.lead}>
                Timely, governed travel updates distilled into what matters for your journey.
              </p>

              <form className={styles.searchForm} method="get" role="search">
                {selectedTopic ? <input type="hidden" name="topic" value={selectedTopic} /> : null}
                <label className="sr-only" htmlFor="destination-search">Search a country or destination</label>
                <span className={styles.searchIcon} aria-hidden="true">⌕</span>
                <input
                  id="destination-search"
                  name="destination"
                  list="travel-update-destinations"
                  defaultValue={destination?.displayName || destinationInput || ""}
                  placeholder="Search a country or destination"
                  autoComplete="off"
                />
                <datalist id="travel-update-destinations">
                  {monitoredDestinations.map((item) => (
                    <option key={item.destinationId} value={item.displayName} />
                  ))}
                </datalist>
                <button type="submit">Search</button>
              </form>

              <div className={styles.trustLine}>
                <span>Governed monitoring</span>
                <span aria-hidden="true">•</span>
                <span>Source-backed</span>
                <span aria-hidden="true">•</span>
                <span>Written for travellers</span>
              </div>
            </div>

            <figure className={styles.worldMap} aria-label="World map showing destinations with current published travel updates">
              <img src={WILLITFLY_HERO_MAP_ASSET} alt="" aria-hidden="true" />
              {pinDestinations.map(({ item, point, count }) => (
                <Link
                  key={item.destinationId}
                  href={filterHref(selectedTopic || "ALL", item)}
                  className={styles.newsPin}
                  style={{ left: `${point.xPercent}%`, top: `${point.yPercent}%` }}
                  aria-label={`${item.displayName}: ${count} current ${count === 1 ? "update" : "updates"}`}
                  title={`${item.displayName} · ${count} current ${count === 1 ? "update" : "updates"}`}
                >
                  <span>{count}</span>
                </Link>
              ))}
              <figcaption>
                Red pins indicate destinations with a currently published governed update; they do not imply danger.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className={styles.controls} aria-label="Travel update filters">
        <div className={styles.container}>
          <div className={styles.topicRail}>
            {TOPICS.map((topic) => {
              const active = topic.key === "ALL" ? !selectedTopic : selectedTopic === topic.key;
              return (
                <Link
                  key={topic.key}
                  href={filterHref(topic.key, destination)}
                  className={active ? styles.topicActive : styles.topicLink}
                  aria-current={active ? "page" : undefined}
                >
                  {topic.label}
                </Link>
              );
            })}
          </div>
          {destination ? (
            <div className={styles.selectedDestination}>
              <span>Showing {destination.displayName}</span>
              <Link href={filterHref(selectedTopic || "ALL")}>Clear destination</Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className={styles.results} aria-live="polite">
        <div className={styles.container}>
          <div className={styles.resultsHeader}>
            <div>
              <p className={styles.resultContext}>
                {destination ? destination.displayName : "Across monitored destinations"}
                {selectedTopic ? ` · ${TOPIC_LABELS[selectedTopic]}` : ""}
              </p>
              <h2>{incidents.length > 0 ? `${incidents.length} current ${incidents.length === 1 ? "update" : "updates"}` : "Current status"}</h2>
            </div>
            {latestCheck ? <p className={styles.checked}>Last checked {formatChecked(latestCheck.toISOString())}</p> : null}
          </div>

          {incidents.length > 0 ? (
            <div className={styles.updateList}>
              {incidents.map((incident) => {
                const primaryDestination = bundle.destinations.find((item) => item.destinationId === incident.primaryDestinationId);
                const sources = incident.sourceIds
                  .map((sourceId) => resolveWillItFlyPublicSource(bundle, sourceId))
                  .filter((source): source is WillItFlyPublicSource => Boolean(source));

                return (
                  <article className={`wf-card ${styles.updateCard}`} key={incident.incidentId}>
                    <div className={styles.cardTopline}>
                      <span className={styles.topicBadge}>{TOPIC_LABELS[incident.topic]}</span>
                      <span className={`${styles.severityBadge} ${styles[`severity${incident.severity}`]}`}>
                        {SEVERITY_LABELS[incident.severity]}
                      </span>
                    </div>
                    <p className={styles.location}>{primaryDestination?.displayName || incident.primaryDestinationId}</p>
                    <h3>{incident.headline}</h3>
                    <p className={styles.cardSummary}>{incident.summary || incident.travellerImpact}</p>
                    <div className={styles.impact}>
                      <strong>What this means for you</strong>
                      <p>{incident.travellerImpact}</p>
                    </div>
                    <div className={styles.meta}>
                      <span>Checked {formatChecked(incident.lastChecked)}</span>
                      <span>{incident.sourceIds.length} governed {incident.sourceIds.length === 1 ? "source" : "sources"}</span>
                      <span>Evidence {incident.evidenceConfidence.toLowerCase()}</span>
                    </div>
                    <details className={styles.more}>
                      <summary>Details and sources</summary>
                      {sources.length > 0 ? (
                        <div className={styles.sources}>
                          {sources.map((source) => (
                            <a href={source.url} key={source.sourceId} target="_blank" rel="noreferrer">
                              {source.sourceName}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p>Public source links are not available in this Runtime projection.</p>
                      )}
                    </details>
                  </article>
                );
              })}
            </div>
          ) : allClear ? (
            <div className={`wf-card ${styles.allClear}`}>
              <span className={styles.allClearIcon} aria-hidden="true">✓</span>
              <div>
                <h3>All clear</h3>
                <p>No significant current issues are published for this monitored selection.</p>
                {latestCheck ? <small>Monitoring last checked {formatChecked(latestCheck.toISOString())}.</small> : null}
              </div>
            </div>
          ) : (
            <div className={`wf-card ${styles.unavailable}`}>
              <span className={styles.unavailableIcon} aria-hidden="true">◎</span>
              <div>
                <h3>No verified update status is available</h3>
                <p>
                  WillIt does not infer “All clear” from an empty feed. Fresh governed monitoring evidence is required before reassurance is shown.
                </p>
              </div>
            </div>
          )}

          <aside className={`wf-card ${styles.methodNote}`}>
            <strong>How WillIt monitors</strong>
            <p>
              Approved sources are monitored by the Operations Node, normalised and de-duplicated into incidents, then governed before Runtime publication. Raw feeds never publish directly to this page.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
