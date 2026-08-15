"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DestinationMap from "@/components/fly/DestinationMap";
import {
  resolveDestinationSearch,
  suggestDestinationSearch,
} from "@/lib/willitflyDestinationSearch";
import type { WillItFlyDestination } from "@/services/willitflyRuntime";
import styles from "./WillItFlyExperience.module.css";

type Props = {
  destinations: WillItFlyDestination[];
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function WillItFlyHomeExperience({ destinations }: Props) {
  const router = useRouter();
  const sorted = useMemo(
    () => [...destinations].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [destinations],
  );
  const defaultOrigin = useMemo(
    () => resolveDestinationSearch(sorted, "UK") || sorted.find(item => item.destinationId === "DEST-GBR") || null,
    [sorted],
  );

  const [query, setQuery] = useState("");
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [originQuery, setOriginQuery] = useState(defaultOrigin?.displayName || "");
  const [extraQuery, setExtraQuery] = useState("");
  const [extraDestinationIds, setExtraDestinationIds] = useState<string[]>([]);
  const [travelMonth, setTravelMonth] = useState("");

  const selected = useMemo(
    () => resolveDestinationSearch(sorted, query),
    [query, sorted],
  );
  const origin = useMemo(
    () => resolveDestinationSearch(sorted, originQuery) || defaultOrigin,
    [defaultOrigin, originQuery, sorted],
  );
  const extraCandidate = useMemo(
    () => resolveDestinationSearch(sorted, extraQuery),
    [extraQuery, sorted],
  );
  const extraDestinations = useMemo(
    () => extraDestinationIds
      .map(id => sorted.find(item => item.destinationId === id))
      .filter((item): item is WillItFlyDestination => Boolean(item)),
    [extraDestinationIds, sorted],
  );
  const suggestions = useMemo(
    () => suggestDestinationSearch(sorted, query),
    [query, sorted],
  );
  const originSuggestions = useMemo(
    () => suggestDestinationSearch(sorted, originQuery),
    [originQuery, sorted],
  );
  const extraSuggestions = useMemo(
    () => suggestDestinationSearch(sorted, extraQuery),
    [extraQuery, sorted],
  );
  const journeyPoints = useMemo(() => {
    const points = [origin, selected, ...extraDestinations].filter(
      (item): item is WillItFlyDestination => Boolean(item),
    );
    return points.map(item => ({
      id: item.destinationId,
      name: item.displayName,
      latitude: item.latitude,
      longitude: item.longitude,
    }));
  }, [extraDestinations, origin, selected]);

  function openDestination() {
    if (selected) router.push(`/fly/${selected.slug}`);
  }

  function addExtraDestination() {
    if (!extraCandidate) return;
    if (extraCandidate.destinationId === selected?.destinationId || extraCandidate.destinationId === origin?.destinationId) return;
    setExtraDestinationIds(current => current.includes(extraCandidate.destinationId)
      ? current
      : [...current, extraCandidate.destinationId]);
    setExtraQuery("");
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroMap}>
          <h1 className="sr-only">Know before you go.</h1>
          <DestinationMap
            destinationName={selected?.displayName ?? "WillItFly"}
            latitude={selected?.latitude ?? null}
            longitude={selected?.longitude ?? null}
            journeyPoints={selected ? journeyPoints : undefined}
            className={styles.heroDestinationMap}
          />

          <div className={styles.heroSearchDock}>
            <div className={styles.searchPanel}>
              <form
                className={styles.searchForm}
                onSubmit={(event) => {
                  event.preventDefault();
                  openDestination();
                }}
              >
                <input
                  aria-label="Where are you travelling?"
                  aria-describedby="destination-search-hint destination-search-status"
                  autoComplete="off"
                  disabled={sorted.length === 0}
                  list="willitfly-destination-options"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Where are you travelling?"
                  type="search"
                  value={query}
                />
                <datalist id="willitfly-destination-options">
                  {suggestions.flatMap((destination) => [
                    <option key={`${destination.destinationId}:name`} value={destination.displayName} />,
                    ...destination.aliases.map((alias) => (
                      <option
                        key={`${destination.destinationId}:alias:${alias}`}
                        label={`${destination.displayName} — alias`}
                        value={alias}
                      />
                    )),
                  ])}
                </datalist>
                <button type="submit" disabled={!selected}>View destination</button>
              </form>
              <p className={styles.searchHint} id="destination-search-hint">
                Search by destination name or recognised alias, for example UK or USA.
              </p>
              <p className={styles.searchStatus} id="destination-search-status" aria-live="polite">
                {sorted.length === 0
                  ? "No destinations are currently available."
                  : selected
                    ? `Matched ${selected.displayName}.`
                    : query.trim()
                      ? "Choose a suggestion or enter a complete destination name or alias."
                      : "Start typing to find a destination."}
              </p>

              {selected ? (
                <div className={styles.journeyDisclosure}>
                  <button
                    type="button"
                    className={styles.journeyToggle}
                    aria-expanded={journeyOpen}
                    aria-controls="willitfly-journey-options"
                    onClick={() => setJourneyOpen(current => !current)}
                  >
                    {journeyOpen ? "Fewer journey options" : "More journey options…"}
                  </button>

                  {journeyOpen ? (
                    <div className={styles.journeyOptions} id="willitfly-journey-options">
                      <div className={styles.journeyField}>
                        <label htmlFor="willitfly-origin">Travelling from</label>
                        <input
                          id="willitfly-origin"
                          list="willitfly-origin-options"
                          onChange={(event) => setOriginQuery(event.target.value)}
                          type="search"
                          value={originQuery}
                        />
                        <datalist id="willitfly-origin-options">
                          {originSuggestions.map(item => <option key={item.destinationId} value={item.displayName} />)}
                        </datalist>
                        <span>{origin ? `Origin: ${origin.displayName}` : "Choose a governed origin."}</span>
                      </div>

                      <div className={styles.journeyField}>
                        <label htmlFor="willitfly-month">Travel month <span>(optional)</span></label>
                        <select id="willitfly-month" value={travelMonth} onChange={(event) => setTravelMonth(event.target.value)}>
                          <option value="">No month selected</option>
                          {MONTHS.map(month => <option key={month} value={month}>{month}</option>)}
                        </select>
                      </div>

                      <div className={styles.journeyField}>
                        <label htmlFor="willitfly-extra-stop">Add another destination <span>(optional)</span></label>
                        <div className={styles.extraStopRow}>
                          <input
                            id="willitfly-extra-stop"
                            list="willitfly-extra-options"
                            onChange={(event) => setExtraQuery(event.target.value)}
                            placeholder="Search another destination"
                            type="search"
                            value={extraQuery}
                          />
                          <button type="button" onClick={addExtraDestination} disabled={!extraCandidate}>Add</button>
                        </div>
                        <datalist id="willitfly-extra-options">
                          {extraSuggestions.map(item => <option key={item.destinationId} value={item.displayName} />)}
                        </datalist>
                      </div>

                      {extraDestinations.length > 0 ? (
                        <ol className={styles.journeyStops} aria-label="Additional journey destinations">
                          {extraDestinations.map((item, index) => (
                            <li key={item.destinationId}>
                              <span>{index + 2}. {item.displayName}</span>
                              <button
                                type="button"
                                onClick={() => setExtraDestinationIds(current => current.filter(id => id !== item.destinationId))}
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ol>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {selected ? (
          <div className={styles.container}>
            <div
              className={styles.identityCard}
              data-destination-id={selected.destinationId}
              data-origin-id={origin?.destinationId || undefined}
              data-travel-month={travelMonth || undefined}
            >
              <div className={styles.identityHeader}>
                {selected.displayFlagEmoji ? <span className={styles.flag} aria-hidden="true">{selected.displayFlagEmoji}</span> : null}
                <div>
                  <h2>{selected.displayName}</h2>
                  <p>{selected.destinationType.toLowerCase()}</p>
                </div>
              </div>
              <p className={styles.identityMeta}>
                From {origin?.displayName || "your selected origin"}
                {travelMonth ? ` · ${travelMonth}` : ""}
                {extraDestinations.length ? ` · ${extraDestinations.length + 1} stops` : ""}
              </p>
              <button type="button" className={styles.hierarchyLink} onClick={openDestination}>Open destination answers →</button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
