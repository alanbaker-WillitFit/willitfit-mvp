import { describe, expect, it } from "vitest";
import {
  RC6_RUNTIME_DATASETS,
  isAuthoritativeEmptyDataset,
  rc6DatasetsForSnapshot,
} from "@/services/rc6/runtimeContract";
import { getRc6CachePolicy, isBeyondHardStale } from "@/services/rc6/cachePolicy";

describe("RC6 runtime contract", () => {
  it("locks the governed core counts", () => {
    expect(RC6_RUNTIME_DATASETS.airlines.expectedRows).toBe(114);
    expect(RC6_RUNTIME_DATASETS.airlineRules.expectedRows).toBe(425);
    expect(RC6_RUNTIME_DATASETS.specialBaggageResults.expectedRows).toBe(21);
    expect(RC6_RUNTIME_DATASETS.faqs.expectedRows).toBe(5);
    expect(RC6_RUNTIME_DATASETS.tips.expectedRows).toBe(182);
    expect(RC6_RUNTIME_DATASETS.siteContent.expectedRows).toBe(12);
    expect(RC6_RUNTIME_DATASETS.articles.expectedRows).toBe(15);
    expect(RC6_RUNTIME_DATASETS.articleSections.expectedRows).toBe(49);
    expect(RC6_RUNTIME_DATASETS.productGroups.expectedRows).toBe(20);
  });

  it("treats schema-ready commercial datasets as authoritative empty", () => {
    expect(isAuthoritativeEmptyDataset("products")).toBe(true);
    expect(isAuthoritativeEmptyDataset("offers")).toBe(true);
    expect(isAuthoritativeEmptyDataset("affiliateRoutes")).toBe(true);
    expect(isAuthoritativeEmptyDataset("recommendations")).toBe(true);
  });

  it("keeps shared country data out of public WillItFit consumers by default", () => {
    expect(RC6_RUNTIME_DATASETS.countries.publicConsumer).toBe(false);
    expect(RC6_RUNTIME_DATASETS.countryFacts.publicConsumer).toBe(false);
  });

  it("keeps legacy affiliate placements out of RC6 commercial authority", () => {
    expect(RC6_RUNTIME_DATASETS.legacyAffiliatePlacements.authoritativeEmpty).toBe(true);
    expect(RC6_RUNTIME_DATASETS.legacyAffiliatePlacements.publicConsumer).toBe(false);
  });

  it("partitions datasets into logical snapshots", () => {
    expect(rc6DatasetsForSnapshot("core").some((entry) => entry.key === "airlines")).toBe(true);
    expect(rc6DatasetsForSnapshot("content").some((entry) => entry.key === "faqs")).toBe(true);
    expect(rc6DatasetsForSnapshot("commercial").some((entry) => entry.key === "offers")).toBe(true);
    expect(rc6DatasetsForSnapshot("reference").some((entry) => entry.key === "countries")).toBe(true);
  });
});

describe("RC6 cache policy", () => {
  it("uses governed hard-stale limits for dynamic commercial data", () => {
    expect(getRc6CachePolicy("offers").hardStaleMs).toBe(48 * 60 * 60 * 1000);
    expect(getRc6CachePolicy("priceIntelligence").hardStaleMs).toBe(72 * 60 * 60 * 1000);
    expect(getRc6CachePolicy("affiliateRoutes").hardStaleMs).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("suppresses only after a governed hard-stale boundary is exceeded", () => {
    expect(isBeyondHardStale("offers", 48 * 60 * 60 * 1000)).toBe(false);
    expect(isBeyondHardStale("offers", 48 * 60 * 60 * 1000 + 1)).toBe(true);
  });

  it("does not invent a hard-stale limit for stable identity data", () => {
    expect(getRc6CachePolicy("airlines").hardStaleMs).toBeNull();
    expect(isBeyondHardStale("airlines", Number.MAX_SAFE_INTEGER)).toBe(false);
  });
});
