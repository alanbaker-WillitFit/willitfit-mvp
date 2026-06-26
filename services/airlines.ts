import { Airline } from "@/types";
import { getSheetRows, toNumber, slugify } from "./googleSheets";
import { FALLBACK_AIRLINES } from "@/data/fallback";

type AirlineRow = {
  AirlineID: string;
  AirlineName: string;
  Slug: string;
  Country: string;
  AirlineType: string;
  OfficialBaggageURL: string;
  Status: string;
  LastChecked: string;
  Notes: string;
};

type BaggageRuleRow = {
  RuleID: string;
  AirlineID: string;
  FareClass: string;
  BagType: string;
  IncludedInFare: string;
  HeightCm: string;
  WidthCm: string;
  DepthCm: string;
  WeightKg: string;
  Quantity: string;
  Storage: string;
  PriorityAllowed: string;
  PaidUpgradeRequired?: string;
  Status?: string;
  Notes?: string;
};

function normalise(value: string | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function isCabinBag(rule: BaggageRuleRow): boolean {
  return normalise(rule.BagType).includes("cabin");
}

function isPersonalItem(rule: BaggageRuleRow): boolean {
  const bagType = normalise(rule.BagType);
  return bagType.includes("personal") || bagType.includes("underseat") || bagType.includes("handbag");
}

function chooseBestRule(
  rules: BaggageRuleRow[],
  matcher: (rule: BaggageRuleRow) => boolean
): BaggageRuleRow | undefined {
  return rules.find((rule) => matcher(rule));
}

function mapRows(airline: AirlineRow, baggageRows: BaggageRuleRow[]): Airline {
  const airlineId = airline.AirlineID || "";
  const airlineRules = baggageRows.filter((rule) => rule.AirlineID === airlineId);

  const personalRule = chooseBestRule(airlineRules, isPersonalItem);
  const cabinRule = chooseBestRule(airlineRules, isCabinBag);

  return {
    airlineId,
    airlineName: airline.AirlineName || "",
    slug: airline.Slug || slugify(airline.AirlineName || ""),
    country: airline.Country || "",
    logoUrl: "",
    personalItem: {
      heightCm: toNumber(personalRule?.HeightCm),
      widthCm: toNumber(personalRule?.WidthCm),
      depthCm: toNumber(personalRule?.DepthCm),
    },
    cabinBag: {
      heightCm: toNumber(cabinRule?.HeightCm),
      widthCm: toNumber(cabinRule?.WidthCm),
      depthCm: toNumber(cabinRule?.DepthCm),
    },
    weightLimitKg: cabinRule?.WeightKg ? toNumber(cabinRule.WeightKg, NaN) : null,
    websiteUrl: airline.OfficialBaggageURL || "",
    lastUpdated: airline.LastChecked || "",
    status: "Live",
  };
}

export async function getAirlines(): Promise<{ airlines: Airline[]; source: "sheet" | "fallback" }> {
  const airlineRows = await getSheetRows<AirlineRow>("01_Airlines");
  const baggageRows = await getSheetRows<BaggageRuleRow>("02_Baggage_Rules");

  if (!airlineRows || airlineRows.length === 0 || !baggageRows || baggageRows.length === 0) {
    return { airlines: FALLBACK_AIRLINES, source: "fallback" };
  }

  const airlines = airlineRows
    .filter((airline) => airline.AirlineID && airline.AirlineName)
    .map((airline) => mapRows(airline, baggageRows))
    .filter((airline) => airline.airlineName);

  console.log("Airlines returned:", airlines.length);
  console.table(
    airlines.map((airline) => ({
      id: airline.airlineId,
      name: airline.airlineName,
      cabin: `${airline.cabinBag.heightCm}x${airline.cabinBag.widthCm}x${airline.cabinBag.depthCm}`,
      personal: `${airline.personalItem.heightCm}x${airline.personalItem.widthCm}x${airline.personalItem.depthCm}`,
    }))
  );

  if (airlines.length === 0) {
    return { airlines: FALLBACK_AIRLINES, source: "fallback" };
  }

  return { airlines, source: "sheet" };
}

export async function getAirlineBySlug(
  slug: string
): Promise<{ airline: Airline | null; source: "sheet" | "fallback" }> {
  const { airlines, source } = await getAirlines();
  const airline = airlines.find((a) => a.slug === slug) ?? null;
  return { airline, source };
}

export async function getAllAirlineSlugs(): Promise<string[]> {
  const { airlines } = await getAirlines();
  return airlines.map((a) => a.slug);
}