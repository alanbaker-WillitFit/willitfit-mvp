# RC2.51 — Airline Content Expansion

- Added airline notes from `01_Airlines.Notes` to the public airline-page payload.
- Added a reusable “Before you fly” guidance module using airline notes, fare structure and contextual travel tips.
- Expanded airline FAQs to cover fare-dependent allowances and full-bag measurement, including wheels and handles.
- Prevented duplicate guidance cards.
- Added regression tests for airline guidance assembly.
- Updated package version to 2.51.0.

## Data principle

Google Sheets remains the source of truth. RC2.51 does not hardcode new live airlines. Emirates, Etihad and other airlines should be added through `01_Airlines` and `02_Baggage_Rules`, then validated through the existing diagnostics and publication safeguards.
