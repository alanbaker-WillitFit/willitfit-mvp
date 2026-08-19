# WillItFit RC6 — Phase 0 Lock — 19 August 2026

## Decision

Phase 0 — RC5 recovery audit, retained-dataset confirmation and clean-assembly planning — is **LOCKED FOR RC6 PHASE 1 IMPLEMENTATION**.

This lock does not certify the RC6 build and does not authorise deployment.

## Authorities

- Frozen RC5 evidence branch: `rc5-final-launch-prep-20260809`
- Frozen RC5 evidence SHA: `eea8a3fc662a4247e12ba8a5803b1f1dc91a2ad6`
- RC6 branch: `rc6-build-audit-20260819`
- Runtime authority: `Runtime_RC6`
- Dataset contract: `Runtime_RC6!00.3_Build_Contract`
- Exceptions: `Runtime_RC6!00.4_Contract_Exceptions`
- Recovery Register: `docs/rc6/RC6_RECOVERY_REGISTER_2026-08-19.md`
- Clean Assembly Manifest: `docs/rc6/RC6_CLEAN_ASSEMBLY_MANIFEST_2026-08-19.md`
- Retained Dataset Reader Matrix: `docs/rc6/RC6_RETAINED_DATASET_READER_MATRIX_2026-08-19.md`

## Locked implementation method

RC6 is an allowlist rebuild.

- recover approved binaries exactly;
- reuse proven logic only after dependency inspection;
- rebuild contract-facing code against Runtime_RC6;
- reject legacy aliases, stale factual fallbacks and legacy commercial authority;
- prove absence of legacy contamination before release;
- keep RC5 unchanged as evidence;
- keep production Runtime/cutover unchanged until explicit release approval.

## Phase 1 first slice

The first RC6 foundation slice consists only of:

- canonical Runtime_RC6 dataset registry;
- dataset-state semantics;
- cache-class/freshness policy;
- authoritative-empty semantics;
- RC6 contract tests;
- isolated RC6 certification workflow.

No user-facing route, production Runtime target, Mother data, deployment target or commercial activation is changed by this slice.

## Release principle

RC6 remains quality-gated, not date-driven:

`Built → Certified → Smoke Tested → Soak Tested → Release Candidate → Approved for Public → Live`
