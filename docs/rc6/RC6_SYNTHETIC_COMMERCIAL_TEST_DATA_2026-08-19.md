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

## Seeded graph

The synthetic Runtime currently contains:

- 3 synthetic brands
- 6 synthetic products, including 1 HELD negative case
- 3 compatibility rows against real governed airline-rule IDs
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

## Test intent

This dataset exists to prove the full future commercial path while authoritative production datasets may remain empty:

`Product Group -> Product -> Compatibility / Assessment -> Retailer -> Offer -> Affiliate Route -> Recommendation -> Card -> Placement -> Page -> Page Section`

Tests must also prove fail-closed behaviour for HELD products/recommendations/pages, out-of-stock offers, missing relations, stale commercial data and authoritative-empty production datasets.

Synthetic Product Score and Price Score values are test data only. They do not establish or approve production scoring thresholds, methodology or commercial ranking policy.
