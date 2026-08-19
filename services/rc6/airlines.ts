import { readRc6Dataset, type Rc6TabReader } from "./runtimeReader";

type RuntimeRow = Record<string, string>;

export type Rc6AirlineIdentity = Readonly<{
  airlineId: string;
  airlineName: string;
  iataCode: string;
  searchTerms: readonly string[];
  country: string;
  websiteUrl: string;
  baggageUrl: string;
  logoReference: string;
  displayOrder: number;
  lastReviewed: string;
  notes: string;
  slug: string;
}>;

function text(row: RuntimeRow, field: string): string {
  return String(row[field] ?? "").trim();
}

function truthy(value: string): boolean {
  return ["yes", "true", "1", "active", "published", "live"].includes(value.trim().toLowerCase());
}

function approved(value: string): boolean {
  return ["approved", "published", "live"].includes(value.trim().toLowerCase());
}

function splitTerms(value: string): string[] {
  return value.split(/[;,|]/).map((entry) => entry.trim()).filter(Boolean);
}

export function rc6SlugifyAirlineName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validHttps(value: string): boolean {
  return /^https:\/\//i.test(value);
}

function uniqueSearchTerms(airlineName: string, iataCode: string, supplied: readonly string[]): string[] {
  const byNormalised = new Map<string, string>();
  for (const term of [airlineName, iataCode, ...supplied]) {
    const trimmed = term.trim();
    if (!trimmed) continue;
    const normalised = trimmed.toLowerCase().replace(/\s+/g, " ");
    if (!byNormalised.has(normalised)) byNormalised.set(normalised, trimmed);
  }
  return [...byNormalised.values()];
}

export async function getRc6Airlines(reader: Rc6TabReader): Promise<Rc6AirlineIdentity[]> {
  const result = await readRc6Dataset<RuntimeRow>("airlines", reader);
  if (result.state !== "READY_WITH_ROWS") return [];

  const mapped = result.rows
    .filter((row) => truthy(text(row, "Active")) && truthy(text(row, "Publish")) && approved(text(row, "Review Status")))
    .map((row) => {
      const airlineName = text(row, "Airline Name");
      const iataCode = text(row, "IATA Code").toUpperCase();
      return {
        airlineId: text(row, "Airline ID").toUpperCase(),
        airlineName,
        iataCode,
        searchTerms: uniqueSearchTerms(airlineName, iataCode, splitTerms(text(row, "Search Terms"))),
        country: text(row, "Country"),
        websiteUrl: text(row, "Website URL"),
        baggageUrl: text(row, "Baggage URL"),
        logoReference: text(row, "Logo Reference"),
        displayOrder: Number.parseInt(text(row, "Display Order"), 10) || 999,
        lastReviewed: text(row, "Last Reviewed"),
        notes: text(row, "Notes"),
        slug: rc6SlugifyAirlineName(airlineName),
      } satisfies Rc6AirlineIdentity;
    })
    .filter((airline) =>
      airline.airlineId &&
      airline.airlineName &&
      airline.iataCode &&
      airline.country &&
      airline.slug &&
      validHttps(airline.websiteUrl) &&
      validHttps(airline.baggageUrl),
    )
    .sort((a, b) => a.displayOrder - b.displayOrder || a.airlineName.localeCompare(b.airlineName));

  if (mapped.length !== 114) return [];

  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const airline of mapped) {
    if (ids.has(airline.airlineId) || slugs.has(airline.slug)) return [];
    ids.add(airline.airlineId);
    slugs.add(airline.slug);
  }

  return mapped;
}

function normaliseQuery(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function rankRc6AirlineMatches(airlines: readonly Rc6AirlineIdentity[], query: string): Rc6AirlineIdentity[] {
  const normalised = normaliseQuery(query);
  if (!normalised) return [...airlines].sort((a, b) => a.displayOrder - b.displayOrder || a.airlineName.localeCompare(b.airlineName));

  return airlines
    .map((airline) => {
      const name = normaliseQuery(airline.airlineName);
      const iata = normaliseQuery(airline.iataCode);
      const terms = airline.searchTerms.map(normaliseQuery);
      let score = 0;
      if (iata === normalised) score = 1000;
      else if (name === normalised) score = 950;
      else if (terms.some((term) => term === normalised)) score = 900;
      else if (name.startsWith(normalised)) score = 700;
      else if (terms.some((term) => term.startsWith(normalised))) score = 650;
      else if (name.includes(normalised)) score = 500;
      else if (terms.some((term) => term.includes(normalised))) score = 450;
      return { airline, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.airline.displayOrder - b.airline.displayOrder || a.airline.airlineName.localeCompare(b.airline.airlineName))
    .map((entry) => entry.airline);
}
