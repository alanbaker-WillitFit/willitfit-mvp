"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DestinationMap from "@/components/fly/DestinationMap";
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
  const [slug, setSlug] = useState(sorted[0]?.slug ?? "");
  const selected = sorted.find((item) => item.slug === slug) ?? sorted[0] ?? null;

  function openDestination() {
    if (selected) router.push(`/fly/${selected.slug}`);
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroIntro}>
            <span className={styles.eyebrow}>WillItFly · RC1</span>
            <h1>Know before you go.</h1>
            <p>Choose a governed destination to see its location and open the practical travel answers available in Runtime.</p>
          </div>

          <div className={styles.searchPanel}>
            <div className={styles.searchForm}>
              <select
                aria-label="Choose destination"
                value={selected?.slug ?? ""}
                onChange={(event) => setSlug(event.target.value)}
                disabled={sorted.length === 0}
              >
                {sorted.length === 0 ? <option>No governed destinations available</option> : null}
                {sorted.map((destination) => (
                  <option value={destination.slug} key={destination.destinationId}>
                    {destination.displayName}
                  </option>
                ))}
              </select>
              <button type="button" onClick={openDestination} disabled={!selected}>View destination</button>
            </div>
          </div>

          <div className={styles.mapFrame}>
            <DestinationMap
              destinationName={selected?.displayName ?? "WillItFly"}
              latitude={selected?.latitude ?? null}
              longitude={selected?.longitude ?? null}
            />
          </div>

          <div className={styles.identityCard}>
            {selected ? (
              <>
                <div className={styles.identityHeader}>
                  {selected.displayFlagEmoji ? <span className={styles.flag} aria-hidden="true">{selected.displayFlagEmoji}</span> : null}
                  <div>
                    <h2>{selected.displayName}</h2>
                    <p>{selected.destinationType.toLowerCase()}</p>
                  </div>
                </div>
                <p className={styles.identityMeta}>Governed destination ID: {selected.destinationId}</p>
                <button type="button" className={styles.hierarchyLink} onClick={openDestination}>Open destination answers →</button>
              </>
            ) : (
              <p className={styles.emptyNote}>Runtime is connected, but no governed destination is currently available.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
