export const WILLITFLY_LIVE_INTELLIGENCE_CONTRACT_VERSION = "0.11-DRAFT";

export type WillItFlyLiveTopic =
  | "TRANSPORT"
  | "WEATHER"
  | "AIRPORT"
  | "ENTRY"
  | "OFFICIAL_ADVICE"
  | "DESTINATION_EVENT";

export type WillItFlyLiveSeverity = "ADVISORY" | "DISRUPTION" | "SEVERE";
export type WillItFlyLiveLifecycle = "ACTIVE" | "EXPIRING" | "RESOLVED" | "ARCHIVED";
export type WillItFlyCoverageStatus = "HEALTHY" | "DEGRADED" | "UNAVAILABLE";

export type RuntimeLiveIncident = {
  incidentId: string;
  headline: string;
  summary?: string;
  travellerImpact: string;
  topic: WillItFlyLiveTopic;
  severity: WillItFlyLiveSeverity;
  primaryDestinationId: string;
  destinationIds: string[];
  sourceIds: string[];
  detectedAt: string;
  lastChecked: string;
  effectiveFrom?: string;
  expiresAt?: string;
  lifecycleStatus: WillItFlyLiveLifecycle;
  sortPriority: number;
  detailPath?: string;
  active: boolean;
  publish: boolean;
  featureFlag?: string;
  evidenceConfidence: "HIGH" | "MEDIUM";
  methodologyVersion: string;
  dedupGroupId?: string;
  resolvedAt?: string;
};

export type RuntimeLiveMonitoringStatus = {
  monitorId: string;
  destinationId: string;
  topic: "ALL" | WillItFlyLiveTopic;
  coverageStatus: WillItFlyCoverageStatus;
  lastChecked: string;
  sourceCount: number;
  significantIssueCount: number;
  allClearEligible: boolean;
  freshUntil: string;
  active: boolean;
  publish: boolean;
  featureFlag?: string;
  methodologyVersion: string;
};

function timestamp(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function canPublishLiveIncident(
  incident: RuntimeLiveIncident,
  now: Date = new Date(),
): boolean {
  if (!incident.active || !incident.publish) return false;
  if (!incident.headline.trim() || !incident.travellerImpact.trim()) return false;
  if (!incident.primaryDestinationId.trim() || incident.sourceIds.length === 0) return false;
  if (!incident.methodologyVersion.trim() || !incident.lastChecked.trim()) return false;
  if (!Number.isFinite(incident.sortPriority)) return false;
  if (!["ACTIVE", "EXPIRING"].includes(incident.lifecycleStatus)) return false;

  const lastChecked = timestamp(incident.lastChecked);
  if (lastChecked === null) return false;

  const expiresAt = timestamp(incident.expiresAt);
  if (expiresAt !== null && expiresAt <= now.getTime()) return false;

  return true;
}

export function resolvePublishedLiveIncidents(
  incidents: RuntimeLiveIncident[],
  now: Date = new Date(),
): RuntimeLiveIncident[] {
  return incidents
    .filter((incident) => canPublishLiveIncident(incident, now))
    .sort((a, b) => {
      if (a.sortPriority !== b.sortPriority) return a.sortPriority - b.sortPriority;
      const aChecked = timestamp(a.lastChecked) ?? 0;
      const bChecked = timestamp(b.lastChecked) ?? 0;
      if (aChecked !== bChecked) return bChecked - aChecked;
      return a.incidentId.localeCompare(b.incidentId);
    });
}

export function canShowAllClear(
  status: RuntimeLiveMonitoringStatus,
  now: Date = new Date(),
): boolean {
  if (!status.active || !status.publish || !status.allClearEligible) return false;
  if (status.coverageStatus !== "HEALTHY") return false;
  if (status.sourceCount < 1 || status.significantIssueCount !== 0) return false;
  if (!status.methodologyVersion.trim()) return false;

  const lastChecked = timestamp(status.lastChecked);
  const freshUntil = timestamp(status.freshUntil);
  if (lastChecked === null || freshUntil === null) return false;
  if (freshUntil <= now.getTime()) return false;

  return true;
}

export function resolveDestinationLiveIncidents(
  incidents: RuntimeLiveIncident[],
  destinationId?: string,
  topic?: WillItFlyLiveTopic,
): RuntimeLiveIncident[] {
  return incidents.filter((incident) => {
    const destinationMatches = !destinationId || incident.destinationIds.includes(destinationId);
    const topicMatches = !topic || incident.topic === topic;
    return destinationMatches && topicMatches;
  });
}
