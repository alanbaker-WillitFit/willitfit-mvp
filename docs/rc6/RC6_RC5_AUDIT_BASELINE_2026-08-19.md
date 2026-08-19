# WillItFit RC6 — RC5 Audit Baseline — 19 August 2026

## Authority and isolation

- RC5 evidence branch: `rc5-final-launch-prep-20260809`
- Frozen RC5 evidence SHA: `eea8a3fc662a4247e12ba8a5803b1f1dc91a2ad6`
- RC6 audit/build branch: `rc6-build-audit-20260819`
- RC6 data authority: `Mother_RC6`
- RC6 runtime authority: `Runtime_RC6`
- RC6 build contract authority: `WillItFit RC6 — Build Contract Pack`

RC5 is audit evidence only. No RC6 implementation is to be linked back into RC5. Runtime_RC6 is the build data source; Mother_RC6 is not read directly by the website.

## Build-method decision

The RC5 audit does **not** justify rebuilding the entire application from scratch. It does justify rebuilding the RC6 contract-facing and commercial subsystems cleanly.

RC6 should therefore be a **controlled derivative with a clean RC6 contract layer**:

- retain proven checker mathematics, core result presentation, Google Sheets read infrastructure, base app shell, design system and suitable tests;
- rebuild or substantially adapt runtime schema/source contracts, Special Baggage contract handling, Product Intelligence / affiliate / recommendation logic, commercial empty states, fallback policy and RC6 certification;
- do not carry legacy RC5 commercial tab assumptions into RC6.

## Proven RC6 blockers in RC5

### 1. Special Baggage exact-14 assumption

RC5 hardcodes 14 Special Baggage category IDs and SBR001–SBR014 mappings. Its validator accepts only exactly 14 unique published categories. RC5 tests also explicitly require exactly 14. RC6 requires the governed 21-result Runtime contract.

**Classification: REBUILD/ADAPT FOR RC6.** The 21-result contract must be runtime-governed rather than a stale fixed RC5 constant.

### 2. Legacy affiliate / recommendation contract

RC5 recommendation logic reads legacy tabs `82_Affiliate_Intent_Map`, `83_Affiliate_Rules`, `84_Recommendation_Cards`, and `09_Affiliate_Products`. Products are sorted using `merchantPriority`. There is no RC6 Product Score / Price Score / evidence-confidence / governed compatibility / independent WillIt Recommended contract.

**Classification: REBUILD.** The endpoint and post-result placement pattern may be reused structurally, but the decision model and payload must be replaced by the Product Intelligence Runtime contract.

### 3. Fixed commercial slot and placeholder model

RC5 uses six hardcoded Travel Essentials categories and ten slots per category. Missing products are replaced by local placeholders marked active/published. RC6 has 20 governed product groups and zero public products/offers/recommendations until publication gates pass.

**Classification: REMOVE/REBUILD.** RC6 commercial empty state must fail closed and must not manufacture published recommendation placeholders.

### 4. Mixed legacy schema registry

`services/sheetSchemas.ts` contains a mixture of legacy RC4/MVP tabs, RC5 tabs, old affiliate/QE contracts and current tabs. It also contains duplicate logical keys such as `02_Airlines` in the object definition.

**Classification: REBUILD AS RC6 SCHEMA REGISTRY.** Only Runtime_RC6 Build Contract datasets and explicit RC6 exceptions should be active.

### 5. RC5 certification is branch-specific

The current GitHub Actions workflow is named RC5 Local Certification and explicitly targets RC5 branches.

**Classification: ADAPT/REBUILD AS RC6 CERTIFICATION.** Preserve the install/type-check/lint/test/build pattern, but bind it to the RC6 branch and RC6 contract tests.

## Strong reusable foundations

### Google Sheets read infrastructure — REUSE WITH RC6 CONTRACT ADAPTATION

The RC5 reader already uses read-only Sheets scope, runtime/environment spreadsheet ID resolution, timeout control, token caching, schema validation, short retry after failed reads, intentionally blank canonical tabs as authoritative empty, and last-known-good validated rows without replacing them on a failed refresh.

Retain these mechanics. Do not change the public Runtime environment target during audit.

### Core checker and result experience — REUSE / REGRESSION PROTECT

The fit calculation, dimension workflow, result states, linear-total handling, weight-only handling and result presentation are independent of the legacy affiliate model and should be preserved unless RC6 contract verification proves a mismatch.

### Content reader pattern — ADAPT

Runtime publication filtering, duplicate rejection and canonical tab reading are useful. Local fallback behaviour must be reviewed per RC6 dataset so that authoritative-empty Runtime datasets remain empty and stale local commercial/content records cannot silently republish.

### Navigation and SEO readers — ADAPT AFTER RC6 CONTRACT VERIFICATION

Both are already runtime-driven and fail to an empty result when their tab is unavailable. Their actual RC6 tab/header contracts still require verification against Runtime_RC6.

## Provisional classification matrix

