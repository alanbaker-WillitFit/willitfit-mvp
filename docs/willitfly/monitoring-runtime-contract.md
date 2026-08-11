# WillItFly RC1 Monitoring → Runtime Contract

## Status

Build now, activate after explicit live-release approval.

This contract defines what the Operations Node may monitor, what it may infer, and what may cross the governed Runtime boundary. It deliberately separates factual travel intelligence from commercial/deal intelligence.

## Core rule

**Monitoring is broad. Publication is narrow.**

The Operations Node may watch many sources across the world, but the website only receives governed, public-safe Runtime records. Raw RSS items, API responses, scraped pages, retailer claims and unverified fare observations never publish directly.

Pipeline:

Approved source → Operations Node monitoring → candidate → normalisation → de-duplication → entity/destination matching → classification → evidence → governed decision → Runtime projection → WillItFly Build.

## Monitoring streams

### M01 — Travel News

Purpose: detect material changes that can affect a traveller's decision or journey.

Examples:
- entry/visa changes;
- transport strikes and disruption;
- airport operational changes;
- official travel advice;
- destination events with material traveller impact;
- connectivity/payment/power changes when materially relevant.

Primary public output: `13_Live_Incidents`.

Candidate items are not news articles by default. Multiple source items about the same event become one governed incident.

### M02 — Weather Alerts

Purpose: detect official or high-confidence weather conditions likely to materially affect travel.

Examples:
- severe weather warnings;
- storms, cyclones, hurricanes and typhoons;
- flooding, wildfire-weather interaction and extreme heat where travel is affected;
- airport/transport weather disruption when evidence supports traveller impact.

Primary public output: `13_Live_Incidents` with `Topic=WEATHER`, plus `13.1_Live_Monitoring_Status` for monitoring freshness.

General forecasts do not become incidents. A weather alert must cross a governed significance threshold.

### M03 — Airline Deal Intelligence

Purpose: identify genuinely unusual airline offers rather than reproduce marketing claims.

**Not yet authorised for public activation. Definition of “true deal” remains to be locked.**

Monitoring may collect fare observations and airline promotions, but they must not enter `13_Live_Incidents` merely because an airline labels something a sale.

Planned output family: `14_Airline_Deal_Intelligence`.

Minimum future evidence should include:
- airline/route or market scope;
- fare/cabin/baggage basis where known;
- observed current price;
- comparable baseline or observed history;
- advertised sale claim separately from WillIt assessment;
- booking/travel windows;
- restrictions;
- source lineage;
- confidence;
- detected/checked/expiry timestamps;
- methodology version;
- governed deal verdict.

Until the deal methodology is locked, monitor/capture may run but public publication must fail closed.

### M04 — Other Travel Intelligence

Purpose: provide an intake path for useful travel signals that do not yet belong to an approved taxonomy.

Examples may eventually include:
- major local service changes;
- travel infrastructure changes;
- unusual destination-specific operational information.

There is no generic public `OTHER` topic. Candidates stay upstream until they can be mapped to an approved public topic or a new governed topic is explicitly introduced.

This prevents taxonomy drift and a low-quality “miscellaneous news” feed.

### M05 — Affiliate Deal Intelligence

Purpose: monitor price/value changes for already approved commercial products and offers.

**Commercial stream. Not factual travel news. Not yet confirmed for activation.**

Affiliate deals must not enter `13_Live_Incidents` and must not create red world-map news pins.

Planned output should extend the existing Value Intelligence model rather than create retailer-controlled sale badges.

Expected governed inputs include:
- approved Product_ID;
- approved Offer_ID / Merchant_ID;
- current observed price;
- availability;
- observed price history;
- typical/low/high observed price;
- sale frequency and recency where available;
- evidence confidence;
- methodology version;
- Price Score status;
- WillIt value verdict.

Retailer “was”, RRP or percentage-off claims are evidence inputs only and never proof of value.

## Runtime interfaces

### Existing factual Runtime

`13_Live_Incidents`

Public unit: one governed real-world incident.

Required fields remain defined in `live-intelligence-contract.md`.

`13.1_Live_Monitoring_Status`

Proves that monitoring is fresh enough to support status statements such as All Clear. An empty incident dataset is never interpreted as reassurance.

### Planned commercial/deal Runtime

`14_Airline_Deal_Intelligence` — planned, disabled until methodology approval.

`14.1_Affiliate_Deal_Intelligence` — planned, disabled until commercial/value-intelligence approval.

These datasets must remain separate from factual Live Intelligence so a commercial opportunity can never masquerade as an operational travel alert.

## World-map contract

The Travel Updates hero map is a presentation of **currently published factual incidents only**.

A red pin means:

> one or more current governed updates are published for this destination.

It does **not** mean danger.

Rules:
- coordinates come from governed destination latitude/longitude;
- Build calculates map projection;
- no per-destination visual coordinates are stored in Runtime;
- only destinations represented by currently publishable incidents receive pins;
- pin count is derived from current incident identity, never from raw monitored source-item count;
- resolved, expired, archived, unpublished or failed-evidence candidates cannot create pins;
- deal/affiliate monitoring never creates a factual-news pin.

## Search/filter contract

Users may search/filter the Travel Updates surface by governed destination identity.

The Build may resolve entered destination name, slug, ID or governed alias to the stable Runtime `Destination_ID`. Filtering changes presentation only; it does not change publication eligibility or create new incidents.

## Activation controls

Before live release:
- `live_intelligence_enabled=false`;
- Travel Updates navigation remains unpublished;
- route remains `noindex`;
- factual monitoring may be developed/tested without public activation;
- airline deal monitoring may collect evidence but public deal publication remains disabled;
- affiliate deal monitoring remains disabled unless explicitly approved.

Activation requires a separate explicit release decision after the main WillItFly live build.

## Operations Node implementation boundary

The monitoring engine should be source-family driven, not hard-coded per destination wherever avoidable.

Each source/monitor definition should contain at minimum:
- Monitor_ID;
- Monitoring_Stream (`M01`–`M05`);
- Source_ID / source family;
- entity/destination scope;
- retrieval method (RSS/API/permitted page change/other approved method);
- cadence;
- parser/normaliser version;
- last attempt;
- last success;
- health state;
- failure count/backoff state;
- evidence retention reference;
- active flag;
- methodology version.

Candidate records should preserve source lineage and original observation timestamps so later governance can explain why an incident or deal assessment exists.

## Fail-closed rules

The system must not publish when:
- required source lineage is missing;
- destination/entity matching is unresolved;
- evidence confidence is below the approved threshold;
- the candidate is stale or expired;
- monitoring health is insufficient for the statement being made;
- deal methodology is not approved;
- a commercial observation is being incorrectly routed into factual Live Intelligence;
- publication or feature flags are off.

## Scale principle

WillItFly may monitor a very large global source set. Scale is handled upstream through source families, de-duplication, queueing, bounded concurrency and governed candidate processing. The public interface stays small: relevant destination pins, destination/topic search, and concise WillIt cards.
