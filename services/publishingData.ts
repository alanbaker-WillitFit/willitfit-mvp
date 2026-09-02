import { cache } from "react";
import type {
  AirportReferenceV1,
  AviationCurrentV1,
  AviationFreshnessState,
  CommercialSnapshotV1,
} from "@/lib/publishing/contracts";

export type AirportIdentityV1 = {
  airportId: string;
  displayName: string;
  canonicalName?: string;
  slug: string;
  iataCode?: string;
  icaoCode?: string;
  municipality?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  scheduledService?: boolean;
  publish?: boolean;
  displayOrder?: number;
};

type SnapshotEnvelope<T> = {
  contractVersion: "1.0.0";
  generatedAt: string;
  rows: T[];
};

const SNAPSHOT_BASE = process.env.WILLIT_SNAPSHOT_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "";

function snapshotUrl(path: string): string | null {
  if (!SNAPSHOT_BASE) return null;
  try {
    return new URL(path, SNAPSHOT_BASE.endsWith("/") ? SNAPSHOT_BASE : `${SNAPSHOT_BASE}/`).toString();
  } catch {
    return null;
  }
}

async function readJson<T>(path: string, revalidateSeconds: number): Promise<T | null> {
  const url = snapshotUrl(path);
  if (!url) return null;

  try {
    const response = await fetch(url, {
      next: { revalidate: revalidateSeconds },
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch (error) {
    console.error(`[publishing] Snapshot unavailable: ${path}`, error);
    return null;
  }
}

function freshnessFromGeneratedAt(generatedAt: string, nowMs = Date.now()): AviationFreshnessState {
  const generatedMs = Date.parse(generatedAt);
  if (!Number.isFinite(generatedMs)) return "UNAVAILABLE";

  const ageMs = Math.max(0, nowMs - generatedMs);
  if (ageMs <= 10 * 60 * 1000) return "LIVE";
  if (ageMs <= 20 * 60 * 1000) return "DELAYED";
  return "UNAVAILABLE";
}

function enforceAviationFreshness(snapshot: AviationCurrentV1): AviationCurrentV1 {
  const freshness = freshnessFromGeneratedAt(snapshot.generatedAt);

  if (freshness === "UNAVAILABLE") {
    return {
      ...snapshot,
      freshness,
      airports: {},
    };
  }

  return { ...snapshot, freshness };
}

async function loadAirports(): Promise<AirportIdentityV1[]> {
  const snapshot = await readJson<SnapshotEnvelope<AirportIdentityV1>>(
    "/data/v1/willitfit-airports.v1.json",
    3600,
  );
  if (!snapshot || snapshot.contractVersion !== "1.0.0" || !Array.isArray(snapshot.rows)) return [];
  return snapshot.rows.filter((row) => row.publish !== false && Boolean(row.airportId && row.slug && row.displayName));
}

async function loadAirportBySlug(slug: string): Promise<AirportIdentityV1 | null> {
  const airports = await loadAirports();
  return airports.find((airport) => airport.slug === slug) ?? null;
}

async function loadAirportReferences(): Promise<AirportReferenceV1[]> {
  const snapshot = await readJson<SnapshotEnvelope<AirportReferenceV1>>(
    "/data/v1/willitfit-airport-reference.v1.json",
    3600,
  );
  if (!snapshot || snapshot.contractVersion !== "1.0.0" || !Array.isArray(snapshot.rows)) return [];
  return snapshot.rows;
}

async function loadAirportReference(airportId: string): Promise<AirportReferenceV1 | null> {
  const rows = await loadAirportReferences();
  return rows.find((row) => row.airportId === airportId) ?? null;
}

async function loadAviation(): Promise<AviationCurrentV1 | null> {
  const snapshot = await readJson<AviationCurrentV1>("/data/live/aviation-current.v1.json", 60);
  if (!snapshot || snapshot.contractVersion !== "1.0.0") return null;
  return enforceAviationFreshness(snapshot);
}

async function loadCommercial(): Promise<CommercialSnapshotV1 | null> {
  const snapshot = await readJson<CommercialSnapshotV1>("/data/v1/willitfit-commercial.v1.json", 300);
  if (!snapshot || snapshot.contractVersion !== "1.0.0" || !Array.isArray(snapshot.placements)) return null;
  return snapshot;
}

export const getPublishingAirports = cache(loadAirports);
export const getPublishingAirportBySlug = cache(loadAirportBySlug);
export const getAirportReferences = cache(loadAirportReferences);
export const getAirportReference = cache(loadAirportReference);
export const getAviationCurrent = cache(loadAviation);
export const getCommercialSnapshot = cache(loadCommercial);