| Area | RC5 evidence | RC6 classification | RC6 action |
|---|---|---|---|
| Fit calculator / dimensions | Proven independent core logic | REUSE AS-IS / regression protect | Keep, rerun tests against RC6 airline/rule data |
| FitResultCard / BagVisualizer | Core result UX, no direct affiliate dependency | REUSE | Preserve |
| Google Sheets auth/read/cache | Strong fail-closed/LKG infrastructure | REUSE + ADAPT | Point RC6 draft/test env to Runtime_RC6 only when explicitly configured |
| Runtime source names | Current canonical RC5 map | ADAPT | Create RC6 canonical source registry from Build Contract Pack |
| Sheet schema validation | Mixed RC4/RC5/legacy registry | REBUILD | RC6-only registry and contract tests |
| Runtime content publication filtering | Useful governance logic | ADAPT | Lock fallback rules per RC6 dataset |
| Airlines / airline rules | Mature reader/tests | ADAPT + VERIFY | Verify Runtime_RC6 headers and counts; retain core mapping where aligned |
| FAQs / Tips / Articles | Mature runtime readers/tests | ADAPT + VERIFY | Align to RC6 published projections and recovered records |
| Special Baggage | Hardcoded 14 | REBUILD/ADAPT | Consume governed 21-result RC6 contract; replace tests |
| Navigation | Runtime reader exists | ADAPT + VERIFY | Confirm RC6 inherited contract |
| SEO Pages | Runtime reader exists | ADAPT + VERIFY | Confirm RC6 inherited contract |
| Settings | No clear dedicated reader found in RC5 tree | MISSING / VERIFY | Map RC6 requirement and implement only if Build Contract requires consumption |
| Countries / Country Facts | No clear dedicated RC5 reader found | MISSING / VERIFY | Confirm Runtime_RC6 contract and add reader only if required |
| Ask public data | Existing Ask/QE application is legacy, RC6 public rows = 0 | REBUILD/FAIL CLOSED | Do not expose private/test submissions; define schema-ready empty behavior |
| Travel Notifications | RC6 empty/fail-closed; RC5 has separate Travel Alerts reader | ADAPT/SEPARATE | Do not conflate notifications with alerts; verify active Runtime_RC6 contracts |
| Lab | Runtime reader exists | ADAPT + VERIFY | Consume certified WillItFly route only; keep Gate Rush held |
| Product Groups | RC6 has 20 governed groups; no equivalent RC5 runtime reader | NEW | Add RC6 Product Group reader |
| Products / Offers / Recommendations | RC6 public rows = 0 | NEW + FAIL CLOSED | Implement empty-state contract first; no synthetic records |
| Legacy affiliate placement loader | RC5 `09_Affiliate_Placements` + aliases | REMOVE AS AUTHORITY | Do not use in RC6 |
| Legacy recommendation engine | Old 82/83/84 + product rows | REBUILD | Use PI contract, independent recommendation truth and commercial eligibility |
| Travel Essentials six-category constants | Hardcoded | REMOVE/REBUILD | Drive from governed Product Groups / placements when published |
| Affiliate placeholders | Synthetic active/published slots | REMOVE | Empty means empty |
| Recommendation API route | Useful endpoint shape | ADAPT | New RC6 payload and service behind it |
| Post-result recommendation placement | Contextual, secondary to answer | ADAPT | Preserve trust-first placement; render only approved Runtime data |
| RC5 runtime-contract JSON | Explicit 14 and legacy affiliate assumptions | REMOVE AS RC6 AUTHORITY | Replace with RC6 Build Contract-derived code/config |
| RC5 publisher | Runtime writing tool | NOT PART OF BUILD AUDIT | Build must not write Mother/Runtime |
| RC5 certification workflow | Good test sequence but RC5 branch-specific | ADAPT/REBUILD | RC6 workflow + RC6 contract tests |

## RC6 CACHE and bot/runtime-read workstream alignment

CACHE and any bot/runtime-reader implementation are now part of this RC6 build workstream rather than a separate architectural track. This is specifically to prevent a second consumer from drifting away from the website's Runtime contract, schema, fail-closed rules or publication semantics.

The authority chain remains:

`Mother_RC6 → governed publication → Runtime_RC6 → CACHE → Build / approved Runtime consumers`

The website and any approved bot/read consumer must never treat Mother as a direct read source. They must consume the same canonical Runtime_RC6 dataset definitions and the same authoritative-empty semantics.

### CACHE design decision

RC6 must not use one global Runtime TTL. Cache policy is dataset-aware and must preserve governance freshness rules rather than inventing Build-side freshness.

Initial logical cache classes:

- **CACHE CLASS A — CORE / STABLE:** airlines, product groups, products, brands, pages, methodology and similar slow-changing identity/reference datasets. Long-lived cache; refresh primarily on governed publication/version change with safety revalidation.
- **CACHE CLASS B — DEPENDENCY DRIVEN:** airline rules, product compatibility and recommendations. Refresh/invalidate when their governed source dependencies change.
- **CACHE CLASS C — COMMERCIAL DYNAMIC:** offers, price intelligence and affiliate routes. Shorter freshness windows; records must never be served beyond governed hard-stale rules.

