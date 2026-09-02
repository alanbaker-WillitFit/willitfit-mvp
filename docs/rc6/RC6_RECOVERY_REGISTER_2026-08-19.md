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
| RR-004 | WIFIT-BRAND-TICK-01 | 13 Aug checkpoint + verified Drive file | Approved master registered; exact binary transfer outstanding | RECOVER EXACTLY | Drive ID `1D3VP0nOFUXpXDpK0LWRuFmOY-IBaXKrK`; exact binary only; reserved path `public/assets/logo/willitfit-master-tick-logo.png`; mobile/desktop visual acceptance; asset regression |
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
| RR-019 | Size Guide aggregation UX | `rc5-size-guide-pilot` | Useful grouping/airline-linking concepts but direct legacy Travel Essentials dependency and fallback path | REUSE CONCEPT / REBUILD | Rebuild from RC6 Runtime contract; no legacy affiliate dependency; no uncontrolled fallback; verify SEO/image behaviour |
| RR-020 | Strict positive publication test | `rc5-cleanse-baseline` runtime-content logic | Better principle than permissive publication, but still includes legacy fallback/module aliases | REUSE PRINCIPLE / REBUILD | Require explicit governed publication state per RC6 dataset; no legacy status fallback unless contract explicitly permits |
| RR-021 | Cleanse schema allowlisting | `rc5-cleanse-baseline` | Earlier attempt at known-tab/header allowlisting but contains RC4/RC5 product flags and legacy affiliate schema | REUSE PRINCIPLE / REBUILD | RC6-only schema registry; reject unknown production datasets unless explicitly declared |
| RR-022 | Customer question submission endpoint | `rc5-cleanse-baseline` | External feed API exists in divergent evidence branch | EVIDENCE ONLY / REBUILD LATER | RC6 public Ask datasets are empty and historical submissions are private/test; no public activation until separate privacy/security/contract approval |

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
| `rc5-size-guide-pilot` | **DIVERGED: 14 unique commits** | RECOVERY CANDIDATE — concepts now classified; remaining routes/CSS/SEO still require review |
| `rc5-gate-rush-preparation-20260806` | **DIVERGED: 1 unique commit** | EVIDENCE ONLY — Gate Rush is held in RC6 |
| `rc5-cleanse-baseline` | **DIVERGED: 8 unique commits** | RECOVERY CANDIDATE — principles classified; remaining files still require review |

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

Review result so far:

- `services/sizeGuides.ts` contains useful grouping logic for fixed dimensions and checked-bag linear totals, airline linking and metric/imperial display. It also has fallback behaviour tied to the inherited airline service. **Do not import wholesale. Reuse concepts only.**
- `SizeGuidePage.tsx` has a useful progressive disclosure pattern and checker-return CTA, but imports the legacy `TravelEssentials` affiliate layer directly and reports local fallback as a valid source. **Do not import wholesale. Rebuild presentation against RC6 governed readers and empty-state rules.**

Remaining branch routes/CSS/header changes are still evidence pending inspection. R-022 must be solved by root cause, not by copying this branch blindly.

### Diverged branch: `rc5-gate-rush-preparation-20260806`

Unique files are Gate Rush static HTML routes. RC6 contract explicitly holds Gate Rush pending rebuild certification.

**Decision:** evidence only; no import during core RC6 assembly.

### Diverged branch: `rc5-cleanse-baseline`

Unique differences touch `.env.example`, RC5 certification, customer-question API, Ask UI, the approved Advanced/Oversized WebP, airline/runtime readers and the sheet schema registry.

Review result so far:

- Its `sheetSchemas.ts` demonstrates a useful allowlist principle but explicitly carries columns such as `WillItFit RC4`, `WillItFit RC5`, `WillItFly RC1` and the legacy `09_Affiliate_Placements` contract. **Principle retained, implementation rejected for RC6.**
- Its `runtimeContent.ts` improves publication semantics by requiring positive approval signals, but still contains legacy-status fallback and legacy module alias behaviour. **Reuse the positive-approval principle; rebuild the implementation dataset-by-dataset.**
- Its customer-question POST endpoint is operational evidence only. Because RC6 Ask Questions/Answers are schema-ready empty and previous submissions were excluded as private/test, **do not recover this endpoint into the public RC6 core without a separate governed privacy/security decision.**
- The Advanced/Oversized WebP in this branch remains subject to the exact governed asset authority rather than branch provenance.

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

## Release-quality principle

RC6 is quality-gated, not date-driven. There is no requirement to go live quickly. After build certification, RC6 must pass a full smoke campaign, real-data reconciliation, legacy-contamination certification, Draft/staging soak, and a separate explicit release approval before Public promotion.

Target release states:

`Built → Certified → Smoke Tested → Soak Tested → Release Candidate → Approved for Public → Live`

Certification does not imply deployment approval.

## Next recovery loop

1. Finish `rc5-size-guide-pilot` route/CSS/header review and determine whether any exact implementation deserves recovery.
2. Finish `rc5-cleanse-baseline` `.env`/airline/Ask UI/certification review.
3. Search remaining governing RC5 checkpoints/registers for unresolved fixes or approved assets not yet represented here.
4. Verify other exact governed asset identities required by RC6.
5. Produce the RC6 Clean Assembly Manifest from this register.
6. No functional RC6 implementation until the recovery/assembly manifest is reviewed and locked.
