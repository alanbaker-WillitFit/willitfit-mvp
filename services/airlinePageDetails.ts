import { cache } from "react";
import { readFirstAvailableRuntimeTab, runtimePublished } from "./runtimeContent";
import { AIRLINE_TABS, BAGGAGE_RULE_TABS } from "./runtimeSources";

type RuntimeRow = Record<string, string>;

export type WeightStatus = "published" | "not-published" | "not-applicable" | "unknown";

export interface FareEditorialDetail {
  fareClass: string;
  description: string;
  weightStatus: WeightStatus;
  weightGuidance: string;
}

export interface AirlinePageDetails {
  oversizedSummary: string;
  oversizedPolicyUrl: string;
  fareDetails: Record<string, FareEditorialDetail>;
}

function value(row: RuntimeRow, ...names: string[]): string {
  for (const name of names) {
    const candidate = String(row[name] ?? "").trim();
    if (candidate) return candidate;
  }
  return "";
}

function normaliseWeightStatus(input: string): WeightStatus {
  const value = input.trim().toLowerCase().replace(/[_-]+/g, " ");
  if (value === "published") return "published";
  if (value === "not published" || value === "unpublished") return "not-published";
  if (value === "not applicable" || value === "n/a") return "not-applicable";
  return "unknown";
}

async function loadAirlinePageDetails(airlineId: string): Promise<AirlinePageDetails> {
  const [airlineRead, baggageRead] = await Promise.all([
    readFirstAvailableRuntimeTab<RuntimeRow>(AIRLINE_TABS),
    readFirstAvailableRuntimeTab<RuntimeRow>(BAGGAGE_RULE_TABS),
  ]);

  const airlineRow = airlineRead.rows
    ?.filter(runtimePublished)
    .find((row) => value(row, "Airline ID", "AirlineID") === airlineId);

  const fareDetails: Record<string, FareEditorialDetail> = {};
  for (const row of baggageRead.rows?.filter(runtimePublished) ?? []) {
    if (value(row, "Airline ID", "AirlineID") !== airlineId) continue;
    const fareClass = value(row, "Fare", "Fare Class", "FareClass");
    if (!fareClass) continue;

    const existing = fareDetails[fareClass];
    const description = value(row, "Fare Description", "FareDescription");
    const weightStatus = normaliseWeightStatus(value(row, "Weight Status", "WeightStatus"));
    const weightGuidance = value(row, "Weight Guidance", "WeightGuidance");

    fareDetails[fareClass] = {
      fareClass,
      description: description || existing?.description || "",
      weightStatus: weightStatus !== "unknown" ? weightStatus : existing?.weightStatus ?? "unknown",
      weightGuidance: weightGuidance || existing?.weightGuidance || "",
    };
  }

  return {
    oversizedSummary: airlineRow ? value(airlineRow, "Oversized Summary", "OversizedSummary") : "",
    oversizedPolicyUrl: airlineRow ? value(airlineRow, "Oversized Policy URL", "OversizedPolicyURL") : "",
    fareDetails,
  };
}

export const getAirlinePageDetails = cache(loadAirlinePageDetails);
