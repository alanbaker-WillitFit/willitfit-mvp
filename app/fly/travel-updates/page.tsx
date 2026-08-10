import type { Metadata } from "next";
import Link from "next/link";
import {
  canShowAllClear,
  resolveDestinationLiveIncidents,
  type RuntimeLiveIncident,
  type WillItFlyLiveTopic,
} from "@/lib/willitflyLiveIntelligence";
import {
  getWillItFlyRuntimeBundle,
  resolveWillItFlyPublicSource,
  type WillItFlyPublicSource,
} from "@/services/willitflyRuntime";
import styles from "./TravelUpdates.module.css";

export const metadata: Metadata = {
  title: "Travel Updates",
  description: "Current governed travel updates that may materially affect your trip, monitored by WillItFly and presented as practical traveller impact.",
  robots: { index: false, follow: false },
};

const TOPICS: Array<{ key: "ALL" | WillItFlyLiveTopic; label: string }> = [
  { key: "ALL", label: "All" },
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

function filterHref(topic: "ALL" | WillItFlyLiveTopic, destinationId?: string): string {
  const params = new URLSearchParams();
  if (topic !== "ALL") params.set("topic", topic);
  if (destinationId) params.set("destination", destinationId);
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
  const selectedDestinationId = one(params.destination)?.trim() || undefined;
  const requestedTopic = one(params.topic)?.trim().toUpperCase();
  const selectedTopic = requestedTopic && LIVE_TOPIC_KEYS.has(requestedTopic as WillItFlyLiveTopic)
    ? requestedTopic as WillItFlyLiveTopic
    : undefined;

  const incidents = resolveDestinationLiveIncidents(
    bundle.liveIncidents,
    selectedDestinationId,
    selectedTopic,
  );

  const destinations = bundle.destinations
    .filter((destination) => bundle.liveIncidents.some((incident) => incident.destinationIds.includes(destination.destinationId)))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const destination = selectedDestinationId
    ? bundle.destinations.find((item) => item.destinationId === selectedDestinationId)
    : undefined;

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
          <p className={styles.eyebrow}>WillIt Live Intelligence</p>
          <h1>Travel Updates</h1>
          <p className={styles.lead}>
            The important things that may affect your trip, distilled from governed monitoring into practical traveller impact.
          </p>
          <div className={styles.trustLine}>
            <span>Monitored by the WillIt Operations Node</span>
            <span aria-hidden="true">•</span>
            <span>RSS, APIs and permitted source changes are inputs—not the product</span>
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
                  href={filterHref(topic.key, selectedDestinationId)}
                  className={active ? styles.topicActive : styles.topicLink}
                  aria-current={active ? "page" : undefined}
                >
                  {topic.label}
                </Link>
              );
            })}
          </div>

          <form className={styles.destinationForm} method="get">
            {selectedTopic ? <input type="hidden" name="topic" value={selectedTopic} /> : null}
            <label htmlFor="destination">Destination</label>
            <select id="destination" name="destination" defaultValue={selectedDestinationId || ""}>
              <option value="">All monitored destinations</option>
              {destinations.map((item) => (
                <option value={item.destinationId} key={item.destinationId}>{item.displayName}</option>
              ))}
            </select>
            <button type="submit">Apply</button>
            {selectedDestinationId ? <Link href={filterHref(selectedTopic || "ALL")}>Clear</Link> : null}
          </form>
        </div>
      </section>

      <section className={styles.results} aria-live="polite">
        <div className={styles.container}>
          <div className={styles.resultsHeader}>
            <div>
              <p className={styles.resultContext}>
                {destination ? destination.displayName : "All monitored destinations"}
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
                  <article className={styles.updateCard} key={incident.incidentId}>
                    <div className={styles.cardTopline}>
                      <span className={styles.topicBadge}>{TOPIC_LABELS[incident.topic]}</span>
                      <span className={`${styles.severityBadge} ${styles[`severity${incident.severity}`]}`}>
                        {SEVERITY_LABELS[incident.severity]}
                      </span>
                    </div>
                    <p className={styles.location}>{primaryDestination?.displayName || incident.primaryDestinationId}</p>
                    <h3>{incident.headline}</h3>
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
                      <summary>More</summary>
                      {incident.summary ? <p>{incident.summary}</p> : null}
                      {sources.length > 0 ? (
                        <div className={styles.sources}>
                          <strong>Sources</strong>
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
            <div className={styles.allClear}>
              <span className={styles.allClearIcon} aria-hidden="true">✓</span>
              <div>
                <h3>All clear</h3>
                <p>No significant current issues are published for this monitored selection.</p>
                {latestCheck ? <small>Monitoring last checked {formatChecked(latestCheck.toISOString())}.</small> : null}
              </div>
            </div>
          ) : (
            <div className={styles.unavailable}>
              <span className={styles.unavailableIcon} aria-hidden="true">◎</span>
              <div>
                <h3>No verified update status is available</h3>
                <p>
                  WillIt does not infer “All clear” from an empty feed. A fresh governed monitoring-status record is required before that reassurance can be shown.
                </p>
              </div>
            </div>
          )}

          <aside className={styles.methodNote}>
            <strong>How this works</strong>
            <p>
              Approved sources are monitored by the Pi, normalised and de-duplicated into incidents, then governed before Runtime publication. The website never reads raw Pi feeds or operational stores directly.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
