import DestinationMap from "@/components/fly/DestinationMap";
import type { WillItFlyDestination } from "@/services/willitflyRuntime";
import styles from "./DestinationCards.module.css";

export type DestinationLocationCardProps = {
  destination: WillItFlyDestination;
};

export default function DestinationLocationCard({ destination }: DestinationLocationCardProps) {
  const isCountry = destination.destinationType === "COUNTRY";

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
