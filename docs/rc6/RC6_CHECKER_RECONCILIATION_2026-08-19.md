# WillItFit RC6 — Checker Reconciliation & Cutover Gate — 19 August 2026

## Purpose

This note records the post-CD-001 checker reconciliation position and the gate that must be satisfied before the public checker is switched from the frozen RC5 data path to the RC6 Runtime path.

## Authority

- Mother_RC6 governs source truth.
- Runtime_RC6 is the Build-facing published authority.
- The Build must not read Mother directly.
- `03_Airline Rules` is expected to expose 425 governed published rules.
- `Sizing Method` and `Limit Operator` are mandatory RC6 Runtime fields.
- Prose must never be parsed to reconstruct either sizing field.

## Current RC6 implementation path

1. `services/rc6/runtimeReader.ts`
   - applies RC6 dataset state and schema semantics;
   - treats authoritative empty as truth;
   - fails closed on read/schema failure.
2. `services/rc6/airlineRules.ts`
   - maps only governed fields;
   - requires the complete 425-rule catalogue;
   - rejects duplicate Rule IDs and inconsistent sizing semantics.
3. `services/rc6/checker.ts`
   - owns airline/bag/fare rule selection;
   - never constructs a synthetic hybrid allowance;
   - requires a fare when no single real published rule is demonstrably no more permissive than every alternative.
4. `services/rc6/fitEngine.ts`
   - performs pure deterministic fit assessment.

## Representative Runtime reconciliation

The following rows were re-read directly from Runtime_RC6 after CD-001 repair.

### Fixed dimensions — Jet2 cabin

Rule: `JET2-CAB-20260721-002`

- Airline: JET2
- Fare: `Economy | All fares / flight-only`
- Bag type: Cabin
- Dimensions: 56 × 45 × 25 cm
- Weight: 10 kg
- Sizing Method: `fixed dimensions`
- Limit Operator: `lte`
- Review Status: Approved
- Publish: Yes

Expected checker behavior:

- 56 × 45 × 25 cm at 10 kg → fits.
- any orientation that fits the governed dimensions may be used.
- weight above 10 kg → no-fit regardless of dimensional fit.

### Strict linear total — easyJet checked

Rule: `EZY-CHK-20260801-001`

- Airline: EZY
- Fare: `Purchased 15kg Hold Bag`
- Bag type: Checked
- Weight: 15 kg
- Linear Size: 275 cm
- Sizing Method: `linear total`
- Limit Operator: `lt`
- Review Status: Approved
- Publish: Yes

Expected checker behavior:

- entered linear total 274.9 cm at or below 15 kg → passes the dimensional rule.
- entered linear total exactly 275.0 cm → no-fit because the governed operator is strict `<`.
- no prose interpretation is involved.

### Inclusive linear total — KLM checked

Rule: `KLM-CHK-20260801-001`

- Airline: KLM
- Fare: `Economy | Standard`
- Bag type: Checked
- Weight: 23 kg
- Linear Size: 158 cm
- Sizing Method: `linear total`
- Limit Operator: `lte`
- Review Status: Approved
- Publish: Yes

Expected checker behavior:

- entered linear total exactly 158.0 cm at or below 23 kg passes the governed `<=` rule.
- under the existing RC6 close-fit presentation threshold, an exact-boundary passing linear rule is classified `close`, not `no-fit`.
- entered weight above 23 kg → no-fit regardless of dimensional result.

## No-fare selection rule

RC5 could create a baseline by independently selecting minimum dimensions and minimum weight from multiple fare rows. RC6 must not do this because it can create a combination that does not correspond to any published fare.

RC6 therefore uses this rule:

> If one actual published rule is no more permissive than every alternative for the selected airline and bag type, that real rule may be used as the no-fare baseline. Otherwise the checker requires the user to select a fare.

For fixed dimensions, comparison is orientation-independent by comparing the three sorted dimension extents. Weight restrictions are included in the dominance comparison. Linear-total rules compare the governed limit and operator. Different sizing methods are not merged.

## Cutover gate

Do not wire `app/page.tsx` or `components/DimensionForm.tsx` to RC6 until all of the following are true:

1. The RC6 Runtime target is provided to the application through an explicitly approved Draft configuration; the current public `.env` target remains untouched before that gate.
2. The RC6 Runtime reader can read 114 airlines and all 425 airline rules through the application execution environment.
3. RC6 schema validation sees `Sizing Method` and `Limit Operator` as mandatory.
4. Representative fixed, strict-linear and inclusive-linear rows reconcile with the pure RC6 fit engine.
5. The no-fare selection behavior is accepted for airlines whose fare rules are not safely dominated by one real published rule.
6. RC6 tests and build pass through the RC6 certification workflow.
7. No RC5 branch, public Runtime, or production deployment is changed as part of the Draft cutover test.

## CI evidence status

The RC6 certification workflow has been updated to validate the RC6 projection contract before type-check, lint, tests and build. At the time of this note, the connected GitHub status interface has not returned a workflow run/status for the latest branch commits. Therefore the implementation is not described as certified until execution evidence is available.

## Next safe implementation slice

After the cutover gate is satisfied:

1. provide an RC6-specific Runtime reader binding in Draft;
2. build the RC6 checker view-model/selector adapter from `Rc6AirlineIdentity` + `Rc6AirlineRule`;
3. update the checker UI to use RC6 bag/fare availability and `assessRc6Checker`;
4. preserve the existing approved result presentation while translating the RC6 assessment into the view model;
5. run local/CI certification;
6. verify Draft behavior against representative Runtime rows;
7. only then consider Public promotion.
