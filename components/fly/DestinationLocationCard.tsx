import Link from "next/link";
import {
  currentTimeDifferenceFromUk,
  formatAverageFlightTime,
  formatTimeDifference,
} from "@/lib/willitflyJourneyContext";
import type { WillItFlyDestination } from "@/services/willitflyRuntime";
import styles from "./DestinationCards.module.css";

export type DestinationLocationCardProps = {
  destination: WillItFlyDestination;
  parentDestination?: WillItFlyDestination | null;
  childDestinations?: WillItFlyDestination[];
  averageFlightMinutes?: number | null;
  destinationTimeZone?: string | null;
  multipleTimeZones?: boolean;
};

export default function DestinationLocationCard({
  destination,
  parentDestination = null,
  childDestinations = [],
  averageFlightMinutes = null,
  destinationTimeZone = null,
  multipleTimeZones = false,
}: DestinationLocationCardProps) {
  const isCountry = destination.destinationType === "COUNTRY";
  const flightTime = averageFlightMinutes ? formatAverageFlightTime(averageFlightMinutes) : null;
  const timeDifferenceMinutes = destinationTimeZone
    ? currentTimeDifferenceFromUk(destinationTimeZone)
    : null;
  const timeDifference = timeDifferenceMinutes === null
    ? (multipleTimeZones ? "Multiple time zones" : null)
    : formatTimeDifference(timeDifferenceMinutes);
  const hasHierarchyOptions = Boolean(parentDestination || childDestinations.length > 0);

  const details = [
    isCountry && destination.capitalName
      ? { label: "Capital", value: destination.capitalName }
      : null,
    flightTime
      ? { label: "Flight from UK", value: flightTime }
      : null,
    timeDifference
      ? { label: "Time", value: timeDifference }
      : null,
    destination.regionId
      ? { label: "Region", value: destination.regionId }
      : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <aside className={styles.locationCard} aria-labelledby="destination-location-title">
      <div className={styles.locationHeading}>
        {destination.displayFlagEmoji ? (
          <span className={styles.flag} aria-hidden="true">{destination.displayFlagEmoji}</span>
        ) : null}
        <div>
          <p className={styles.eyebrow}>Destination</p>
          <h2 id="destination-location-title">{destination.displayName}</h2>
          <p className={styles.locationMeta}>{isCountry ? "Country" : destination.destinationType.toLowerCase()}</p>
        </div>
      </div>

      {details.length > 0 ? (
        <dl className={styles.contextRail}>
          {details.map((detail) => (
            <div className={styles.contextItem} key={detail.label}>
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={styles.locationUnavailable}>Additional destination context is not yet available.</p>
      )}

      {hasHierarchyOptions ? (
        <nav className={styles.hierarchy} aria-label={`More ${destination.displayName} destination options`}>
          <p className={styles.hierarchyTitle}>More destination options</p>
          <div className={styles.hierarchyLinks}>
            {parentDestination ? (
              <Link href={`/fly/${parentDestination.slug}`} className={styles.hierarchyLink}>
                {parentDestination.displayName}
              </Link>
            ) : null}
            {childDestinations.map((child) => (
              <Link href={`/fly/${child.slug}`} className={styles.hierarchyLink} key={child.destinationId}>
                {child.displayName}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </aside>
  );
}
