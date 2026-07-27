# RC2.55 Content Automation — Rebuilt Safe Package

Base: RC2.54 Launch Hardening (verified complete archive).

Recovered RC2.55 UI/app files were byte-for-byte identical to RC2.54. The missing RC2.55 automation layer has been rebuilt as local-only commands:

- `npm run validate-build-content`
- `npm run check-airline-policies`
- `npm run export-runtime`

Safety controls:

- No command writes to Google Sheets.
- No command changes workbook master data.
- No command promotes Draft to Live.
- No command deploys or publishes.
- Runtime export includes only exact `Status = Live` rows and must be uploaded manually.

Required local variable:

`CONTENT_ENGINE_WORKBOOK=/absolute/path/to/workbook.xlsx`
