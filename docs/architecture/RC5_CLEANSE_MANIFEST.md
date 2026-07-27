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

## Package audit

Package audit completed on 27 July 2026.

- No standalone historical ZIP, TAR, TGZ, GZ or 7Z package remains in active source.
- The only nested package identified was `willitfit-icons-deploy-now.zip`.
- That ZIP belongs to the locked icon engineering set and has therefore been retained with its related assets at `archive/engineering-assets/assets/I001 Icons/willitfit-icons-deploy-now.zip` rather than duplicated into `archive/packages/`.
- No additional move was required and no empty archive placeholder was created.

## Active script audit

Active script audit completed on 27 July 2026.

- Before separation, the tracked `scripts/` tree contained only the four local workbook/content-engine automation files.
- Those four files were moved unchanged to `archive/workbook-automation/content-automation/`.
- No tracked file remains under `scripts/`; empty directories are not retained by Git.
- Website commands `dev`, `build`, `preview`, `deploy`, `start`, `lint`, `type-check`, `test`, `verify`, `build:cloudflare` and `deploy:dry-run` invoke package binaries directly and do not depend on repository scripts.
- The three deliberate workbook commands remain available through updated `package.json` paths to the archive location.
- Classification result: build-critical repository scripts — none; operational website scripts — none; historical/local workbook automation — four, archived.

## Move register

| Status | Original path | New path | Notes |
|---|---|---|---|
| Complete | `RC2_*_CHANGELOG.md`, release status and build-verification records | `archive/releases/rc2/` | 24 files preserved as zero-content-change renames |
| Complete | `reports/` | `archive/evidence/reports/` | 21 evidence files preserved as zero-content-change renames |
| Complete | `artifacts/rc4/` | `archive/workbooks/rc4/` | Two workbook files preserved as zero-content-change renames |
| Complete | `runtime-export/` | `archive/runtime-exports/` | Eight snapshot files preserved as zero-content-change renames |
| Complete | `engineering-archive/` | `archive/engineering-assets/` | 14 engineering files preserved as zero-content-change renames |
| Complete — no further move | Nested ZIPs and historical packages | `archive/packages/` | Only icon deployment ZIP found; retained with the engineering asset set |
| Complete | `scripts/content-automation/` | `archive/workbook-automation/content-automation/` | Four files preserved as zero-content-change renames; npm command paths updated |
| Complete — no active files | Remaining `scripts/` tree | Not applicable | No build-critical or operational repository script remains |
