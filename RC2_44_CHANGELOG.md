# WillItFit MVP RC2.44

Bug-fix revision based on RC2.43, from code review.

## Fixed
- `lib/dimensions.ts`: dimension inputs no longer accept a lone "." (previously
  passed sanitisation but produced `NaN`, silently failing validation with no
  way for the user to see why).
- `services/googleSheets.ts`: a failed Google Sheets read (network error, rate
  limit, bad token) is now cached for only 60 seconds instead of the full
  revalidate window (default 1 hour), so the site recovers from transient
  outages much faster instead of being stuck on fallback data.
- `app/[slug]/page.tsx`: airline and SEO-page lookups now resolve concurrently
  in both `generateMetadata` and `PublicPage`, and a slug collision between an
  airline and an SEO page (same slug used in two sheet tabs) now logs a clear
  `console.error` instead of silently making the SEO page unreachable.

## Verification
- `node --check` syntax verification passed on all edited `.ts` files.
- Full `npm run build` / `npm run type-check` could not be run in this
  environment (no network access to install dependencies) — recommend
  running both before deploying.
