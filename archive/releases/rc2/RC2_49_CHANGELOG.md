# RC2.49 — Data Governance and Diagnostics

- Added per-sheet runtime diagnostics: fresh, cached, empty, or failed.
- Records row counts, fetch timestamps, and safe error messages without exposing credentials.
- Added non-indexed `/diagnostics` route.
- Added cache/diagnostic reset helper for tests and operational checks.
- Added diagnostics regression coverage.
- Preserves all RC2.48 airline-engine and earlier checker/data reliability fixes.
