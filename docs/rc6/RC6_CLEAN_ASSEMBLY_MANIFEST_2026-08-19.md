# WillItFit RC6 — Clean Assembly Manifest — 19 August 2026

## Purpose

RC6 is a controlled allowlist rebuild. The frozen RC5 estate and historical branches are evidence and recovery sources, not automatic ancestry. Nothing is admitted to RC6 unless it has a positive recovery decision and an RC6 verification gate.

Governing rule:

> Recover deliberately. Rebuild selectively. Import nothing by assumption.

Clean means absence has been proved, not merely that known legacy files were deleted.

## Frozen evidence and RC6 authorities

- RC5 evidence branch: `rc5-final-launch-prep-20260809`
- Frozen RC5 evidence SHA: `eea8a3fc662a4247e12ba8a5803b1f1dc91a2ad6`
- RC6 audit/build branch: `rc6-build-audit-20260819`
- Mother authority: `Mother_RC6`
- Build Runtime authority: `Runtime_RC6`
- Build contract authority: `Runtime_RC6!00.3_Build_Contract` plus `00.4_Contract_Exceptions` and the `WillItFit RC6 — Build Contract Pack`
- Recovery authority: `docs/rc6/RC6_RECOVERY_REGISTER_2026-08-19.md`

No functional RC6 implementation begins until this manifest and the Recovery Register are treated as the build allowlist.

## Verified current Runtime_RC6 build contract

The live `00.3_Build_Contract` tab was re-read directly during this audit. It is the current dataset-level truth for Build RC6. Earlier audit-state rows elsewhere in Runtime_RC6 are historical evidence and must not override this contract.

### READY datasets

- `02_Airlines` — 114
- `03_Airline Rules` — 425
- `04.1_Special Baggage Results` — 21
- `05_FAQs` — 5
- `06_Tips` — 182
- `07_Site Content` — 12
- `08.2_Articles` — 15
- `08.2.1_Article_Sections` — 49
- `10_Lab` — 1
- `10.1_Lab_Game_Catalogue` — 1 certified route
- `runtime_product_groups` — 20

### RETAINED_REQUIRES_BUILD_CONFIRMATION

These datasets exist in Runtime_RC6 but are deliberately not accepted by inheritance. Build readers/contracts must be audited before use:

- `01_Settings` — 11
- `04_Special Baggage All` — 24
- `07.1_Navigation` — 1
- `08_SEO Pages` — 15
- `09_Affiliate_Placements` — 0; legacy compatibility only, not RC6 commercial authority
- `11_Countries_Base` — 133
- `11.1_Country_Travel_Facts` — 132
- `15_Redirects` — 0

### SCHEMA_READY_EMPTY

These are valid authoritative empty states and must be cacheable as empty, not treated as misses or reasons to fall back:

- `08.1_Travel Notifications`
- `08.3_Ask_Questions`
- `08.3.1_Ask_Answers`
- `08.4_Travel_Alerts`
- `runtime_brands`
- `runtime_products`
- `runtime_product_compatibility`
- `runtime_product_assessments_summary`
- `runtime_retailers`
- `runtime_offers`
- `runtime_price_intelligence`
- `runtime_affiliate_routes`
- `runtime_recommendations`
- `runtime_cards`
- `runtime_card_placements`
- `runtime_pages`
- `runtime_page_sections`
- `runtime_methodology`

### Explicit RC6 exceptions

- Special Baggage is 21 governed results; RC5 exact-14 is stale.
- Ask Questions/Answers: schema only; private/test submissions must not be exposed.
- Travel Notifications: empty; fail closed; historical TEST-RED is excluded.
- Gate Rush: held; do not activate.
- Legacy Affiliate Placements: empty; RC6 Product Intelligence contract supersedes RC5 smoke rows.
- Product scoring thresholds/methods remain open governance; interfaces may exist but no thresholds may be invented.

## Assembly classes

### A — RECOVER EXACTLY

These assets/data are governed originals and must be transferred byte-for-byte or equivalently without redesign/recreation.

