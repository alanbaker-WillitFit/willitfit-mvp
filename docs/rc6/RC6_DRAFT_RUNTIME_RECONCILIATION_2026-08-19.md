# RC6 Draft Runtime Reconciliation — 2026-08-19

## Purpose

Define the mandatory evidence gate before any RC6 checker UI is allowed to consume Runtime_RC6.

## Authority

Mother_RC6 → governed projection → Runtime_RC6 → isolated RC6 Draft reader → checker catalogue → UI.

The RC6 Draft reader must use `RC6_RUNTIME_SPREADSHEET_ID` only. It must not fall back to `GOOGLE_SHEETS_SPREADSHEET_ID`.

## Required catalogue evidence

A Draft Runtime read is acceptable only when all of the following are true:

- `02_Airlines` maps to exactly 114 published, approved and active airline identities.
- Airline IDs, route slugs and IATA codes are unique.
- Every airline has valid HTTPS website and baggage source URLs.
- `03_Airline Rules` maps to exactly 425 published approved rules.
- Every rule references one of the 114 governed airline IDs.
- `Sizing Method` and `Limit Operator` survive the Runtime projection.
- Representative fixed-dimension, strict-linear and inclusive-linear rules reconcile against the governed Runtime values.

## Representative rules

- Jet2 cabin rule: fixed dimensions, 56 × 45 × 25 cm, 10 kg.
- easyJet checked rule `EZY-CHK-20260801-001`: linear total 275 cm, operator `lt`, 15 kg.
- KLM checked rule `KLM-CHK-20260801-001`: linear total 158 cm, operator `lte`, 23 kg.

No wording/prose inference is permitted.

## Fail-closed states

The Draft checker catalogue must return unavailable/null rather than partially serve when:

- the RC6 Runtime ID is absent;
- either canonical tab is unreadable;
- either schema is malformed;
- airline count is not exactly 114;
- rule count is not exactly 425;
- duplicate airline identity/IATA data exists;
- orphan rules exist;
- publication gates remove a governed row;
- sizing semantics are invalid.

## Promotion rule

A green code certification alone does not authorize checker UI cutover. UI integration may begin only after the isolated Draft reader has positively reconciled the Runtime_RC6 catalogue under this contract.

No production Runtime target, public deployment or `.env` production value is changed by this gate.
