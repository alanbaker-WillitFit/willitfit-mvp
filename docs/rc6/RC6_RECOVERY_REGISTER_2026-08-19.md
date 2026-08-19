# WillItFit RC6 — Recovery Register — 19 August 2026

## Purpose

RC6 is an allowlist rebuild. Nothing enters RC6 merely because it existed in RC5 or an earlier release. Every recovered item must have positive evidence, an explicit treatment decision, and a verification requirement.

Allowed treatments:

- `RECOVER EXACTLY` — approved binary/asset/content that must be transferred without alteration.
- `REUSE LOGIC` — proven implementation logic worth carrying into a clean RC6 structure.
- `REBUILD` — requirement remains but existing implementation is not accepted as RC6 architecture.
- `REPLACE` — superseded by a new governed RC6 architecture.
- `REJECT` — legacy or unsafe implementation that must not enter RC6.
- `EVIDENCE ONLY` — retain for comparison/history; do not automatically import.

## Frozen authorities

- RC5 evidence branch: `rc5-final-launch-prep-20260809`
- Frozen RC5 evidence SHA: `eea8a3fc662a4247e12ba8a5803b1f1dc91a2ad6`
- RC6 audit/build branch: `rc6-build-audit-20260819`
- Mother authority: `Mother_RC6`
- Build Runtime authority: `Runtime_RC6`
- Build contract authority: `WillItFit RC6 — Build Contract Pack`

No RC5 branch is to be modified as part of RC6. Historical branches are evidence/recovery sources only.

## Governing checkpoint carry-forward findings

| ID | Area | Evidence / authority | RC5 state | RC6 treatment | Verification before import |
|---|---|---|---|---|---|
| RR-001 | Core fit calculation / dimensions | Frozen RC5 code + prior certification history | Proven core behaviour | REUSE LOGIC | Extract dependencies; prove no legacy Runtime/tab assumptions; full fit regression |
| RR-002 | Result UX / BagVisualizer | Frozen RC5 code | Mature result presentation | REUSE LOGIC | Visual + accessibility + fit-state regression |
| RR-003 | Google Sheets auth/read mechanics | Frozen RC5 `services/googleSheets.ts` | Read-only, schema-aware, retry/LKG mechanics | REUSE LOGIC | Rebuild behind RC6 dataset/cache contract; no direct Mother reads |
| RR-004 | WIFIT-BRAND-TICK-01 | 13 Aug checkpoint; Drive master `willitfit-master-tick-logo.png` | Approved master registered; exact binary transfer outstanding | RECOVER EXACTLY | Exact binary only; reserved path `public/assets/logo/willitfit-master-tick-logo.png`; mobile/desktop visual acceptance; asset regression |
| RR-005 | Advanced/Oversized hero asset | 13 Aug checkpoint; historical asset branch | Approved WebP recovered into RC5 path | RECOVER EXACTLY | Verify exact governed binary/path; do not redraw or substitute |
| RR-006 | Oversized Size Guides listing image defect R-022 | 13 Aug checkpoint | Open low-severity listing-only rendering defect | REBUILD/FIX IN RC6 | Root-cause test Next/Image/card sizing/static packaging/cache; clean-session visual verification |
| RR-007 | FAQ / People often ask user labelling | 13 Aug checkpoint + frozen RC5 | Partially implemented; consistency review outstanding | REBUILD/VERIFY | Header/nav, `/ask`, homepage, sitemap/SEO, accessibility wording |
| RR-008 | FAQ/Tips governance separation | 13 Aug checkpoint + RC5 extensibility doc | Explicitly locked separate datasets | REUSE GOVERNING RULE | `05_FAQs` and `06_Tips` remain separate; empty states have no filler |
| RR-009 | Special Baggage | RC6 Build Contract Pack | RC5 exact-14 implementation stale | REBUILD | Runtime-governed 21-result contract; remove hardcoded 14 from service/UI/tests/config |
| RR-010 | Legacy affiliate/recommendation machinery | Frozen RC5 | Legacy 09/82/83/84 model, merchant-priority logic | REJECT | Prohibited from RC6 runtime/commercial authority |
| RR-011 | Product Intelligence | RC6 PI contract + Runtime_RC6 | New RC6 contract; most datasets empty by design | REBUILD/NEW | Shared dataset registry, fail-closed empty states, no invented scoring thresholds |
| RR-012 | CACHE | RC6 audit decision | Existing RC5 in-memory cache not sufficient as RC6 cache architecture | REBUILD/NEW | Shared manifest, L1/L2, authoritative-empty, freshness classes, hard-stale rules |
| RR-013 | Bot/runtime-reader contract | RC6 audit decision | Separate implementation would risk drift | REBUILD/NEW SHARED LAYER | Same runtime registry/schema/publication/freshness semantics as website |
| RR-014 | RC5 certification workflow | Frozen RC5 workflow | Useful pattern, RC5-specific branches/contracts | REUSE PATTERN / REBUILD | RC6-specific workflow plus contamination/cache/runtime/smoke gates |
| RR-015 | Legacy synthetic affiliate placeholders | Frozen RC5 | Missing products represented by active/published placeholders | REJECT | Authoritative empty must remain empty |
| RR-016 | Travel Notifications / Ask empty schemas | RC6 Build Contract Pack | Historical private/test rows excluded | REBUILD FAIL-CLOSED | Schema-valid zero rows must not trigger legacy fallback or public exposure |
| RR-017 | Gate Rush | RC6 Build Contract exception | Held pending rebuild certification | EVIDENCE ONLY / HOLD | Do not activate until separately rebuilt/certified |
| RR-018 | Runtime schema/source registry | Frozen RC5 mixed registry | Contains legacy/mixed contracts | REBUILD | RC6-only canonical dataset registry generated from approved contract |