1. `WIFIT-BRAND-TICK-01`
   - Drive master: `willitfit-master-tick-logo.png`
   - Drive ID: `1D3VP0nOFUXpXDpK0LWRuFmOY-IBaXKrK`
   - Intended path: `public/assets/logo/willitfit-master-tick-logo.png`
   - Never redraw, trace, regenerate or approximate.

2. Approved Advanced/Oversized baggage hero asset
   - Governed path reference: `public/assets/special-baggage/advanced-oversized-baggage-hero-rc5.webp`
   - Recover exact approved binary only.
   - The open listing-image defect is not solved merely by copying the file.

### B — REUSE LOGIC, NOT TREE ANCESTRY

The following RC5 capabilities are worth preserving, but only after dependency extraction and contamination review:

1. Fit mathematics and dimension comparison.
2. Independent result-state presentation and BagVisualizer concepts.
3. Fixed-dimension, linear-total and weight-only baggage-rule concepts.
4. Google service-account read-only authentication mechanics.
5. Request timeout, retry and last-known-good concepts where compatible with RC6 CACHE.
6. Search ranking helpers where they are data-source neutral.
7. Useful accessibility/focus patterns from proven UI components.
8. RC5 certification sequence pattern: install → type-check → lint → tests → build.

Each recovered logical unit must be placed into a clean RC6 dependency graph. Importing a good function does not authorise importing its legacy helpers, fallbacks or tab aliases.

### C — REUSE CONCEPT / REBUILD IMPLEMENTATION

1. Size Guides
   - Preserve useful grouping concepts: fixed dimensions, linear-total groups, airline links, metric/imperial display, progressive disclosure and return-to-checker journey.
   - Rebuild readers and presentation against Runtime_RC6.
   - Reject direct dependency on legacy Travel Essentials / affiliate slots.
   - Reject inherited local fallback as publication authority.
   - Replace old `*-rc4.jpg` asset references with approved RC6 assets.

2. Positive publication gating
   - Preserve the principle that publication requires explicit positive governance signals.
   - Rebuild dataset-by-dataset from the RC6 contract.
   - Do not retain generic legacy-status fallback unless explicitly authorised by a specific RC6 dataset contract.

3. Known-tab/schema allowlisting
   - Preserve explicit schema allowlisting.
   - Rebuild as an RC6-only registry.
   - Old RC4/RC5/WillItFly product flags and legacy affiliate tabs are prohibited from the production registry unless an RC6 contract explicitly defines them.

4. Ask / question submission
   - Preserve the moderated, private, never-auto-publish concept.
   - Existing divergent endpoint is evidence only.
   - RC6 core launches with Ask Questions/Answers schema-ready empty unless a separate privacy/security/publication contract is approved.

### D — CLEAN REBUILD / NEW RC6 FOUNDATION

1. Canonical Runtime_RC6 dataset registry.
2. RC6 schema registry.
3. Dataset state model: READY / SCHEMA_READY_EMPTY / HELD / FAIL-CLOSED and governed variants.
4. Shared Build + bot/runtime-reader contract.
5. RC6 CACHE architecture:
   - dataset freshness classes;
   - authoritative-empty caching;
   - logical snapshots;
   - manifest/version/checksum metadata;
   - L1 Worker memory;
   - L2 Cloudflare KV where approved;
   - governed hard-stale suppression;
   - dependency-driven invalidation.
6. Special Baggage 21-result contract.
7. Product Groups reader for the governed 20 groups.
8. Products / offers / price intelligence / affiliate routes / recommendations contracts, initially fail-closed where empty.
9. RC6 commercial recommendation engine when publication gates are satisfied.
10. RC6 certification workflow.
11. Legacy-contamination certification.
12. RC6 staging/smoke/soak evidence framework.

### E — REJECT FROM RC6 PRODUCTION AUTHORITY

1. Legacy commercial tabs/logic:
   - `09_Affiliate_Placements`
   - `82_Affiliate_Intent_Map`
   - `83_Affiliate_Rules`
   - `84_Recommendation_Cards`
   - old merchant-priority recommendation truth.
