"use client";

import { useMemo } from "react";
import styles from "./DestinationMap.module.css";
import { projectLatLongToHeroMap } from "@/lib/willitflyMapProjection";
import { WILLITFLY_HERO_MAP_ASSET } from "@/lib/willitflyAssets";

export type JourneyMapPoint = {
  id: string;
  name: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
};

export type DestinationMapProps = {
  destinationName: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  journeyPoints?: JourneyMapPoint[];
  mapSrc?: string;
  className?: string;
};

export default function DestinationMap({
  destinationName,
  latitude,
  longitude,
  journeyPoints,
  mapSrc = WILLITFLY_HERO_MAP_ASSET,
  className,
}: DestinationMapProps) {
  const point = useMemo(
    () => projectLatLongToHeroMap(latitude, longitude),
    [latitude, longitude],
  );
  const projectedJourney = useMemo(
    () => (journeyPoints || [])
      .map((item) => ({ ...item, point: projectLatLongToHeroMap(item.latitude, item.longitude) }))
      .filter((item): item is JourneyMapPoint & { point: NonNullable<ReturnType<typeof projectLatLongToHeroMap>> } => Boolean(item.point)),
    [journeyPoints],
  );
  const hasJourney = projectedJourney.length > 1;
  const activePoints = hasJourney
    ? projectedJourney
    : point
      ? [{ id: "destination", name: destinationName, latitude, longitude, point }]
      : [];

  return (
    <figure
      className={[styles.map, className].filter(Boolean).join(" ")}
      data-has-location={activePoints.length > 0 ? "true" : "false"}
      aria-label={hasJourney ? "Map showing the selected journey" : point ? `Map showing ${destinationName}` : "WillItFly world map"}
    >
      <img className={styles.mapImage} src={mapSrc} alt="" aria-hidden="true" />
      {hasJourney ? (
        <svg className={styles.routeOverlay} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {projectedJourney.slice(0, -1).map((item, index) => {
            const next = projectedJourney[index + 1];
            if (!next) return null;
            return (
              <line
                key={`${item.id}-${next.id}`}
                x1={item.point.xPercent}
                y1={item.point.yPercent}
                x2={next.point.xPercent}
                y2={next.point.yPercent}
              />
            );
          })}
        </svg>
      ) : null}
      {activePoints.map((item, index) => (
        <span
          className={styles.marker}
          key={item.id}
          style={{ left: `${item.point.xPercent}%`, top: `${item.point.yPercent}%` }}
          aria-hidden="true"
          data-journey-position={hasJourney ? index : undefined}
        >
          <span className={styles.markerDot} />
        </span>
      ))}
      <figcaption className="sr-only">
        {hasJourney
          ? `Journey from ${projectedJourney.map(item => item.name).join(" to ")}.`
          : point
            ? `${destinationName} is marked on the WillItFly world map.`
            : "No governed map coordinate is available for this destination."}
      </figcaption>
    </figure>
  );
}
