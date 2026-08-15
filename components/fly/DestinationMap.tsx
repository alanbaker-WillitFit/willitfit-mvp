"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./DestinationMap.module.css";
import { projectLatLongToHeroMap, type WillItFlyMapPoint } from "@/lib/willitflyMapProjection";
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

type RenderMetrics = {
  containerWidth: number;
  containerHeight: number;
  imageWidth: number;
  imageHeight: number;
};

function projectIntoCoverFrame(point: WillItFlyMapPoint, metrics: RenderMetrics | null): WillItFlyMapPoint {
  if (!metrics) return point;

  const { containerWidth, containerHeight, imageWidth, imageHeight } = metrics;
  if (containerWidth <= 0 || containerHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) return point;

  const scale = Math.max(containerWidth / imageWidth, containerHeight / imageHeight);
  const renderedWidth = imageWidth * scale;
  const renderedHeight = imageHeight * scale;
  const cropX = (renderedWidth - containerWidth) / 2;
  const cropY = (renderedHeight - containerHeight) / 2;

  return {
    xPercent: ((point.xPercent / 100) * renderedWidth - cropX) / containerWidth * 100,
    yPercent: ((point.yPercent / 100) * renderedHeight - cropY) / containerHeight * 100,
  };
}

export default function DestinationMap({
  destinationName,
  latitude,
  longitude,
  journeyPoints,
  mapSrc = WILLITFLY_HERO_MAP_ASSET,
  className,
}: DestinationMapProps) {
  const figureRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [metrics, setMetrics] = useState<RenderMetrics | null>(null);

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

  useEffect(() => {
    const figure = figureRef.current;
    const image = imageRef.current;
    if (!figure || !image) return;

    const sync = () => {
      if (!image.naturalWidth || !image.naturalHeight) return;
      setMetrics({
        containerWidth: figure.clientWidth,
        containerHeight: figure.clientHeight,
        imageWidth: image.naturalWidth,
        imageHeight: image.naturalHeight,
      });
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(figure);
    image.addEventListener("load", sync);

    return () => {
      observer.disconnect();
      image.removeEventListener("load", sync);
    };
  }, [mapSrc]);

  const renderedPoint = useMemo(
    () => point ? projectIntoCoverFrame(point, metrics) : null,
    [metrics, point],
  );
  const renderedJourney = useMemo(
    () => projectedJourney.map((item) => ({ ...item, point: projectIntoCoverFrame(item.point, metrics) })),
    [metrics, projectedJourney],
  );

  const hasJourney = renderedJourney.length > 1;
  const activePoints = hasJourney
    ? renderedJourney
    : renderedPoint
      ? [{ id: "destination", name: destinationName, latitude, longitude, point: renderedPoint }]
      : [];

  return (
    <figure
      ref={figureRef}
      className={[styles.map, className].filter(Boolean).join(" ")}
      data-has-location={activePoints.length > 0 ? "true" : "false"}
      aria-label={hasJourney ? "Map showing the selected journey" : renderedPoint ? `Map showing ${destinationName}` : "WillItFly world map"}
    >
      <img ref={imageRef} className={styles.mapImage} src={mapSrc} alt="" aria-hidden="true" />
      {hasJourney ? (
        <svg className={styles.routeOverlay} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {renderedJourney.slice(0, -1).map((item, index) => {
            const next = renderedJourney[index + 1];
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
          ? `Journey from ${renderedJourney.map(item => item.name).join(" to ")}.`
          : renderedPoint
            ? `${destinationName} is marked on the WillItFly world map.`
            : "No governed map coordinate is available for this destination."}
      </figcaption>
    </figure>
  );
}
