# RC2.59 Delta Certification Changelog

Date: 19 July 2026

## Canonical Mother

- Paired workbook: `WillItFit_Content_Engine_RC15.3_Canonical_Production_Mother.xlsx`
- SHA-256: `7A36CFDA84AFF259B10992351A010B07D26EDF1E71EC5C1CDCC87078C7934A09`
- Tabs 73–81 retain the supplied Pass5 Question Engine contract.
- Tabs 82–84 supply the commercial runtime contract consumed by the Build.
- `09_Affiliate_Products.Product_ID` is aligned to the packaged runtime IDs `PRD-001`–`PRD-005`.

## Minimum Build Corrections

- Disabled the unimplemented newsletter by removing both public render locations and the now-unreferenced component.
- Made the npm lockfile portable by replacing private registry prefixes only; package versions and integrity hashes are unchanged.
- Made Vitest configuration ESM-safe and selected its runner config loader for Windows/sandbox portability.
- Corrected Question Engine unknown-fallback activation so its governed priority adjustment is applied.
- Updated Mother provenance in RC2.59 verification and runtime-export evidence.

## Certification Results

- `npm ci`: PASS (exact lock, 685 packages)
- `npm run type-check`: PASS
- `npm run lint`: PASS (no warnings or errors; Next lint deprecation notice only)
- `npm test`: PASS (12 files, 71 tests)
- `npm run build`: PASS (31 static pages generated; 102 kB shared first-load JS)
- Canonical content validation: PASS (0 blockers, 0 warnings)
- Build/Mother alignment: PASS (36 checks)
- `npm run build:cloudflare`: ENVIRONMENT BLOCKED before compilation because OpenNext's Windows esbuild loader attempts drive-root enumeration denied by the certification sandbox. OpenNext recommends WSL; no WSL distribution is installed.

No deployment was performed.
