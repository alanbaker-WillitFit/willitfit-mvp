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

export default function WillItFlyHomeExperience({ destinations }: Props) {
  const router = useRouter();
  const sorted = useMemo(
    () => [...destinations].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [destinations],
  );
  const [query, setQuery] = useState("");
  const selected = useMemo(
    () => resolveDestinationSearch(sorted, query),
    [query, sorted],
  );
  const suggestions = useMemo(
    () => suggestDestinationSearch(sorted, query),
    [query, sorted],
  );

  function openDestination() {
    if (selected) router.push(`/fly/${selected.slug}`);
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroIntro}>
            <span className={styles.eyebrow}>WillItFly</span>
            <h1>Know before you go.</h1>
            <p>Search a destination to see its location and practical travel answers, with source-backed information shown where available.</p>
          </div>

          <div className={styles.searchPanel}>
            <form
              className={styles.searchForm}
              onSubmit={(event) => {
                event.preventDefault();
                openDestination();
              }}
            >
              <input
                aria-label="Search destination"
                aria-describedby="destination-search-hint destination-search-status"
                autoComplete="off"
                disabled={sorted.length === 0}
                list="willitfly-destination-options"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search country or destination"
                type="search"
                value={query}
              />
              <datalist id="willitfly-destination-options">
                {suggestions.flatMap((destination) => [
                  <option
                    key={`${destination.destinationId}:name`}
                    value={destination.displayName}
                  />,
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
          </div>

          <div className={styles.mapFrame}>
            <DestinationMap
              destinationName={selected?.displayName ?? "WillItFly"}
              latitude={selected?.latitude ?? null}
              longitude={selected?.longitude ?? null}
            />
          </div>

          <div
            className={styles.identityCard}
            data-destination-id={selected?.destinationId || undefined}
          >
            {selected ? (
              <>
                <div className={styles.identityHeader}>
                  {selected.displayFlagEmoji ? <span className={styles.flag} aria-hidden="true">{selected.displayFlagEmoji}</span> : null}
                  <div>
                    <h2>{selected.displayName}</h2>
                    <p>{selected.destinationType.toLowerCase()}</p>
                  </div>
                </div>
                <button type="button" className={styles.hierarchyLink} onClick={openDestination}>Open destination answers →</button>
              </>
            ) : (
              <p className={styles.emptyNote}>
                {sorted.length === 0
                  ? "No destinations are currently available."
                  : "Search for a destination to preview its location."}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
