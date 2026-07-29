# RC2.50 Stability Release

## Added

- Required-column schemas for all operational Google Sheet tabs.
- Fail-closed validation for missing or duplicate Sheet headers.
- Diagnostics fields for schema validity, missing columns, and duplicate columns.
- Five regression tests for Sheet schema validation.
- `npm run verify` consolidated release check.
- Cloudflare build and dry-run scripts.
- Environment, deployment, airline-data, and key-user testing run books.

## Changed

- Package version set to `2.50.0`.
- Diagnostics now reports safe validation summaries without exposing credentials.
- README updated to describe direct Google REST OAuth rather than removed libraries.

## Release rule

RC2.50 is a production-candidate baseline only after live Google Sheets access, OpenNext packaging, Wrangler dry-run, and post-deployment checks have been completed on the deployment machine.
