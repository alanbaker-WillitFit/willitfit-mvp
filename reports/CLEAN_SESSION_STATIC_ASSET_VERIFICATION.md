# Clean-session static-asset verification

Date: 2026-07-20  
Production-equivalent URL: `http://127.0.0.1:3018/`  
Build ID: `SQOxjPKIKaFOm_IlmhPW2`

## Root cause

Six `next start` processes were simultaneously listening on ports 3012–3017 while successive production builds reused the same `.next` directory. Older processes continued emitting HTML from their in-memory build manifests, but their static-asset handler read the newest files on disk. As later builds replaced hashed assets, the older HTML referenced CSS and JavaScript hashes that no longer existed. Browsers with those older hashes cached remained styled; clean sessions requested the obsolete URLs and received HTML error responses.

The reproduced clean load on port 3016 requested `/_next/static/css/3675609c4b40d5e2.css`, received HTTP 400 with `text/html`, and rendered with Times New Roman on a transparent body. The same page's still-present shared chunks returned 200, explaining the partial and inconsistent appearance.

Representative stale-process failures, all initiated by `/`:

| Port | Failed asset | HTTP | MIME |
| --- | --- | ---: | --- |
| 3012 | `/_next/static/css/28ff77c9e82f6654.css` | 400 | `text/html; charset=utf-8` |
| 3012 | `/_next/static/chunks/app/page-3fd919aaa7ad8256.js` | 400 | `text/html; charset=utf-8` |
| 3013 | `/_next/static/css/9872693162db57c6.css` | 400 | `text/html; charset=utf-8` |
| 3014 | `/_next/static/chunks/437-fddf2778f27ad81a.js` | 400 | `text/html; charset=utf-8` |
| 3015 | `/_next/static/css/2a4de7c529223c34.css` | 400 | `text/html; charset=utf-8` |
| 3016 | `/_next/static/css/3675609c4b40d5e2.css` | 400 | `text/html; charset=utf-8` |

Port 3017, the most recently started process before cleanup, referenced the then-current stylesheet and returned `200 text/css`, confirming that static routing, MIME handling, and application styling were not the defect.

## Correction

1. Stopped only the verified Node listeners on ports 3012–3017.
2. Removed only the disposable `.next` build-output directory.
3. Ran `npm run build` from the application root.
4. Started exactly that build with `npm run start -- -p 3018`.
5. Left one production listener running on port 3018.

No application source, styling, component, `assetPrefix`, `basePath`, OpenNext, or Cloudflare configuration was changed.

## Fresh build

- Next.js 15.5.19 production build completed successfully.
- Compile, type/lint validation, page-data collection, and generation of 35 static pages completed.
- Build warning: Google Sheets spreadsheet ID environment variable is absent locally; this did not fail the build or asset serving.

## Fresh asset results

HTML-referenced assets were enumerated on `/`, `/products`, `/airlines`, `/tips`, and `/ask`.

- 1 unique CSS asset: HTTP 200, `text/css; charset=UTF-8`.
- 15 unique JavaScript assets: HTTP 200, `application/javascript; charset=UTF-8`.
- Home CSS: `/_next/static/css/42492f6eecbec427.css` — HTTP 200.
- Home page JavaScript chunks: all HTTP 200.
- Hero PNG, logo/icon SVGs, and six optimized Travel Essentials WebP images: all HTTP 200 with matching `image/*` MIME types.
- No web-font requests are expected: the application uses the system font stack.
- The main application references neither a manifest nor a service worker. `/manifest.webmanifest` and `/sw.js` therefore return unreferenced 404 HTML responses.
- The WillIt Lab-specific `/lab/manifest.webmanifest` returns 200 `application/manifest+json`; `/lab/sw.js` returns 200 `application/javascript`.
- No `assetPrefix` or `basePath` is configured. `next start` serves `/_next/static/*` directly.
- OpenNext/Cloudflare files are not involved in the documented local `next start` path.

## Browser matrix

| Scenario | Result |
| --- | --- |
| Normal profile, cache disabled, 1440×1200 | Styled immediately; CSS/JS 200; no recorded page errors |
| Independent Edge InPrivate profile, 1440×1200 | Styled immediately; all assets fetched without disk cache or service worker |
| Normal profile after clearing all site data | Styled immediately; CSS 200 and all 14 home script resource entries 200 |
| Hard refresh with cache bypass | Styled; no failed `/_next/static/*` resources; no recorded page errors |
| Fresh private mobile viewport, 390×844 | Styled; CSS 200; no failed static assets; no recorded page errors |
| Direct `/products`, `/airlines`, `/tips`, `/ask` loads | Styled; current CSS present; repeated verification produced no failed static assets or hydration errors |

The independent InPrivate network trace showed all CSS and JavaScript responses as HTTP 200, `fromDiskCache: false`, and `fromServiceWorker: false`. No service-worker registrations existed for the clean main-app session. Two cancelled requests were Next.js speculative RSC prefetches for `/tips`; they were `Fetch` requests cancelled by the browser, not CSS/JS failures.

## Functional hydration checks

- Airline search found British Airways.
- Selecting British Airways populated 56 × 45 × 25 cm.
- Checker submission returned `PASS — Good to go`.
- Travel Essentials displayed six categories; opening Packing Cubes produced its sheet.
- At 390 px after submission, six cards rendered as balanced 174 px-wide mobile cards and the sheet opened.
- Repeated clean direct-route checks recorded no hydration errors.

## Screenshots

- `clean-session-evidence/normal-cache-disabled.png`
- `clean-session-evidence/private-clean-session.png`
- `clean-session-evidence/mobile-fresh-session.png`
- `clean-session-evidence/pre-fix-clean-port-3016.png`