2. Synthetic active/published affiliate placeholders.
3. Hardcoded Special Baggage exact-14 assumption.
4. RC4/RC5 Runtime aliases carried merely for backward compatibility.
5. Old Runtime spreadsheet IDs in production code/config.
6. Old product/version flags in active schema contracts unless explicitly governed for RC6.
7. Local content/airline/commercial fallbacks that can silently republish stale factual data.
8. Gate Rush production activation during core RC6 build; held pending separate rebuild certification.
9. Private commercial programme/account fields in frontend Runtime responses.
10. Historical Ask/test submissions as public RC6 content.

## RC5 smoke defects promoted to RC6 prove-or-rebuild gates

The 2 August RC5 smoke checkpoint documented important behaviour that RC6 must explicitly prove, regardless of whether later RC5 work appeared to improve it.

### Checker and airline rules

- airline selection must remain selected reliably;
- aliases/abbreviations/codes must be governable;
- fixed-dimension checked baggage must resolve correctly;
- linear-total checked baggage must respect `lt` versus `lte`;
- weight-only rules must remain safe and explanatory;
- every dimension must receive its own result state;
- overall result is the worst individual state, never an overwrite of all dimensions;
- boundary regression: exact, +1 cm, +2 cm, +3 cm;
- three-digit oversize inputs must work;
- unavailable Special/Oversized states must be distinguished from defects;
- result calculation must not trigger unnecessary repeated Runtime reads.

### Search / FAQ / Tips / Articles

- answer-first behaviour is preferred over generic airline-page ranking for questions;
- FAQ and Tips remain separate governed datasets;
- Tips and Articles must be routable when approved/published;
- governed aliases/search terms must be supported;
- no unanswered user question or reply is auto-published;
- empty/unpublished knowledge fails closed.

### UI / assets / cache

- normal cached sessions must pass; private mode is supporting evidence only;
- mobile dynamic-card expansion/focus/scroll behaviour must be smoke tested;
- desktop/mobile navigation persistence must be tested;
- Oversized listing image must be verified in a clean session;
- exact brand icon must be verified in desktop/mobile headers;
- Cloudflare image/static asset packaging and bindings must be tested;
- no stale cache state may make a missing airline/content item appear/disappear inconsistently.

## CACHE and bot alignment

All approved Runtime consumers use one RC6 contract. The website and bot/runtime-reader must share:

- dataset keys and tab mapping;
- schemas;
- publication-state rules;
- authoritative-empty semantics;
- cache metadata;
- freshness/hard-stale interpretation;
- fail-closed rules.

A separate bot-specific factual contract is prohibited unless deliberately approved as another product contract.

Target path:

`Mother_RC6 → Publisher → Runtime_RC6 → controlled refresh → CACHE manifest/snapshots → L2 KV → L1 memory → Build / approved Runtime consumers`

The Build never reads Mother directly.

## Initial logical CACHE partitions

Subject to final dataset audit:

- `runtime:core`
- `runtime:content`
- `runtime:commercial`
- `runtime:reference`
- `runtime:manifest`

Do not invalidate stable airline/content identity merely because one commercial offer changes.

Authoritative zero-row datasets are cached as valid empty states, not treated as misses.

## Build order after manifest lock

### Phase 1 — Clean foundation

1. RC6 package/build identity and branch-only certification.
2. Canonical Runtime dataset registry.
3. RC6 schema registry.
4. Dataset state/fail-closed types.
5. CACHE manifest/types and refresh interface.
6. Shared runtime-read abstraction used by Build and bot consumers.
7. Diagnostics/observability with no private-data leakage.
8. Legacy-contamination test harness.

### Phase 2 — Core tool

1. Airlines.
2. Airline rules.
3. Searchable airline selector and aliases.
4. Fit calculation.
5. Checker form.
6. Result display.
7. Checked baggage fixed/linear/weight-only paths.
8. Special Baggage 21-result path.
9. Core assets and exact approved branding.

The core checker must certify independently before commercial UI is added.

### Phase 3 — Governed content and discovery

