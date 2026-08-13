import { describe, expect, it } from "vitest";
import {
  resolveDestinationSearch,
  suggestDestinationSearch,
} from "@/lib/willitflyDestinationSearch";
import type { WillItFlyDestination } from "@/services/willitflyRuntime";

function destination(
  destinationId: string,
  displayName: string,
  slug: string,
  aliases: string[] = [],
): WillItFlyDestination {
  return {
    destinationId,
    destinationType: "COUNTRY",
    displayName,
    countryId: destinationId.replace("DEST-", ""),
    slug,
    aliases,
    latitude: null,
    longitude: null,
  };
}

const destinations = [
  destination("DEST-GBR", "United Kingdom", "united-kingdom", ["UK", "Great Britain", "Britain"]),
  destination("DEST-USA", "United States", "united-states", ["US", "USA", "United States of America"]),
  destination("DEST-ESP", "Spain", "spain"),
];

describe("WillItFly destination search", () => {
  it("resolves canonical display names and governed aliases", () => {
    expect(resolveDestinationSearch(destinations, "United Kingdom")?.destinationId).toBe("DEST-GBR");
    expect(resolveDestinationSearch(destinations, "uk")?.destinationId).toBe("DEST-GBR");
    expect(resolveDestinationSearch(destinations, "Great-Britain")?.destinationId).toBe("DEST-GBR");
    expect(resolveDestinationSearch(destinations, "USA")?.destinationId).toBe("DEST-USA");
  });

  it("does not guess from a partial value", () => {
    expect(resolveDestinationSearch(destinations, "uni")).toBeNull();
    expect(resolveDestinationSearch(destinations, "unknown place")).toBeNull();
  });

  it("offers ranked autocomplete suggestions from names, slugs and aliases", () => {
    expect(suggestDestinationSearch(destinations, "brit").map((item) => item.destinationId)).toEqual(["DEST-GBR"]);
    expect(suggestDestinationSearch(destinations, "united").map((item) => item.destinationId)).toEqual([
      "DEST-GBR",
      "DEST-USA",
    ]);
  });
});
