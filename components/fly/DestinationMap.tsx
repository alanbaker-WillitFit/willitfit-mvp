"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./DestinationMap.module.css";
import { projectLatLongToHeroMap } from "@/lib/willitflyMapProjection";
import {
  getWillItFlyMarkerFrame,
  WILLITFLY_LOCATION_MARKER_FRAME_MS,
} from "@/lib/willitflyMarker";
import {
  WILLITFLY_HERO_MAP_ASSET,
  WILLITFLY_LOCATION_MARKER_ASSETS,
} from "@/lib/willitflyAssets";

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
  markerFrames?: readonly [string, string, string];
  className?: string;
};

export default function DestinationMap({
  destinationName,
  latitude,
  longitude,
  journeyPoints,
  mapSrc = WILLITFLY_HERO_MAP_ASSET,
  markerFrames = WILLITFLY_LOCATION_MARKER_ASSETS,
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
  const [step, setStep] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if ((!point && projectedJourney.length === 0) || reducedMotion) return;
    const timer = window.setInterval(
      () => setStep(current => current + 1),
      WILLITFLY_LOCATION_MARKER_FRAME_MS,
    );
    return () => window.clearInterval(timer);
  }, [point, projectedJourney.length, reducedMotion]);

  const frameIndex = reducedMotion ? 1 : getWillItFlyMarkerFrame(step);
  const markerSrc = markerFrames[frameIndex] ?? markerFrames[0];
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
          <img src={markerSrc} alt="" />
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
