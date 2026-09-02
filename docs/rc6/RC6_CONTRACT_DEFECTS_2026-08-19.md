# WillItFit RC6 — Contract Defects — 19 August 2026

## Purpose

This register records concrete contradictions discovered during the RC6 allowlist rebuild. Build code must not compensate for these defects by guessing or recreating governance rules locally.

## CD-001 — Airline rule sizing method/operator dropped from Runtime_RC6

**Status:** CLOSED — SOURCE + PROJECTION + BUILD CONTRACT REPAIRED 2026-08-19

### Original defect

`00.3_Build_Contract` marked `03_Airline Rules` as READY with 425 rows, but Runtime_RC6 originally omitted the governed `Sizing Method` and `Limit Operator` fields that remained present in Mother_RC6.

Without those fields, the Build could only distinguish fixed-dimension, linear-total and strict/inclusive limits by parsing prose or reconstructing governance from the numeric columns. That workaround was rejected.

### Source repair

A full Mother_RC6 audit found six published Virgin Atlantic rows with malformed/misaligned sizing semantics:

- `VA-PER-20260721-041`
- `VA-CAB-20260721-041`
- `VA-PER-20260721-042`
- `VA-CAB-20260721-042`
- `VA-PER-20260721-043`
- `VA-CAB-20260721-043`

All six were corrected at source to:

- `Sizing Method = fixed dimensions`
- `Limit Operator = lte`

The remaining malformed-looking upstream rows were unpublished/fail-closed and were not promoted into the published contract.

### Runtime projection repair

Runtime_RC6 `03_Airline Rules` now projects `Sizing Method` and `Limit Operator` for all 425 published rules as stored values.

The repaired published contract resolves to:

- 275 fixed-dimension rules;
- 150 linear-total rules;
- 0 published weight-only rules;
- 0 published rules with unresolved sizing semantics.

Exactly five governed rules use the strict `<` (`lt`) operator:

- `EZY-CHK-20260801-001`
- `EZY-CHK-20260801-002`
- `EZY-CHK-20260801-003`
- `MAS-CHK-20260801-001`
- `MAS-CHK-20260801-002`

All other published rules use `lte`.

The Runtime Build Contract and Runtime Certification notes were updated to state that both governed fields are mandatory in future projections.

### Build contract repair

The RC6 schema registry now requires both `Sizing Method` and `Limit Operator` for `03_Airline Rules`.

The temporary airline-rule consumption block has been removed. The canonical Runtime reader may now consume the dataset only when the full RC6 schema is present.

Regression coverage now proves:

1. the canonical `03_Airline Rules` tab can be consumed when the governed fields are present;
2. a future projection that drops either governed field fails closed at schema validation;
3. no prose inference is required or permitted.

### Continuing rule

`Sizing Method` and `Limit Operator` are part of the RC6 Runtime contract, not optional implementation hints. Any future Mother → Runtime publication path must preserve them explicitly.

No RC6 production code may derive these semantics from `Rule Wording`, `Soft Bag Guidance`, `Notes`, or numeric-column heuristics as a substitute for the governed fields.

### Next implementation step

Build the RC6 airline-rule mapper against the repaired Runtime contract, then test fixed dimensions, `lt`, `lte`, publication gates, completeness/uniqueness and representative Runtime-to-fit-engine reconciliation before wiring the checker UI.
