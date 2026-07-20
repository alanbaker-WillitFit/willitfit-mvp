# WillItFit MVP RC2.45 — Functional Corrections

## Release-blocking corrections
- Stopped airline selection from writing the airline allowance into the traveller's measurement fields.
- Stopped bag-type changes from overwriting entered measurements.
- Changed airline, baggage-rule, and travel-tip status handling to fail closed: only explicit Live/Active/Approved/Published values publish.
- Changed fare-class bag allowances to nullable values instead of synthetic 0 × 0 × 0 dimensions.
- Changed conservative airline baselines to select one real published allowance record rather than combining minimum axes from different records.
- Added duplicate published airline ID and slug detection; conflicting records are withheld.
- Added HTTPS validation for airline source URLs.
- Added eight-second timeouts to Google OAuth and Sheets requests.

## Calculator and validation
- Preserved rotation-aware fit checking.
- Added deterministic tie-breaking for equally scored orientations.
- Consolidated dimension validation through one authoritative helper.
- Added regression coverage for exact fit, rotation, close fit, failure over 2 cm, three-digit input, fare selection, and incomplete fare fallback.

## SEO and maintenance
- Removed duplicated WillItFit branding from airline page metadata titles.
- Added complete Open Graph, Twitter, canonical, and robots metadata to Sheet-driven SEO pages.
- Added About, Contact, Products, and Sheet-driven SEO pages to the sitemap.
- Removed unused google-auth-library and google-spreadsheet dependencies.
- Added Vitest and 18 passing automated tests.

## Verification
- npm run type-check: passed.
- npm run lint: passed with no warnings or errors (Next reports its existing next lint deprecation notice).
- npm test: 18 tests passed.
- npm run build: passed.
- OpenNext Cloudflare build: completed the embedded Next.js build but did not return before the packaging environment timeout; local Wrangler/OpenNext dry-run remains required before deployment.
- Build verification used fallback data because deployment Google Sheets secrets are not available in the packaging environment.
