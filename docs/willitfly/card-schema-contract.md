# WillItFly RC1 Card Schema Contract

Status: PLANNED / CONTRACT ONLY. This document does not certify implementation, local build, tests, visual QA, Runtime publication, or production deployment.

## Purpose

WillItFly RC1 cards are schema-driven. Runtime defines which cards exist, which governed fields and assets feed each card, how joins are resolved, and how missing data behaves. Build owns typed loading, deterministic resolution, view-model construction, reusable components, rendering, routing, accessibility, responsive behaviour, and tests.

No user-facing card component may hard-code destination facts, source URLs, plug type labels, or production asset paths.

Authoritative Runtime contract tables:
- `04.1_Card_Schemas`: card identity, order, component key, interaction, visibility and safe-state rules.
- `04.2_Card_Field_Links`: field-level source, lookup key, resolver, required/optional state, multiplicity, display role and Build output.
- `02_Destinations`: destination identity, hierarchy, coordinates and Unicode flag contract.
- `02.1_Travel_Times`: governed origin-to-destination average flight minutes.
- `03_Destination_Facts`: approved topic facts and evidence lineage.
- `04_Topic_Contracts`: governed topic field requirements.
- `05_Public_Source_Links`: public source handoff metadata.
- `06_Assets`: Runtime-eligible assets, including `Asset_Role` for deterministic joins.

## RC1 card set

1. Persistent `LOCATION_IDENTITY` card beside the map pin.
2. `POWER` primary topic card.
3. `CONNECTIVITY` primary topic card.
4. `MONEY` primary topic card.
5. `ENTRY` primary topic card.
6. `WEATHER` primary topic card.

The Location Identity card remains visible when the five primary topic cards are displayed.

## Build architecture

The Build should use four layers.

### 1. Runtime loader

Read Runtime tables through the product-aware Runtime data service and normalize rows into typed records and indexed maps. UI components do not access Google Sheets or table-shaped Runtime data directly.

Suggested indexes include:
- destinations by `Destination_ID`
- facts by `Destination_ID + Topic_ID + Fact_Key`
- sources by `Source_ID`
- assets by `Asset_ID`
- assets by `Entity_Type + Entity_ID + Topic_ID + Asset_Role`
- travel times by `Origin_Market_ID + Destination_ID`
- card schemas by `Card_ID`
- card field links by `Card_ID`

### 2. Deterministic resolvers

Planned resolver functions:

```ts
resolveDestinationLocationCard(destinationId, originMarketId)
resolveTopicCard(destinationId, topicId)
resolvePowerPlugAssets(plugTypeIds)
resolvePublicSource(sourceId)
resolveAsset(entityType, entityId, topicId, assetRole)
```

Resolvers enforce Runtime contracts and fail-closed rules. They return typed view models rather than raw Runtime rows.

### 3. View models

Suggested domain types:

```ts
type RuntimeCardSchema = {
  cardId: string;
  cardType: string;
  topicId?: string;
  title: string;
  displayOrder: number;
  componentKey: string;
  interactionMode: string;
  detailRouteKey?: string;
  assetMode: string;
  visibilityRule: string;
  safeState: string;
  schemaVersion: string;
  requiredForRc1: boolean;
};

type RuntimeCardFieldLink = {
  linkId: string;
  cardId: string;
  slotKey: string;
  runtimeTab: string;
  runtimeField: string;
  lookupKey: string;
  lookupValueSource: string;
  resolver: string;
  required: boolean;
  multiple: boolean;
  displayRole: string;
  missingBehaviour: string;
  buildOutput: string;
};

type ResolvedAsset = {
  assetId: string;
  assetType: string;
  assetRole: string;
  productionPath: string;
  altText?: string;
  accessibilityBehaviour?: string;
  fallbackAssetId?: string;
  version?: string;
};

type ResolvedTopicCard = {
  cardId: string;
  topicId: string;
  title: string;
  status: 'ready' | 'unavailable' | 'official-confirmation-required';
  fields: Record<string, unknown>;
  assets: ResolvedAsset[];
  sourceIds: string[];
  lastReviewed?: string;
};
```

Exact TypeScript names may evolve during implementation, but the Runtime contract must remain authoritative.

### 4. Reusable presentation components

Planned components:
- `DestinationLocationCard`
- `TopicSummaryCard`
- `PlugTypeVisual`
- optional shared trust/source metadata primitive

`TopicSummaryCard` should remain a reusable shell. Topic-specific data selection and formatting belongs in resolvers/presenters rather than duplicated card components.

## Location Identity resolver

The card uses `02_Destinations` and `02.1_Travel_Times`.