1. Settings — retained, 11 rows; Build reader contract must be confirmed before use.
2. Special Baggage All — retained, 24 rows; source-reader contract must be confirmed before use.
3. Site Content — READY, 12 rows.
4. FAQs — READY, 5 rows.
5. Tips — READY, 182 rows.
6. Articles — READY, 15 rows.
7. Article Sections — READY, 49 rows.
8. Navigation — retained, 1 row; Build reader contract must be confirmed before use.
9. SEO Pages — retained, 15 rows; Build reader/canonical contract must be confirmed before use.
10. Countries — retained, 133 rows; Build reader contract must be confirmed before use.
11. Country Facts — retained, 132 rows; Build reader contract must be confirmed before use.
12. Redirects — retained empty; verify whether Build requires reader support.
13. Size Guides rebuilt against RC6 data readers.
14. Lab certified route only.
15. Ask public empty state and approved read-only knowledge behaviour.
16. Travel Alerts/Notifications remain authoritative empty until published.

### Phase 4 — Product Intelligence contract readiness

1. Product Groups — READY, 20.
2. Brands empty/read contract.
3. Products empty/read contract.
4. Compatibility empty/read contract.
5. Product assessment-summary empty/read contract.
6. Retailers empty/read contract.
7. Offers empty/read contract.
8. Price intelligence empty/read contract.
9. Affiliate routes empty/read contract.
10. Recommendations empty/read contract.
11. Cards/card placements empty/read contract.
12. Pages/page sections empty/read contract.
13. Methodology empty/read contract.

No public commercial product is invented to exercise the UI.

### Phase 5 — Commercial experience only after governed data exists

1. Context determination.
2. Eligibility/publication checks.
3. Compatibility checks.
4. Product Score / Price Score interfaces only with authorised methodology.
5. Recommendation decision.
6. Retailer choices.
7. Affiliate disclosure and click behaviour.
8. Analytics events that contain no private commercial data.

## Legacy contamination certification

RC6 cannot be called clean until automated/manual scans prove the active production tree/config does not contain unauthorised:

- `RC2`
- `RC3`
- `RC4`
- `RC5`
- old spreadsheet IDs
- old runtime aliases
- legacy affiliate tab names
- exact-14 Special Baggage assumptions
- obsolete asset references
- synthetic commercial placeholders
- archived code reachable from production
- stale deployment targets or feature flags

Historical references may remain under explicitly permitted audit/migration documentation, but not active production contracts.

## Release campaign — no rush

RC6 is quality-gated, not date-driven.

Required progression:

`Built → Certified → Smoke Tested → Soak Tested → Release Candidate → Approved for Public → Live`

### Certification

- dependency install from lockfile;
- TypeScript;
- lint;
- unit tests;
- contract tests;
- production build;
- Runtime/schema tests;
- CACHE tests;
- authoritative-empty tests;
- hard-stale tests;
- bot/build contract parity;
- contamination scan;
- private-data leakage tests.

### Full smoke test before release

Test at minimum:

- desktop and mobile;
- supported major browsers;
- normal session, hard refresh and private session;
- cold cache and warm cache;
- Runtime available;
- controlled Runtime read failure;
- authoritative-empty datasets;
- deep links;
- navigation;
- SEO/canonical routes;
- checker and all result states;
- baggage boundary cases;
- Special Baggage all governed categories;
- images and exact assets;
- 404/error/no-data states;
- accessibility basics and keyboard focus;
- external links;
- feature-disabled commercial behaviour.

### Real-data reconciliation

Representative airlines must be compared directly with Runtime_RC6 for each supported baggage-rule family. Any mismatch is classified as data, contract or Build defect rather than patched blindly.

### Soak

RC6 remains in Draft/staging after certification long enough to observe:

- cache hit/miss/refresh behaviour;
- Runtime request volume;
- stale suppression;
- logs/errors;
- asset loading;
- mobile/desktop behaviour;
- unexpected state changes.

Certification is not deployment approval. Public promotion is a separate human decision.

## Next action

Finish reader-level verification for the `RETAINED_REQUIRES_BUILD_CONFIRMATION` datasets: Settings, Special Baggage All, Navigation, SEO Pages, Countries, Country Facts and Redirects. Record exact RC5 reader presence/absence and classify each as REUSE LOGIC, REBUILD or NEW. Once those are resolved, this manifest can be locked and Phase 1 may begin.
