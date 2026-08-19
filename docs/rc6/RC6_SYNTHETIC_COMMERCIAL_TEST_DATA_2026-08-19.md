# RC6 Synthetic Commercial Test Runtime — 19 August 2026

## Authority

This document records a deliberately synthetic, non-authoritative Runtime copy used only for RC6 commercial/page integration testing.

- Synthetic Runtime title: `Runtime_RC6_SYNTHETIC_TEST_2026-08-19`
- Synthetic Runtime spreadsheet ID: `1-tGk8UdSUjVVQZWbYMAvoK4CLMLwgoBKEZUwOx24xqU`
- Source copied from governed `Runtime_RC6` before test seeding.
- Mother_RC6 and governed Runtime_RC6 remain unchanged.

## Hard rule

Synthetic rows MUST NOT be promoted to Mother_RC6, governed Runtime_RC6, public Runtime, or production merely because they pass tests.

All synthetic IDs use the `TEST-` prefix and all merchant/affiliate destinations use `example.com` test URLs.

Synthetic Product Score and Price Score values are test data only. They do not establish or approve production scoring thresholds, methodology or commercial ranking policy.

## Seeded graph

The synthetic Runtime currently contains:

- 3 synthetic brands
- 6 synthetic products, including 1 HELD negative case
- 4 compatibility rows against real governed airline-rule IDs
- 5 synthetic product assessments
- 2 synthetic retailers
- 6 synthetic offers, including 1 OUT_OF_STOCK negative case
- 4 synthetic price-intelligence rows
- 4 synthetic affiliate routes
- 5 synthetic recommendations, including 1 HELD negative case
- 3 synthetic Action Panel cards
- 4 synthetic card placements
- 4 synthetic pages, including 1 HELD negative case
- 8 synthetic page sections
- 2 synthetic methodology records

Product groups intentionally reuse governed RC6 Product Group IDs `PG05`, `PG06` and `PG09` so the test graph exercises Packing/Compression Cubes, Luggage Scales and Travel Adapters without changing the authoritative 20-group catalogue.

## Core commercial journey under test

The synthetic data exists to prove the future commercial path while authoritative production datasets may remain empty:

`Product Group -> Product -> Compatibility / Assessment -> Retailer -> Offer -> Affiliate Route -> Recommendation -> Card -> Placement -> Page -> Page Section`

The synthetic journey is deliberately data-driven. A test record does not become eligible merely because it exists.

## Eligibility and trust gates under test

The RC6 commercial test suite now explicitly proves:

- HELD products, recommendations and pages are suppressed.
- Duplicate primary IDs and orphan relationships fail closed.
- An affiliate CTA requires a valid product, retailer, in-stock offer and matching affiliate route.
- Offers hard-stale after 48 hours; the exact 48-hour boundary remains eligible.
- Price-intelligence records hard-stale after 72 hours and must point to a currently eligible routed offer.
- Affiliate routes hard-stale after 7 days.
- Missing or malformed action freshness timestamps fail closed.
- Recommendation `requiredCompatibility` is enforced unless explicitly `NOT_APPLICABLE`.
- Compatibility evidence must meet the recommendation's minimum evidence confidence when one is specified.
- Product assessments must meet any governed minimum Product Score and minimum evidence confidence.
- A recommendation may legitimately require evidence confidence without also specifying a Product Score threshold.
- Recommendation tiers are ordered deterministically, with `PRIMARY` before `SECONDARY`.
- Page-section `maxItems` is enforced from Runtime data.
- Card-placement `maxDisplayCount` is enforced from Runtime data.
- Placement `validFrom` / `validTo` windows are enforced.
- Required page sections fail the page closed when their data source resolves empty.
- Authoritative-empty production datasets remain valid empty truth and do not create synthetic commercial output.

## Core-result boundary

Commercial content is not tested inside the core baggage-fit result.

The fourth synthetic placement is intentionally configured as:

- `contextType = POST_RESULT_GUIDANCE`
- `contextId = CABIN_FIT_PASS`
- `trigger = AFTER_RESULT`

This preserves the locked RC6 boundary: the fit result itself remains commercially clean; contextual recommendations may be tested only as a subsequent helpful next step.

## Synthetic relationship notes

The four compatibility records are:

1. `TEST-COMP-001` — `TEST-PROD-001` against governed British Airways cabin rule `BAW-CAB-20260721-003`, PASS / HIGH.
2. `TEST-COMP-002` — `TEST-PROD-005` against governed British Airways personal-item rule `BAW-PER-20260721-003`, PASS / HIGH.
3. `TEST-COMP-003` — `TEST-PROD-005` against governed Jet2 personal-item rule `JET2-PER-20260721-002`, PASS / HIGH.
4. `TEST-COMP-004` — `TEST-PROD-004` against governed British Airways cabin rule `BAW-CAB-20260721-003`, PASS / MEDIUM.

`TEST-COMP-004` exists so the secondary PG05 packing-cube recommendation can satisfy its own `requiredCompatibility=PASS` and `minimumEvidenceConfidence=MEDIUM` contract without weakening the recommendation rule.

## Non-promotion rule

Passing synthetic tests proves software behaviour only. It does not prove that any real product, merchant, offer, affiliate route, score, recommendation, page or commercial claim is publication-ready.

Before public activation, real records must independently pass Mother governance, Runtime publication gates, evidence/freshness rules, commercial eligibility, Draft verification and the RC6 release process.
