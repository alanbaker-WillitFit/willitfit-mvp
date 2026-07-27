# WillItFit MVP RC2.43

Code-strengthening revision based on RC2.42.

## Implemented
- Canonical airline pages now use short public routes such as `/ryanair`.
- Legacy `/airlines/[slug]` routes permanently redirect to the short route.
- `/airlines` remains the airline directory.
- Added canonical, Open Graph, Twitter and robots metadata for airline pages.
- Sitemap now publishes short airline URLs and uses real airline review dates where valid.
- Sheet airline and baggage-rule statuses are respected; Draft and Archived records are excluded.
- Incomplete airline records with invalid core dimensions are withheld from publication.
- Added request-level React caching for the airline dataset.
- Dimension input now supports one decimal place, rejects malformed multiple-decimal values, and limits measurements to 1–150 cm.
- Fare-class resolution falls back safely when a fare-class bag allowance is incomplete.
- Updated internal airline links to the canonical short URL.

## Verification
- `npm run type-check`: passed.
- `npm run build`: passed.
- Build used fallback data because deployment-only Google Sheet environment variables are not present in the packaging environment.
