# WillItFit RC6 — Retained Dataset Reader Matrix — 19 August 2026

## Status

**PHASE 0 RECOVERY / CONTRACT AUDIT — COMPLETE FOR RETAINED DATASETS**

This matrix resolves the Runtime_RC6 datasets marked `RETAINED_REQUIRES_BUILD_CONFIRMATION` in `00.3_Build_Contract`.

Authority order:

1. `Runtime_RC6!00.3_Build_Contract`
2. `Runtime_RC6!00.4_Contract_Exceptions`
3. RC6 Build Contract Pack
4. this reader matrix
5. frozen RC5 code only as implementation evidence

RC5 is not an RC6 data authority.

## Decisions

| Runtime dataset | Current RC6 state | RC5 reader evidence | RC6 decision | CACHE class | Build treatment |
|---|---:|---|---|---|---|
| `01_Settings` | 11 rows | No dedicated `services/settings.ts` | **NEW SELECTIVE READER** | A — Core/Stable | Read only explicitly governed control fields required by Build. Do not treat the mixed validation lists as generic frontend configuration. Unknown controls fail closed. |
| `04_Special Baggage All` | 24 rows | No dedicated reader; RC5 `services/specialBaggage.ts` reads Results only | **NEW REFERENCE READER** | A/B — Stable + dependency driven | Treat as governed special-baggage source/reference catalogue. It must not replace `04.1_Special Baggage Results` as the user-facing result contract. Source rows may inform discovery/linkage only where the RC6 contract explicitly requires them. |
| `07.1_Navigation` | 1 row | `services/navigation.ts` exists | **REUSE PRINCIPLE / REBUILD RC6 READER** | A — Core/Stable | Canonical tab only. Current row is WillItFly, `Active=No`, `Publish=Yes`; Build must suppress it because inactive. No `Navigation` alias. Desktop/mobile consume one shared result. |
| `08_SEO Pages` | 15 rows | `services/seoPages.ts` exists | **REUSE PRINCIPLE / REBUILD RC6 READER** | A — Content/Stable | Current 15 rows are `Review Status=Draft`, `Publish=No`; therefore zero are public today. Preserve canonical/slug validation and duplicate rejection. Do not turn retained rows into public pages merely because they exist. |
| `09_Affiliate_Placements` | 0 rows | Legacy affiliate reader/aliases exist elsewhere in RC5 | **REJECT AS RC6 COMMERCIAL AUTHORITY** | none | Header-only compatibility dataset. Authoritative empty. Never fall through to RC5 smoke rows or legacy affiliate code. RC6 uses Product Intelligence datasets only. |
| `11_Countries_Base` | 133 rows | No dedicated `services/countries.ts` on frozen RC5 | **REFERENCE ONLY / NEW READER IF CONSUMED** | A — Reference/Stable | Shared reference dataset. Rows contain WillItFly page/meta copy and are not WillItFit route authority. Do not generate WillItFit country pages from this dataset. Only add a reader when an approved WillItFit feature has a concrete need. |
| `11.1_Country_Travel_Facts` | 132 rows | No dedicated frozen-RC5 reader found | **REFERENCE ONLY / NEW READER IF CONSUMED** | A/B — Reference/Dependency | Shared travel-reference facts, not current WillItFit core product authority. No automatic route or factual UI generation. If consumed later, use Runtime only and apply governed freshness/source requirements. |
| `15_Redirects` | 0 rows | No dedicated `services/redirects.ts` | **NEW EMPTY-CONTRACT SUPPORT; NO ACTIVE REDIRECTS** | A — Core/Stable | Cache authoritative empty. Do not import redirects from legacy code or configuration. Future rows require explicit active/review/publication validation before routing behaviour changes. |

## Supporting observations

### Settings

`01_Settings` is not a simple key/value table. It combines allowed values/reference lists with control fields. The current actual control values include `willitfly_nav_enabled=No` and an empty `willitfly_nav_url`.

RC6 therefore must not deserialize the entire table into a permissive global settings object. A selective allowlist is required.

### Navigation

Frozen RC5 `services/navigation.ts` demonstrates useful mapping/sorting behaviour but carries a fallback alias `Navigation`. RC6 rejects that alias. The current Runtime row is intentionally inactive, so WillItFly must remain hidden even though `Publish=Yes`.

### SEO

Frozen RC5 `services/seoPages.ts` has useful duplicate-slug rejection and required-field checks. RC6 keeps those principles but uses canonical `08_SEO Pages` only. Current retained rows are Draft and unpublished, so their valid current public projection is **empty**.

### Special Baggage

Frozen RC5 `services/specialBaggage.ts` hardcodes 14 category IDs and SBR001–SBR014. That implementation is rejected. RC6 `04.1_Special Baggage Results` is the user-facing **21-result** contract. `04_Special Baggage All` is a separate 24-row reference/source catalogue and must remain conceptually distinct.

### Countries / Country Facts

The retained country datasets are shared reference material and visibly contain WillItFly-oriented page titles/meta descriptions. Their presence in Runtime_RC6 does not authorize WillItFit country routes. They remain dormant reference datasets unless an RC6 WillItFit requirement explicitly consumes them.

### Redirects

The Runtime tab is header-only. Zero rows is authoritative truth and must be cached as zero rows. A missing redirect must not trigger a legacy fallback.

## Canonical RC6 reader rule

Every active RC6 reader must use exactly one canonical Runtime dataset key unless the RC6 Build Contract explicitly defines an alias. RC5 backward-compatibility aliases are not inherited.

A Runtime result has four semantically different outcomes:

1. `READY_WITH_ROWS`
2. `AUTHORITATIVE_EMPTY`
3. `HELD_OR_NOT_PUBLIC`
4. `READ_OR_SCHEMA_FAILURE`

Only outcome 4 is a technical failure. Outcome 2 must never be treated as a cache miss or permission to use legacy/local factual fallback data.

## Phase 0 gate

The retained-dataset reader audit is now sufficiently resolved to lock the RC6 Clean Assembly Manifest for implementation planning.

No production/runtime cutover is authorised by this matrix.