Specific commercial freshness examples from the Product Intelligence contract are treated as governance inputs, not Build policy: offers approximately daily with a 48-hour hard stale limit; price intelligence daily with a 72-hour hard stale limit; affiliate routes with a seven-day hard stale limit; product identity may be materially slower-changing; compatibility refreshes when product or airline-rule dependencies change.

### Authoritative empty is cacheable truth

A reachable RC6 Runtime dataset with zero approved rows is a valid state, not a cache miss. `SCHEMA_READY_EMPTY` commercial datasets must therefore be cached as authoritative empty results and must not trigger repeated Google reads or fallback to legacy datasets.

This rule applies especially to the currently empty RC6 products/offers/recommendations/affiliate-route datasets.

### RC5 and RC6 commercial paths remain isolated

Current/live RC5 may continue to use its existing `09_Affiliate_Placements` path until replacement launch. RC6 must independently use the Product Intelligence Runtime family and must not make the legacy placement model a CACHE dependency.

The two paths must not be silently bridged:

- RC5/current: legacy placement path until replacement launch.
- RC6/future: `runtime_product_groups`, `runtime_products`, retailers/offers/price-intelligence/affiliate-routes/recommendations and related governed datasets.

### Logical snapshot direction

Do not build one giant Runtime blob. Prepare CACHE around a small number of logical snapshots plus a manifest, for example:

- `runtime:core`
- `runtime:content`
- `runtime:commercial`
- `runtime:reference`
- `runtime:manifest`

The exact partition remains subject to the final Runtime_RC6 tab/relationship audit, but commercial invalidation must not force unrelated stable datasets to be reloaded.

### Runtime cache manifest

The RC6 cache layer should expose enough metadata to determine whether Google must be touched. Candidate manifest fields include:

- Runtime version/publication version;
- dataset key;
- dataset version/checksum;
- dataset state including authoritative empty;
- freshness class;
- source publication timestamp;
- last successful refresh;
- hard-stale threshold where applicable;
- dependency/version references where invalidation is dependency-driven.

CACHE must be able to determine that a dataset has not changed without forcing a full Runtime reread.

### Layering target

Target read path:

`Runtime_RC6 → controlled refresh → manifest/logical snapshots → Cloudflare KV L2 → Worker memory L1 → Build / approved Runtime readers`

No production migration is authorised by this audit. Existing production cache behaviour remains unchanged until RC6 implementation and certification gates explicitly approve switching.

### Analytics boundary

Future commercial analytics may record events such as page view, airline-page view, product-group view, product view, offer impression, affiliate CTA impression/click and recommendation impression. Analytics must not become a commercial decision engine and must not expose private programme IDs, commission rates, account identifiers or other Mother-only/private fields.

CACHE efficiency should also be observable so page traffic can be separated into L1 hits, KV hits and controlled Runtime refreshes.

### Bot/runtime-reader alignment rule

Any RC6 bot or automated reader that serves or derives user-facing RC6 data must share the same canonical Runtime source registry, schema registry, publication-state interpretation, authoritative-empty handling and freshness metadata as the website. A parallel bot-specific contract is prohibited unless explicitly approved as a separate governed product contract.

Bots/automation may prepare, analyse or observe data under their existing authority boundaries, but they must not silently widen publication authority, invent missing commercial data, bypass Runtime, or use CACHE as an excuse to serve data beyond governed freshness/hard-stale limits.

**Status:** RC6-aware CACHE architecture approved for preparation; production CACHE migration not approved; commercial CACHE activation held until datasets are populated/certified; additional recurring-cost target remains £0.

## RC6 audit gates before functional implementation

1. Verify RC5 remains at frozen SHA and RC6 branch remains isolated.
2. Read Runtime_RC6 build-contract/exception tabs and confirm exact inherited datasets requiring Build-side verification.
3. Verify Settings, Navigation, SEO Pages, Countries/Country Facts and any Special Baggage source/all table against Runtime_RC6.
4. Produce the final file-level RC6 gap matrix, including CACHE and bot/runtime-reader impacts.
5. Lock the RC6 canonical runtime-source registry, RC6 schema registry and dataset-state semantics once for all approved Runtime consumers.
6. Lock the RC6 cache manifest fields, logical snapshot partition and freshness/dependency classes against the governed contracts.
7. Only then begin functional code changes on the RC6 branch.

## Explicit non-actions during this audit

- no Mother_RC6 writes;
- no Runtime_RC6 writes;
- no `.env` Runtime target change;
- no production deployment;
- no production CACHE migration;
- no RC5 functional changes;
- no Product Score threshold invention;
- no legacy affiliate smoke data publication;
- no bot-specific bypass of Runtime_RC6 or independent schema authority.
