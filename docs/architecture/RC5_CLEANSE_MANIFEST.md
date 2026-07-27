# WillItFit RC5 Cleanse Manifest

## Status

ACTIVE — governing manifest for the `rc5-cleanse-baseline` branch.

## Baseline

- Repository: `alanbaker-WillitFit/willitfit-mvp`
- Branch: `rc5-cleanse-baseline`
- Verified RC4 parent commit: `f0e83e5ec4b0d4116d767aa8a68c40cdbfa631f1`
- Parent commit message: `Fix Google Sheets range handling for named tabs`

## Locked rules

1. `main` and the certified RC4 release remain untouched.
2. No project file is discarded during the cleanse.
3. Material removed from active source is moved into a named archive destination.
4. Application behaviour, routes, visual output, runtime configuration and deployment settings remain unchanged during cleanse pass 1.
5. Every move must be recorded with its original path and archive destination.
6. New features are prohibited until the clean RC5 baseline passes equivalence checks.

## Active source structure

```text
app/
components/
data/
  fallback/
hooks/
lib/
public/
  assets/
  lab/
services/
styles/
tests/
tokens/
types/
scripts/
  build/
  content/
docs/
  architecture/
  runbooks/
  releases/
```

## Archive structure

```text
archive/
  releases/
  evidence/
  workbooks/
  runtime-exports/
  engineering-assets/
  packages/
  workbook-automation/
```

## Planned archive moves

| Source | Destination | Reason |
|---|---|---|
| Root RC2 changelog and verification series | `archive/releases/rc2/` | Historical release evidence |
| RC4 release evidence not required by active runtime | `archive/releases/rc4/` | Immutable release record |
| `reports/` | `archive/evidence/reports/` | Screenshots and generated verification evidence |
| `artifacts/` | `archive/workbooks/` | Generated workbook artefacts |
| `runtime-export/` | `archive/runtime-exports/` | Runtime CSV/JSON snapshots |
| `engineering-archive/` | `archive/engineering-assets/` | Source masters, previews and rejected variants |
| Nested ZIPs and historical packages | `archive/packages/` | Packaged historical material |
| Workbook generation scripts | `archive/workbook-automation/` | Not part of the website runtime build |

## Cleanse sequence

1. Record baseline and archive structure.
2. Move historical release files from the root.
3. Move evidence, generated workbooks, runtime exports and engineering assets.
4. Separate active build and content scripts.
5. Centralise runtime aliases and fallback ownership without behaviour change.
6. Audit production assets from actual code references.
7. Run install, type-check, lint, tests, Next.js build, Cloudflare build and deployment dry-run.
8. Compare routes, screenshots, metadata, HTML and Lab behaviour with RC4.
9. Certify and tag the clean RC5 baseline before feature work.

## Move register

The move register will be extended as each controlled archive move is completed.

| Status | Original path | New path | Notes |
|---|---|---|---|
| Planned | `RC2_*_CHANGELOG.md` and `RC2_*_BUILD_VERIFICATION.md` | `archive/releases/rc2/` | Preserve full contents and Git history |
| Planned | `reports/` | `archive/evidence/reports/` | No evidence deletion |
| Planned | `artifacts/` | `archive/workbooks/` | No workbook deletion |
| Planned | `runtime-export/` | `archive/runtime-exports/` | No export deletion |
| Planned | `engineering-archive/` | `archive/engineering-assets/` | No asset deletion |
