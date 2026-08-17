export type GlobeCoordinate = {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
};

export type GlobeProjectedPoint = {
  xPercent: number;
  yPercent: number;
  visible: boolean;
};

export type GlobeOrientation = {
  latitude: number;
  longitude: number;
};

const DEG_TO_RAD = Math.PI / 180;

function isValidLatitude(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

export function hasGovernedGlobeCoordinate(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): latitude is number {
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) return false;
  return !(latitude === 0 && longitude === 0);
}

export function getGlobeOrientation(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): GlobeOrientation | null {
  if (!hasGovernedGlobeCoordinate(latitude, longitude)) return null;
  return { latitude, longitude: longitude as number };
}

export function projectCoordinateToGlobe(
  coordinate: GlobeCoordinate,
  orientation: GlobeOrientation | null,
): GlobeProjectedPoint | null {
  if (!orientation || !hasGovernedGlobeCoordinate(coordinate.latitude, coordinate.longitude)) return null;

  const latitude = coordinate.latitude as number;
  const longitude = coordinate.longitude as number;
  const lat = latitude * DEG_TO_RAD;
  const lon = longitude * DEG_TO_RAD;
  const centreLat = orientation.latitude * DEG_TO_RAD;
  const centreLon = orientation.longitude * DEG_TO_RAD;
  const deltaLon = lon - centreLon;

  const cosC = Math.sin(centreLat) * Math.sin(lat)
    + Math.cos(centreLat) * Math.cos(lat) * Math.cos(deltaLon);

  const x = Math.cos(lat) * Math.sin(deltaLon);
  const y = Math.cos(centreLat) * Math.sin(lat)
    - Math.sin(centreLat) * Math.cos(lat) * Math.cos(deltaLon);

  return {
    xPercent: 50 + x * 46,
    yPercent: 50 - y * 46,
    visible: cosC >= 0,
  };
}

export function getTexturePosition(orientation: GlobeOrientation | null) {
  if (!orientation) return { xPercent: 50, yPercent: 50 };

  return {
    xPercent: ((orientation.longitude + 180) / 360) * 100,
    yPercent: 50 - orientation.latitude * 0.16,
  };
}
