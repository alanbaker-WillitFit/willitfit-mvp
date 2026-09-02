import { describe, expect, it } from "vitest";
import {
  expectedRc6ManifestState,
  isRc6ManifestEntryUsable,
  validateRc6CacheManifestEntry,
  type Rc6CacheManifestEntry,
} from "@/services/rc6/cacheManifest";

function entry(overrides: Partial<Rc6CacheManifestEntry> = {}): Rc6CacheManifestEntry {
  return {
    dataset: "offers",
    tabName: "runtime_offers",
    snapshot: "commercial",
    datasetVersion: "v1",
    checksum: "sha256:test",
    state: "AUTHORITATIVE_EMPTY",
    sourcePublicationTimestamp: "2026-08-19T12:00:00Z",
    lastSuccessfulRefresh: "2026-08-19T12:00:00Z",
    hardStaleMs: 48 * 60 * 60 * 1000,
    dependencyVersions: {},
    ...overrides,
  };
}

describe("RC6 cache manifest", () => {
  it("treats schema-ready empty datasets as authoritative-empty cache truth", () => {
    expect(expectedRc6ManifestState("offers")).toBe("AUTHORITATIVE_EMPTY");
    expect(validateRc6CacheManifestEntry(entry())).toEqual([]);
  });

  it("rejects a manifest that disguises authoritative empty as a cache miss state", () => {
    expect(validateRc6CacheManifestEntry(entry({ state: "SCHEMA_READY_EMPTY" }))).toContain(
      "dataset-state-mismatch",
    );
  });

  it("enforces the dataset hard-stale policy", () => {
    expect(validateRc6CacheManifestEntry(entry({ hardStaleMs: 72 * 60 * 60 * 1000 }))).toContain(
      "hard-stale-policy-mismatch",
    );
  });

  it("refuses commercial dynamic data beyond hard stale", () => {
    const refreshed = Date.parse("2026-08-19T12:00:00Z");
    expect(isRc6ManifestEntryUsable(entry(), refreshed + 48 * 60 * 60 * 1000)).toBe(true);
    expect(isRc6ManifestEntryUsable(entry(), refreshed + 48 * 60 * 60 * 1000 + 1)).toBe(false);
  });

  it("allows core stable entries without an invented hard-stale threshold", () => {
    const airlines = entry({
      dataset: "airlines",
      tabName: "02_Airlines",
      snapshot: "core",
      state: "READY",
      hardStaleMs: null,
    });
    expect(validateRc6CacheManifestEntry(airlines)).toEqual([]);
    expect(isRc6ManifestEntryUsable(airlines, Date.parse("2030-01-01T00:00:00Z"))).toBe(true);
  });
});
