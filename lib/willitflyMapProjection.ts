export type WillItFlyMapPoint = {
  xPercent: number;
  yPercent: number;
};

export type WillItFlyMapCalibration = {
  /** Normalised horizontal bounds occupied by the geographic map inside A01. */
  left: number;
  right: number;
  /** Normalised vertical bounds occupied by the geographic map inside A01. */
  top: number;
  bottom: number;
  /** Northern/southern latitude represented by the visible A01 artwork. */
  maxLatitude: number;
  minLatitude: number;
};

/**
 * A01 — WillItFly embossed hero world map calibration.
 *
 * The source artwork is 1264 x 843 and includes intentional whitespace around
 * the geographic plate. Runtime remains authoritative for latitude/longitude;
 * these values describe only how that geographic truth is projected onto A01.
 *
 * Keep this calibration build-owned. Never store per-destination x/y positions
 * in Runtime as a substitute for latitude/longitude.
 */
export const WILLITFLY_HERO_MAP_CALIBRATION_V1: WillItFlyMapCalibration = {
  left: 0.055,
  right: 0.985,
  top: 0.07,
  bottom: 0.87,
  maxLatitude: 83,
  minLatitude: -58,
};

function isFiniteCoordinate(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * Project a governed Runtime latitude/longitude onto the A01 hero map.
 *
 * Returns null rather than guessing when coordinates are absent, invalid, or
 * outside the latitude represented by the artwork. Longitude uses the full
 * world span; latitude is mapped inside A01's calibrated visible plate.
 */
export function projectLatLongToHeroMap(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  calibration: WillItFlyMapCalibration = WILLITFLY_HERO_MAP_CALIBRATION_V1,
): WillItFlyMapPoint | null {
  if (!isFiniteCoordinate(latitude) || !isFiniteCoordinate(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  if (latitude < calibration.minLatitude || latitude > calibration.maxLatitude) return null;

  const horizontalSpan = calibration.right - calibration.left;
  const verticalSpan = calibration.bottom - calibration.top;
  if (horizontalSpan <= 0 || verticalSpan <= 0) return null;
  if (calibration.maxLatitude <= calibration.minLatitude) return null;

  const longitudeRatio = (longitude + 180) / 360;
  const latitudeRatio =
    (calibration.maxLatitude - latitude) /
    (calibration.maxLatitude - calibration.minLatitude);

  return {
    xPercent: round((calibration.left + longitudeRatio * horizontalSpan) * 100),
    yPercent: round((calibration.top + latitudeRatio * verticalSpan) * 100),
  };
}
