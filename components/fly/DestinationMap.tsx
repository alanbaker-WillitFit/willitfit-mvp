"use client";

import { useEffect, useMemo, useState } from "react";
import { projectLatLongToHeroMap } from "@/lib/willitflyMapProjection";
import {
  getWillItFlyMarkerFrame,
  WILLITFLY_LOCATION_MARKER_FRAME_MS,
} from "@/lib/willitflyMarker";

export type DestinationMapProps = {
  destinationName: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  mapSrc: string;
  markerFrames: readonly [string, string, string];
  className?: string;
};

export default function DestinationMap({
  destinationName,
  latitude,
  longitude,
  mapSrc,
  markerFrames,
  className,
}: DestinationMapProps) {
  const point = useMemo(
    () => projectLatLongToHeroMap(latitude, longitude),
    [latitude, longitude],
  );
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
    if (!point || reducedMotion) return;
    const timer = window.setInterval(
      () => setStep(current => current + 1),
      WILLITFLY_LOCATION_MARKER_FRAME_MS,
    );
    return () => window.clearInterval(timer);
  }, [point, reducedMotion]);

  const frameIndex = reducedMotion ? 1 : getWillItFlyMarkerFrame(step);
  const markerSrc = markerFrames[frameIndex] ?? markerFrames[0];

  return (
    <figure
      className={["wif-destination-map", className].filter(Boolean).join(" ")}
      data-has-location={point ? "true" : "false"}
      aria-label={point ? `Map showing ${destinationName}` : "WillItFly world map"}
    >
      <img className="wif-destination-map__map" src={mapSrc} alt="" aria-hidden="true" />
      {point ? (
        <span
          className="wif-destination-map__marker"
          style={{ left: `${point.xPercent}%`, top: `${point.yPercent}%` }}
          aria-hidden="true"
        >
          <img src={markerSrc} alt="" />
        </span>
      ) : null}
      <figcaption className="sr-only">
        {point
          ? `${destinationName} is marked on the WillItFly world map.`
          : "No governed map coordinate is available for this destination."}
      </figcaption>
    </figure>
  );
}
