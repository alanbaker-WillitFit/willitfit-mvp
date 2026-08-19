import { describe, expect, it } from "vitest";
import {
  getRc6Airlines,
  rankRc6AirlineMatches,
  rc6SlugifyAirlineName,
} from "@/services/rc6/airlines";
import type { Rc6TabReader } from "@/services/rc6/runtimeReader";

type Row = Record<string, string>;

function airlineRow(index: number, overrides: Partial<Row> = {}): Row {
  const ordinal = index + 1;
  const id = `A${String(ordinal).padStart(3, "0")}`;
  const iata = String.fromCharCode(65 + (index % 26)) + String.fromCharCode(65 + (Math.floor(index / 26) % 26));
  return {
    "Airline ID": id,
    "Airline Name": `Airline ${ordinal}`,
    "IATA Code": iata,
    "Search Terms": `Airline ${ordinal}`,
    Country: "United Kingdom",
    "Website URL": `https://example.com/${id.toLowerCase()}`,
    "Baggage URL": `https://example.com/${id.toLowerCase()}/baggage`,
    "Logo Reference": "",
    "Display Order": String(ordinal),
    Active: "Yes",
    "Review Status": "Approved",
    "Last Reviewed": "2026-08-01",
    Publish: "Yes",
    Notes: "Governed RC6 test row",
    ...overrides,
  };
}

function readerFor(rows: Row[]): Rc6TabReader {
  return async <T extends Row>(tabName: string): Promise<T[] | null> =>
    tabName === "02_Airlines" ? (rows as T[]) : null;
}

describe("RC6 airlines", () => {
  it("requires the complete 114-row governed catalogue", async () => {
    const rows = Array.from({ length: 114 }, (_, index) => airlineRow(index));
    const airlines = await getRc6Airlines(readerFor(rows));

    expect(airlines).toHaveLength(114);
  });

  it("fails closed when one governed airline is missing", async () => {
    const rows = Array.from({ length: 113 }, (_, index) => airlineRow(index));
    expect(await getRc6Airlines(readerFor(rows))).toEqual([]);
  });

  it("fails closed on duplicate airline identities", async () => {
    const rows = Array.from({ length: 114 }, (_, index) => airlineRow(index));
    rows[113] = airlineRow(113, { "Airline ID": "A001" });
    expect(await getRc6Airlines(readerFor(rows))).toEqual([]);
  });

  it("fails closed when an airline is unpublished", async () => {
    const rows = Array.from({ length: 114 }, (_, index) => airlineRow(index));
    rows[50] = airlineRow(50, { Publish: "No" });
    expect(await getRc6Airlines(readerFor(rows))).toEqual([]);
  });

  it("adds IATA to governed search terms even when Search Terms omits it", async () => {
    const rows = Array.from({ length: 114 }, (_, index) => airlineRow(index));
    rows[0] = airlineRow(0, {
      "Airline ID": "BAW",
      "Airline Name": "British Airways",
      "IATA Code": "BA",
      "Search Terms": "British Airways, british airways",
      "Display Order": "9",
    });
    const airlines = await getRc6Airlines(readerFor(rows));
    const ba = airlines.find((airline) => airline.airlineId === "BAW");

    expect(ba?.searchTerms).toContain("BA");
    expect(rankRc6AirlineMatches(airlines, "BA")[0]?.airlineId).toBe("BAW");
  });

  it("ranks exact IATA ahead of partial name matches", () => {
    const matches = rankRc6AirlineMatches([
      {
        airlineId: "BAW",
        airlineName: "British Airways",
        iataCode: "BA",
        searchTerms: ["British Airways", "BA"],
        country: "United Kingdom",
        websiteUrl: "https://ba.example",
        baggageUrl: "https://ba.example/baggage",
        logoReference: "",
        displayOrder: 9,
        lastReviewed: "2026-08-01",
        notes: "",
        slug: "british-airways",
      },
      {
        airlineId: "TBA",
        airlineName: "Test BA Aviation",
        iataCode: "TB",
        searchTerms: ["Test BA Aviation", "TB"],
        country: "United Kingdom",
        websiteUrl: "https://tb.example",
        baggageUrl: "https://tb.example/baggage",
        logoReference: "",
        displayOrder: 1,
        lastReviewed: "2026-08-01",
        notes: "",
        slug: "test-ba-aviation",
      },
    ], "BA");

    expect(matches[0]?.airlineId).toBe("BAW");
  });

  it("derives stable route-safe slugs without importing legacy slug fields", () => {
    expect(rc6SlugifyAirlineName("British Airways")).toBe("british-airways");
    expect(rc6SlugifyAirlineName("KLM Royal Dutch Airlines")).toBe("klm-royal-dutch-airlines");
  });
});