## Historical RC5 branch recovery audit

The branch inventory from the 13 August checkpoint has been rechecked against frozen RC5. Branch comparison is used only to identify unabsorbed evidence; divergence does not mean code is approved for import.

| Branch | Comparison to frozen RC5 | Recovery status |
|---|---|---|
| `rc5-advanced-oversized-asset-fix` | Behind; 0 unique commits | Integrated history; asset still separately governed by exact-binary rule |
| `rc5-checked-linear-size` | Behind; 0 unique commits | Integrated history; reuse only via frozen RC5/core regression evidence |
| `rc5-build-sprint` | Behind; 0 unique commits | Integrated history |
| `rc5-integration-20260804` | Behind; 0 unique commits | Integrated history |
| `rc5-smoke-remediation-20260805` | Behind; 0 unique commits | Integrated history |
| `rc5-publisher-implementation` | Behind; 0 unique commits | Integrated history; publisher remains outside website build authority |
| `rc5-stage-1-articles` | Behind; 0 unique commits | Integrated history |
| `rc5-lab-willitfly-gate-rush` | Behind; 0 unique commits | Integrated history; RC6 Gate Rush still held by explicit exception |
| `rc5-size-guide-pilot` | **DIVERGED: 14 unique commits** | RECOVERY CANDIDATE — requires file-by-file review before RC6 decision |
| `rc5-gate-rush-preparation-20260806` | **DIVERGED: 1 unique commit** | EVIDENCE ONLY — Gate Rush is held in RC6 |
| `rc5-cleanse-baseline` | **DIVERGED: 8 unique commits** | RECOVERY CANDIDATE — inspect differences individually; no bulk import |

### Diverged branch: `rc5-size-guide-pilot`

Unique branch differences include:

- `app/size-guides/page.tsx`
- `app/size-guides/cabin-bag/page.tsx`
- `app/size-guides/checked-bag/page.tsx`
- `app/size-guides/personal-item/page.tsx`
- `components/size-guides/SizeGuidePage.tsx`
- `components/size-guides/SizeGuidePage.module.css`
- `services/sizeGuides.ts`
- `components/Header.tsx` changes

**Decision:** do not copy wholesale. Audit routes, data source, SEO behaviour, image handling and dependency graph against Runtime_RC6 and R-022. Recover only what passes RC6 architecture review.

### Diverged branch: `rc5-gate-rush-preparation-20260806`

Unique files are Gate Rush static HTML routes. RC6 contract explicitly holds Gate Rush pending rebuild certification.

**Decision:** evidence only; no import during core RC6 assembly.

### Diverged branch: `rc5-cleanse-baseline`

Unique differences touch `.env.example`, RC5 certification, customer-question API, Ask UI, the approved Advanced/Oversized WebP, airline/runtime readers and the sheet schema registry.

**Decision:** inspect individually. The binary asset may be recovered only via its governed asset authority. Reader/schema changes are not accepted by branch provenance alone and must be judged against RC6 contracts. Private/test Ask data must remain excluded.

## Known RC5 risk controls that become RC6 certification requirements

The 13 August checkpoint preserves these controls and they must not disappear in the rebuild:

- Mother/Runtime schema drift detection;
- publisher mapping mismatch detection;
- wrong spreadsheet configuration protection;
- service-account access failure behaviour;
- required page/dataset missing behaviour;
- three-digit oversize input regression;
- Travel Tips Runtime contract validation;
- SEO route/metadata regression;
- diagnostics exposure controls;
- duplicate-ID/orphan-relationship controls;
- post-publication baggage-data governance through Cockpit;
- Size Guides listing image regression for Oversized Baggage.

## Legacy contamination rule

RC6 certification will include explicit scans for prohibited legacy references. At minimum inspect for:

- RC2 / RC3 / RC4 / RC5 production contracts outside approved documentation/migration evidence;
- old spreadsheet IDs;
- old Runtime tab aliases;
- legacy affiliate tabs including `09_Affiliate_Placements`, `82_Affiliate_Intent_Map`, `83_Affiliate_Rules`, `84_Recommendation_Cards`;
- old hardcoded Special Baggage count `14` where it represents the obsolete contract;
- synthetic commercial placeholders/fallbacks;
- obsolete asset paths;
- archived code reachable by production build;
- stale feature flags or deployment targets.

Absence must be proved, not assumed.

## Next recovery loop

1. Inspect `rc5-size-guide-pilot` file-by-file and classify each item.
2. Inspect `rc5-cleanse-baseline` unique differences file-by-file.
3. Search remaining governing RC5 checkpoints/registers for unresolved fixes or approved assets not yet represented here.
4. Verify the exact Drive location/identity of WIFIT-BRAND-TICK-01 without modifying it.
5. Produce the RC6 Clean Assembly Manifest from this register.
6. No functional RC6 implementation until the recovery/assembly manifest is reviewed and locked.
