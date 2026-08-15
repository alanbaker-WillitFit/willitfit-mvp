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
 * V2 was visually calibrated against the locked A01 source using the existing
 * Sydney, Palma and Wales projection sentinels. The previous V1 plate bounds
 * included too much of A01's decorative whitespace, which pushed European
 * locations too far north and shifted the longitude plate east.
 *
 * Keep this calibration build-owned. Never store per-destination x/y positions
 * in Runtime as a substitute for latitude/longitude.
 */
export const WILLITFLY_HERO_MAP_CALIBRATION_V2: WillItFlyMapCalibration = {
  left: 0.034,
  right: 0.964,
  top: 0.157,
  bottom: 0.848,
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
 *
 * The current Runtime loader historically coerces an empty numeric cell to 0.
 * A paired 0/0 coordinate therefore cannot be trusted as governed location
 * evidence and must fail closed rather than drawing a false marker in the Gulf
 * of Guinea. This guard can be removed once the Runtime numeric parser is
 * migrated to preserve blank cells as null.
 */
export function projectLatLongToHeroMap(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  calibration: WillItFlyMapCalibration = WILLITFLY_HERO_MAP_CALIBRATION_V2,
): WillItFlyMapPoint | null {
  if (!isFiniteCoordinate(latitude) || !isFiniteCoordinate(longitude)) return null;
  if (latitude === 0 && longitude === 0) return null;
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