Rules:
- selected place is primary identity
- region is displayed when governed and relevant
- country is always displayed
- selected-entity Unicode flag is preferred; country flag is fallback; asset fallback is exceptional
- Latitude/Longitude are geographic truth; `DestinationMap` owns projection
- missing coordinates render the map without a pin
- average flight time is joined by `Origin_Market_ID + Destination_ID`
- missing flight time suppresses only the flight-time line
- Build rounds `Average_Flight_Minutes` upward to the next 30-minute increment

## Primary topic resolver

For each topic, Build resolves the exact `Fact_Key` records defined by Runtime/Mother topic contracts. Required RC1 fields must pass the Runtime completeness/safe-state contract before the card is treated as ready.

RC1 field keys:
- POWER: `voltage_v`, `frequency_hz`, `plug_type_ids`, `adapter_implication`, `converter_warning`
- CONNECTIVITY: `coverage_status`, `sim_esim`
- MONEY: `currency_code`, `payment_reality`
- ENTRY: `entry_position`, `official_handoff`
- WEATHER: `climate_guidance`

Each displayed factual record retains its `Source_ID` and `Last_Reviewed` lineage.

## POWER plug asset join

Plug imagery is governed data, not a Build filename convention.

Resolution sequence:
1. Resolve the POWER `plug_type_ids` fact as a controlled ID list.
2. For each plug type ID, resolve exactly one eligible Runtime asset using:
   - `Entity_Type = PLUG_TYPE`
   - `Entity_ID = <plug_type_id>`
   - `Topic_ID = POWER`
   - `Asset_Role = PRIMARY_VISUAL`
3. Use the resolved `Production_Path`, accessibility fields and version from `06_Assets`.
4. Preserve the same order as the governed plug-type list unless a future Runtime ordering contract explicitly changes it.
5. If a required plug asset is missing or resolves ambiguously, show the governed unavailable state. Never substitute another plug type or invent a path.

WF063 requires each primary plug visual to be a technically accurate, white, professional, photorealistic product render aligned with the approved WillIt baggage imagery language. Asset creation is separate from this Build contract; no imagery is generated by this change.

## ENTRY source handoff

`official_handoff` resolves to a governed `Source_ID`, then to `05_Public_Source_Links`. Build must never construct or infer an official URL when the Source join does not resolve.

## Routing

The destination route resolves a stable `Destination_ID` first. Card resolution occurs from that ID. Topic cards open their governed detail route key; route construction must remain consistent with the RC1 `/fly/[destinationSlug]` architecture and later topic-detail contract.

## Safe-state principles

- Missing required factual fields: fail closed under the topic completeness rule.
- Missing optional Location Identity metadata: suppress only the optional line/visual where safe.
- Missing coordinates: map remains, pin is suppressed.
- Missing Unicode flag: preserve text identity; use governed fallback only when available.
- Missing plug visual: do not show a wrong or generic plug image.
- Missing source relationship: do not invent a URL.
- WEATHER remains reviewed climate guidance, not a live forecast.
- MONEY does not infer live exchange rates from static facts.
- ENTRY preserves official-confirmation-required behaviour.

## Planned tests

Before this contract can be called implemented or certified, add tests for:
- Runtime card schema parsing
- card field-link parsing
- field lookup by Destination/Topic/Fact key
- required-field fail-closed behaviour
- destination hierarchy resolution
- selected-entity flag and country fallback
- missing flag behaviour
- missing Latitude/Longitude behaviour
- origin/destination travel-time join
- flight-time rounding upward to 30 minutes
- controlled plug ID parsing
- multiple plug types
- invalid plug ID
- missing plug asset
- ambiguous plug asset
- correct `Asset_Role=PRIMARY_VISUAL` join
- source lineage preservation
- ENTRY public source join
- no invented source URL
- reviewed-date lineage
- responsive/accessibility/visual tests after component implementation

## Implementation sequence

1. Verify local branch baseline and approved binary map/marker assets.
2. Add typed Runtime row contracts for `04.1_Card_Schemas`, `04.2_Card_Field_Links`, `06_Assets.Asset_Role` and travel-time records.
3. Extend Runtime loader/indexes.
4. Implement deterministic resolvers and unit tests.
5. Implement `DestinationLocationCard` and integrate with `DestinationMap` without changing geographic truth.
6. Implement reusable `TopicSummaryCard` shell.
7. Implement POWER presenter and `PlugTypeVisual` asset resolution first because it exercises facts + controlled taxonomy + assets + safe states.
8. Implement Connectivity, Money, Entry and Weather presenters.
9. Run type-check, lint, relevant/full tests and local Next.js build.
10. Visually verify desktop/mobile card behaviour and map/location composition.
11. Evolve Runtime only where genuine implementation needs expose a justified contract gap.
12. Keep Cockpit untouched until Runtime stabilises and locks.

## Current verification state

This file records the agreed implementation plan only. The card loader, resolvers and components described here have not been implemented or locally certified by this change. Runtime factual publication remains disabled. Mother and Cockpit are unchanged.
