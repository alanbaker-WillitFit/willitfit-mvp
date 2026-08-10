import { describe, expect, it } from "vitest";

import {
  canPublishLiveIncident,
  canShowAllClear,
  resolveDestinationLiveIncidents,
  resolvePublishedLiveIncidents,
  type RuntimeLiveIncident,
  type RuntimeLiveMonitoringStatus,
} from "../lib/willitflyLiveIntelligence";

const now = new Date("2026-08-10T16:30:00Z");

const baseIncident: RuntimeLiveIncident = {
  incidentId: "INC-001",
  headline: "Rail disruption affecting Madrid services",
  summary: "Some services are disrupted.",
  travellerImpact: "Allow extra journey time and check your operator before travelling.",
  topic: "TRANSPORT",
  severity: "DISRUPTION",
  primaryDestinationId: "ESP-MAD",
  destinationIds: ["ESP", "ESP-MAD"],
  sourceIds: ["SRC-001", "SRC-002"],
  detectedAt: "2026-08-10T15:00:00Z",
  lastChecked: "2026-08-10T16:20:00Z",
  effectiveFrom: "2026-08-10T15:00:00Z",
  expiresAt: "2026-08-10T22:00:00Z",
  lifecycleStatus: "ACTIVE",
  sortPriority: 10,
  detailPath: "/fly/travel-updates/inc-001",
  active: true,
  publish: true,
  evidenceConfidence: "HIGH",
  methodologyVersion: "0.11-DRAFT",
  dedupGroupId: "DD-001",
};

const baseStatus: RuntimeLiveMonitoringStatus = {
  monitorId: "MON-001",
  destinationId: "PRT",
  topic: "ALL",
  coverageStatus: "HEALTHY",
  lastChecked: "2026-08-10T16:25:00Z",
  sourceCount: 4,
  significantIssueCount: 0,
  allClearEligible: true,
  freshUntil: "2026-08-10T17:25:00Z",
  active: true,
  publish: true,
  methodologyVersion: "0.11-DRAFT",
};

describe("WillItFly Live Intelligence", () => {
  it("publishes only active, governed and unexpired incidents", () => {
    expect(canPublishLiveIncident(baseIncident, now)).toBe(true);
    expect(canPublishLiveIncident({ ...baseIncident, publish: false }, now)).toBe(false);
    expect(canPublishLiveIncident({ ...baseIncident, lifecycleStatus: "RESOLVED" }, now)).toBe(false);
    expect(canPublishLiveIncident({ ...baseIncident, expiresAt: "2026-08-10T16:00:00Z" }, now)).toBe(false);
  });

  it("fails closed when evidence or traveller impact is missing", () => {
    expect(canPublishLiveIncident({ ...baseIncident, sourceIds: [] }, now)).toBe(false);
    expect(canPublishLiveIncident({ ...baseIncident, travellerImpact: "" }, now)).toBe(false);
  });

  it("orders incidents by governed priority then freshness", () => {
    const incidents = resolvePublishedLiveIncidents([
      { ...baseIncident, incidentId: "INC-002", sortPriority: 20 },
      { ...baseIncident, incidentId: "INC-003", sortPriority: 10, lastChecked: "2026-08-10T16:10:00Z" },
      baseIncident,
    ], now);

    expect(incidents.map((incident) => incident.incidentId)).toEqual(["INC-001", "INC-003", "INC-002"]);
  });

  it("filters by destination and topic without duplicating incidents", () => {
    const weather = { ...baseIncident, incidentId: "INC-004", topic: "WEATHER" as const, destinationIds: ["JPN"] };
    expect(resolveDestinationLiveIncidents([baseIncident, weather], "ESP").map((incident) => incident.incidentId)).toEqual(["INC-001"]);
    expect(resolveDestinationLiveIncidents([baseIncident, weather], undefined, "WEATHER").map((incident) => incident.incidentId)).toEqual(["INC-004"]);
  });

  it("never infers All Clear from an empty incident list", () => {
    expect(canShowAllClear(baseStatus, now)).toBe(true);
    expect(canShowAllClear({ ...baseStatus, sourceCount: 0 }, now)).toBe(false);
    expect(canShowAllClear({ ...baseStatus, significantIssueCount: 1 }, now)).toBe(false);
    expect(canShowAllClear({ ...baseStatus, coverageStatus: "DEGRADED" }, now)).toBe(false);
    expect(canShowAllClear({ ...baseStatus, freshUntil: "2026-08-10T16:29:00Z" }, now)).toBe(false);
  });
});
