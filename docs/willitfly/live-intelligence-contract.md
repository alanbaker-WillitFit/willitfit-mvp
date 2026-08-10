# WillItFly RC1 Live Intelligence Contract

## Purpose

WillIt Live Intelligence provides a calm, traveller-facing Travel Updates surface backed by continuous Pi/Operations Node monitoring. RSS feeds, APIs and permitted page-change detection are inputs only. The user-facing unit is a governed **incident**, not a source item or headline.

## Architecture

Approved sources → Pi monitoring → normalisation → de-duplication → destination linkage → classification → traveller-impact preparation → governed approval → Runtime projection → WillItFly Build.

The website never reads Pi operational stores directly. The Pi never publishes directly to the website.

## Runtime datasets

### `13_Live_Incidents`

One row represents one governed traveller incident, potentially supported by multiple source records.

Required publication fields:

- `Incident_ID`
- `Headline`
- `Traveller_Impact`
- `Topic`
- `Severity`
- `Primary_Destination_ID`
- `Destination_IDs`
- `Source_IDs`
- `Detected_At`
- `Last_Checked`
- `Lifecycle_Status`
- `Sort_Priority`
- `Active`
- `Publish`
- `Evidence_Confidence`
- `Methodology_Version`

Optional fields include summary, effective/expiry timestamps, detail path, feature flag, de-duplication group and resolution timestamp.

Controlled topics:

- `TRANSPORT`
- `WEATHER`
- `AIRPORT`
- `ENTRY`
- `OFFICIAL_ADVICE`
- `DESTINATION_EVENT`

Controlled severity:

- `ADVISORY`
- `DISRUPTION`
- `SEVERE`

Controlled lifecycle:

- `ACTIVE`
- `EXPIRING`
- `RESOLVED`
- `ARCHIVED`

Only `ACTIVE` and `EXPIRING` incidents can render publicly. Expired records fail closed.

### `13.1_Live_Monitoring_Status`

This dataset proves monitoring freshness independently of incident presence. It exists so the Build never equates “zero incident rows” with “All Clear”.

Required fields:

- `Monitor_ID`
- `Destination_ID`
- `Topic` (`ALL` or a controlled live topic)
- `Coverage_Status`
- `Last_Checked`
- `Source_Count`
- `Significant_Issue_Count`
- `All_Clear_Eligible`
- `Fresh_Until`
- `Active`
- `Publish`
- `Methodology_Version`

Controlled coverage status:

- `HEALTHY`
- `DEGRADED`
- `UNAVAILABLE`

## All Clear rule

The Build may show **All clear** only when all of the following are true:

1. no governed published incidents match the selected destination/topic;
2. a matching monitoring-status record exists;
3. that status is Active and Publish=Yes;
4. `Coverage_Status=HEALTHY`;
5. `All_Clear_Eligible=Yes`;
6. at least one governed source is represented;
7. `Significant_Issue_Count=0`;
8. `Fresh_Until` is still in the future;
9. methodology version is present.

An empty incident table alone must never produce reassurance.

## De-duplication principle

The publication unit is an incident. Multiple monitored inputs describing the same real-world disruption should resolve to one incident with multiple `Source_IDs`, not multiple traveller cards. `Dedup_Group_ID` exists to support this process upstream.

## Traveller card contract

Each published incident card contains:

1. topic;
2. explicit severity label;
3. affected place;
4. concise headline;
5. **What this means for you** practical impact;
6. last-checked freshness;
7. governed source count and evidence confidence;
8. a `More` disclosure containing supporting summary and public source links when available.

Severity must never rely on colour alone.

## Filtering

The Travel Updates page supports:

- All
- Transport
- Weather
- Airports
- Entry
- Official advice
- Destination events
- governed destination filtering using stable `Destination_ID`

Filtering never manufactures incidents or changes publication eligibility.

## Release boundary

Runtime version: `RC1-DRAFT-0.11`.

`live_intelligence_enabled=false` remains the RC1 safety control until explicit release approval. `NAV-012` remains `Publish=No` until activation. The route is noindex while this capability is unreleased.

## Pi/Cockpit boundary

Pi/Cockpit owns:

- source monitoring;
- RSS/API/page-change ingestion;
- parsing and normalisation;
- source-specific cadence and failure handling;
- de-duplication;
- destination matching;
- candidate classification;
- lifecycle and expiry monitoring;
- candidate traveller-impact preparation;
- operational evidence and monitoring state.

Runtime/Build owns:

- public-safe incident and monitoring-status interfaces;
- fail-closed publication eligibility;
- deterministic filtering and ordering;
- All Clear safety rule;
- traveller-facing presentation;
- public source-link resolution.

## RC1 verification requirements

Certification must prove:

- type-check passes;
- lint passes;
- Vitest passes;
- Next build passes;
- expired/resolved/unpublished incidents do not render;
- missing source lineage fails closed;
- All Clear cannot be inferred from zero incidents;
- stale/degraded monitoring cannot show All Clear;
- destination/topic filters preserve incident identity and do not duplicate cards;
- no direct Pi operational-store dependency exists in Build.
