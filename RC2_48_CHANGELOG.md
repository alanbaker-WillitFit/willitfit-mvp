# RC2.48 — Airline Engine

## Added
- Reusable airline-page data service.
- Fare/option allowance comparison table using structured fare-class data.
- Related-airline selection and internal navigation.
- Explicit Sheet versus fallback data status on airline pages.
- WebPage structured data for canonical airline pages.
- `@graph` structured-data output for airline pages.
- Regression tests for related-airline selection.

## Changed
- Airline page content is assembled from one cached page payload.
- Airline pages retain canonical short URLs such as `/ryanair`.
- Legacy `/airlines/[slug]` URLs continue to permanently redirect.
- Official-source links render only when a validated HTTPS URL exists.
