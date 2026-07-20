import { cache } from "react";
import type { Airline } from "@/types";
import { getCachedAirlines } from "./airlines";
import { getTipsForAirline } from "./tips";

export interface AirlinePageData {
  airline: Airline | null;
  airlines: Airline[];
  relatedAirlines: Airline[];
  tips: Awaited<ReturnType<typeof getTipsForAirline>>["tips"];
  source: "sheet" | "fallback";
}

function scoreRelated(current: Airline, candidate: Airline): number {
  let score = 0;
  if (candidate.country && candidate.country === current.country) score += 4;
  const cabinDelta = Math.abs(
    candidate.cabinBag.heightCm * candidate.cabinBag.widthCm * candidate.cabinBag.depthCm -
      current.cabinBag.heightCm * current.cabinBag.widthCm * current.cabinBag.depthCm
  );
  const personalDelta = Math.abs(
    candidate.personalItem.heightCm * candidate.personalItem.widthCm * candidate.personalItem.depthCm -
      current.personalItem.heightCm * current.personalItem.widthCm * current.personalItem.depthCm
  );
  score += Math.max(0, 3 - cabinDelta / 10000);
  score += Math.max(0, 2 - personalDelta / 5000);
  return score;
}

export function selectRelatedAirlines(current: Airline, airlines: Airline[], limit = 4): Airline[] {
  return airlines
    .filter((airline) => airline.airlineId !== current.airlineId)
    .map((airline) => ({ airline, score: scoreRelated(current, airline) }))
    .sort((a, b) => b.score - a.score || a.airline.airlineName.localeCompare(b.airline.airlineName))
    .slice(0, limit)
    .map(({ airline }) => airline);
}

async function loadAirlinePageData(slug: string): Promise<AirlinePageData> {
  const { airlines, source } = await getCachedAirlines();
  const airline = airlines.find((item) => item.slug === slug) ?? null;
  if (!airline) return { airline: null, airlines, relatedAirlines: [], tips: [], source };

  const { tips } = await getTipsForAirline(airline.airlineName, 6);
  return {
    airline,
    airlines,
    relatedAirlines: selectRelatedAirlines(airline, airlines),
    tips,
    source,
  };
}

export const getAirlinePageData = cache(loadAirlinePageData);
