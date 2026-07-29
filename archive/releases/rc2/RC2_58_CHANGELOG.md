# RC2.58 — Commercial Decision Engine Integration

## Scope

RC2.58 integrates the merchant-independent RC15 commercial architecture without activating ungoverned affiliate output.

## Changes

- Added `services/recommendations.ts` as the governed recommendation decision service.
- Added runtime reads for `82_Affiliate_Intent_Map`, `83_Affiliate_Rules`, and `84_Recommendation_Cards`.
- Enhanced the Google Sheets reader to discover governed header rows within the first 12 rows, allowing document-style RC15 sheets to remain readable at runtime.
- Added `/api/recommendations` for result-context recommendation decisions.
- Added `ResultRecommendation` below the canonical result guidance.
- Extended `AffiliateCard` with governed card CTA text.
- Added fail-closed recommendation tests.

## Locked Behaviour

- Canonical answer and result guidance render independently of commercial data.
- No recommendation renders unless the intent, rule, card, live product, and HTTPS link all pass.
- Commercial recommendations appear only after the result and result questions.
- Merchant onboarding remains a later data-population activity.
