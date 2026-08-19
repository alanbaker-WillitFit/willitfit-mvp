# WillItFit RC6 — Contract Defects — 19 August 2026

## Purpose

This register records concrete contradictions discovered during the RC6 allowlist rebuild. Build code must not compensate for these defects by guessing or recreating governance rules locally.

## CD-001 — Airline rule sizing method/operator dropped from Runtime_RC6

**Status:** OPEN — BUILD BLOCKER FOR AIRLINE-RULE CONSUMPTION

### Observed Runtime_RC6 contract

`00.3_Build_Contract` marks `03_Airline Rules` as READY with 425 rows.

The current Runtime_RC6 `03_Airline Rules` projection exposes these headers:

- Rule ID
- Airline ID
- Fare
- Bag Type
- Length cm
- Width cm
- Depth cm
- Weight kg
- Linear Size cm
- Wheels Included
- Handles Included
- Fits Under Seat
- Soft Bag Guidance
- Rule Wording
- Source Reference
- Last Checked
- Review Status
- Publish
- Notes

It does **not** expose `Sizing Method` or `Limit Operator`.

### Upstream Mother_RC6 evidence

Mother_RC6 `03_Airline Rules` still contains governed fields including:

- `Sizing Method`
- `Limit Operator`
- `Entitlement Status`
- `Applicability Conditions`
- `Weight Basis`

Examples confirm the fields are materially required rather than decorative. Fixed-dimension records are governed as `fixed dimensions` / `lte`. Checked-baggage records include linear-total rules where the operator distinguishes strict limits such as `under 275 cm` / `less than 158 cm` from inclusive limits such as `must not exceed 158 cm`.

### Why this blocks the Build

The Build could infer an operator from `Rule Wording`, `Soft Bag Guidance`, `Notes`, or the presence/absence of fixed dimensions. That is rejected.

Doing so would move governance into application code, make wording changes capable of changing checker maths, and recreate the RC5 failure mode where the Build carried assumptions not represented by the Runtime contract.

RC6 rule consumption therefore remains fail-closed until Runtime_RC6 projects the governed sizing semantics explicitly.

### Required resolution

The governed Runtime projection for `03_Airline Rules` must expose, at minimum, the fields required to deterministically construct the Build sizing rule without prose inference:

- `Sizing Method`
- `Limit Operator`

Any additional governed applicability/weight semantics required by the final checker contract should be projected deliberately rather than inferred.

After projection correction:

1. re-read Runtime_RC6 headers and representative fixed/linear/weight cases;
2. update the RC6 schema registry;
3. implement the RC6 airline-rule mapper;
4. test fixed dimensions, `lt`, `lte`, weight-only/incomplete cases and publication gates;
5. reconcile representative Runtime rows against the pure RC6 fit engine;
6. only then wire the checker to Runtime rules.

### Explicit non-workaround

No RC6 production code may parse prose to derive `Sizing Method` or `Limit Operator` while CD-001 is open.
