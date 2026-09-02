export type WillItBrand = "WillItFit" | "WillItFly";

export type PublishingPageType =
  | "airline"
  | "airport"
  | "airport_delays"
  | "guide";

export type PublicationState = "draft" | "uat" | "published" | "retired";

export type ModuleVisibility = "visible" | "hidden";

export interface PublishingHeroV1 {
  brand: WillItBrand;
  assetId: string;
  eyebrow?: string;
  title: string;
  summary?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  overlay: "dark-left" | "light-left" | "none";
}

export interface PublishingSectionV1 {
  sectionId: string;
  sectionType:
    | "trust"
    | "fact_cards"
    | "comparison_table"
    | "live_summary"
    | "live_events"
    | "transport"
    | "parking"
    | "lounges"
    | "hotels"
    | "facilities"
    | "checker_cta"
    | "faq"
    | "commercial"
    | "source_trust";
  heading?: string;
  intro?: string;
  displayOrder: number;
  visibility: ModuleVisibility;
  dataSourceId?: string;
  required?: boolean;
}

export interface BasePublishingPageV1 {
  contractVersion: "1.0.0";
  pageId: string;
  pageType: PublishingPageType;
  brand: WillItBrand;
  slug: string;
  canonicalUrl: string;
  publicationState: PublicationState;
  hero: PublishingHeroV1;
  sections: PublishingSectionV1[];
  metaTitle: string;
  metaDescription: string;
  lastReviewedAt?: string;
}

export interface AirlinePageV1 extends BasePublishingPageV1 {
  pageType: "airline";
  airlineId: string;
  checkerHref: string;
  liveModuleEnabled: boolean;
}

export interface AirportPageV1 extends BasePublishingPageV1 {
  pageType: "airport";
  airportId: string;
  iataCode?: string;
  delaysHref: string;
  checkerHref: string;
}

export interface AirportDelayPageV1 extends BasePublishingPageV1 {
  pageType: "airport_delays";
  airportId: string;
  iataCode?: string;
  freshnessPolicy: "aviation-v1";
}

export interface AirportReferenceV1 {
  contractVersion: "1.0.0";
  airportId: string;
  displayName: string;
  canonicalName?: string;
  iataCode?: string;
  icaoCode?: string;
  municipality?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  scheduledService?: boolean;
  terminals?: Array<{
    terminalId: string;
    name: string;
    notes?: string;
  }>;
  transport?: Array<{
    mode: string;
    title: string;
    summary?: string;
    url?: string;
  }>;
  parking?: Array<{
    title: string;
    summary?: string;
    url?: string;
  }>;
  lounges?: Array<{
    title: string;
    terminal?: string;
    url?: string;
  }>;
  hotels?: Array<{
    title: string;
    proximity?: string;
    url?: string;
  }>;
  facilities?: Array<{
    title: string;
    summary?: string;
  }>;
  sourceReferences?: string[];
  lastCheckedAt?: string;
}

export type AviationFreshnessState = "LIVE" | "DELAYED" | "UNAVAILABLE";

export interface AviationEventV1 {
  eventId: string;
  airportCode: string;
  airlineId?: string;
  airlineCode?: string;
  flightNumber?: string;
  direction?: "departure" | "arrival";
  origin?: string;
  destination?: string;
  scheduledTime?: string;
  estimatedTime?: string;
  status: string;
  causeCode?: string;
  causeSummary?: string;
  causeConfidence?: "HIGH" | "MEDIUM" | "LOW" | "UNVERIFIED";
  firstSeenAt?: string;
  lastSeenAt?: string;
  sourceReferences: string[];
}

export interface AviationCurrentV1 {
  contractVersion: "1.0.0";
  generatedAt: string;
  lastMaterialChangeAt?: string;
  freshness: AviationFreshnessState;
  airports: Record<
    string,
    {
      airportCode: string;
      delayedDepartures?: number;
      delayedArrivals?: number;
      cancellations?: number;
      affectedAirlines?: string[];
      events: AviationEventV1[];
    }
  >;
}

export type CommercialFormat =
  | "display"
  | "affiliate_card"
  | "carousel"
  | "direct_sponsor"
  | "house"
  | "muted_video";

export interface CommercialPlacementV1 {
  placementId: string;
  commercialSlotId: string;
  brand: WillItBrand;
  pageType: PublishingPageType;
  entityId?: string;
  context?: string;
  resultContext?: string;
  disruptionContext?: string;
  allowedFormats: CommercialFormat[];
  category?: string;
  network?: string;
  campaignId?: string;
  offerId?: string;
  destinationUrl?: string;
  affiliateTrackingId?: string;
  priority: number;
  validFrom?: string;
  validTo?: string;
  sponsoredLabelRequired: boolean;
  active: boolean;
  fallbackPlacementId?: string;
}

export interface CommercialSnapshotV1 {
  contractVersion: "1.0.0";
  generatedAt: string;
  placements: CommercialPlacementV1[];
}
