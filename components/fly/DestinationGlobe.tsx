"use client";

import { useMemo } from "react";
import { WILLITFLY_HERO_MAP_ASSET } from "@/lib/willitflyAssets";
import {
  getGlobeOrientation,
  getTexturePosition,
  projectCoordinateToGlobe,
} from "@/lib/willitflyGlobeProjection";
import type { JourneyMapPoint } from "./DestinationMap";
import styles from "./DestinationGlobe.module.css";

export type DestinationGlobeProps = {
  destinationName: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  journeyPoints?: JourneyMapPoint[];
  className?: string;
};

export default function DestinationGlobe({
  destinationName,
  latitude,
  longitude,
  journeyPoints,
  className,
}: DestinationGlobeProps) {
  const orientation = useMemo(
    () => getGlobeOrientation(latitude, longitude),
    [latitude, longitude],
  );
  const texturePosition = useMemo(
    () => getTexturePosition(orientation),
    [orientation],
  );
  const selectedPoint = useMemo(
    () => projectCoordinateToGlobe({ latitude, longitude }, orientation),
    [latitude, longitude, orientation],
  );
  const projectedJourney = useMemo(
    () => (journeyPoints || [])
      .map((point) => ({
        ...point,
        projected: projectCoordinateToGlobe(point, orientation),
      }))
      .filter((point) => point.projected !== null),
    [journeyPoints, orientation],
  );

  const journeyVisible = projectedJourney.length > 1;
  const activePoints = journeyVisible
    ? projectedJourney
    : selectedPoint
      ? [{ id: "selected", name: destinationName, latitude, longitude, projected: selectedPoint }]
      : [];

  return (
    <figure
      className={[styles.stage, className].filter(Boolean).join(" ")}
      data-has-location={orientation ? "true" : "false"}
      aria-label={orientation ? `Interactive globe focused on ${destinationName}` : "WillItFly interactive globe"}
    >
      {!orientation ? (
        <div className={styles.neutralLabel}>
          <h2>Know before you fly.</h2>
          <p>Practical, trustworthy destination information without the clutter.</p>
        </div>
      ) : null}

      <div className={styles.globeWrap} aria-hidden="true">
        <div className={styles.globeShadow} />
        <div className={styles.globe}>
          <div
            className={`${styles.texture} ${!orientation ? styles.textureIdle : ""}`}
            style={{
              backgroundImage: `url(${WILLITFLY_HERO_MAP_ASSET})`,
              backgroundPosition: `${texturePosition.xPercent}% ${texturePosition.yPercent}%`,
            }}
          />

          {journeyVisible ? (
            <svg className={styles.routeOverlay} viewBox="0 0 100 100" preserveAspectRatio="none">
              {projectedJourney.slice(0, -1).map((point, index) => {
                const next = projectedJourney[index + 1];
                if (!next || !point.projected?.visible || !next.projected?.visible) return null;
                return (
                  <line
                    key={`${point.id}-${next.id}`}
                    x1={point.projected.xPercent}
                    y1={point.projected.yPercent}
                    x2={next.projected.xPercent}
                    y2={next.projected.yPercent}
                  />
                );
              })}
            </svg>
          ) : null}

          {activePoints.map((point) => {
            if (!point.projected) return null;
            const isSelected = point.id === "selected"
              || point.name === destinationName;
            return (
              <span
                key={point.id}
                className={styles.marker}
                data-selected={isSelected ? "true" : "false"}
                data-visible={point.projected.visible ? "true" : "false"}
                style={{
                  left: `${point.projected.xPercent}%`,
                  top: `${point.projected.yPercent}%`,
                }}
              />
            );
          })}
        </div>
      </div>

      {!orientation && destinationName !== "WillItFly" ? (
        <div className={styles.coordinateUnavailable}>Location unavailable until governed coordinates are approved.</div>
      ) : null}

      <figcaption className="sr-only">
        {orientation
          ? `${destinationName} is shown on the WillItFly globe using governed destination coordinates.`
          : destinationName === "WillItFly"
            ? "Search for a destination to focus the globe."
            : `No governed globe coordinate is available for ${destinationName}.`}
      </figcaption>
    </figure>
  );
}
