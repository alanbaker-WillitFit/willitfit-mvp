import DestinationMap from "@/components/fly/DestinationMap";
import {
  currentTimeDifferenceFromUk,
  formatAverageFlightTime,
  formatTimeDifference,
} from "@/lib/willitflyJourneyContext";
import type { WillItFlyDestination } from "@/services/willitflyRuntime";
import styles from "./DestinationCards.module.css";

export type DestinationLocationCardProps = {
  destination: WillItFlyDestination;
  averageFlightMinutes?: number | null;
  destinationTimeZone?: string | null;
  multipleTimeZones?: boolean;
};

export default function DestinationLocationCard({
  destination,
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

  return (
    <aside className={styles.locationCard} aria-labelledby="destination-location-title">
      <div className={styles.locationBody}>
        <p className={styles.eyebrow}>Destination</p>
        <div className={styles.locationTitleRow}>
          {destination.displayFlagEmoji ? (
            <span className={styles.flag} aria-hidden="true">{destination.displayFlagEmoji}</span>
          ) : null}
          <h2 id="destination-location-title">{destination.displayName}</h2>
        </div>
        <p className={styles.locationMeta}>
          {isCountry ? "Country" : destination.destinationType.toLowerCase()}
          {destination.regionId ? ` · Region ${destination.regionId}` : ""}
        </p>

        {(flightTime || timeDifference) ? (
          <dl className={styles.journeyFacts}>
            {flightTime ? (
              <div className={styles.journeyFact}>
                <dt>Average flight from UK</dt>
                <dd>{flightTime}</dd>
              </div>
            ) : null}
            {timeDifference ? (
              <div className={styles.journeyFact}>
                <dt>Time difference</dt>
                <dd>{timeDifference}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>
      <div className={styles.mapWrap}>
        <DestinationMap
          destinationName={destination.displayName}
          latitude={destination.latitude}
          longitude={destination.longitude}
        />
      </div>
    </aside>
  );
}
