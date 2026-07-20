# RC3 Performance Report

## Certification result

**PASS WITH MONITORING.** RC3 preserves the RC2 architecture and bundle profile. The controlled mobile Lighthouse run records LCP at 2.25 seconds and CLS at 0. The remaining CPU-bound Total Blocking Time is an AMBER field-monitoring item, not evidence for a redesign.

## Controlled production evidence

Audit target: local `next start` production build, Chrome Lighthouse mobile throttling, 19 July 2026.

| Measure | Result | Assessment |
|---|---:|---|
| Lighthouse performance | 75/100 | AMBER: local CPU throttling variance |
| First Contentful Paint | 1.53 s | PASS |
| Largest Contentful Paint | 2.25 s | PASS against the specification's 2.5 s target |
| Cumulative Layout Shift | 0 | PASS against the 0.1 target |
| Total Blocking Time | 1.07 s | AMBER; navigation-lab proxy only |
| Accessibility | 100/100 | PASS |
| Best Practices | 100/100 | PASS |
| SEO | 100/100 | PASS |
| Transfer size | 379,117 bytes | PASS; 17 requests |
| Root first-load JavaScript | 131 kB | unchanged from Section 7 |
| Shared first-load JavaScript | 102 kB | unchanged from Section 7 |

Lighthouse does not measure field INP in a navigation-only lab run. TBT is retained as a proxy; production INP requires real-user monitoring after deployment.

## Corrections supported by evidence

- Corrected four colour-contrast defects using existing design tokens. The rerun contains zero contrast findings and scores Accessibility 100.
- Forced metadata into the document head for all crawler classes. This resolves the streamed-metadata false negative and improves compatibility with HTML-limited and AI crawlers.
- Declared the existing WillItFit brand asset as the icon, removing the favicon console error without adding an asset.

## Asset and runtime findings

- Lighthouse reported no image-delivery issue and no unused CSS opportunity.
- No third-party request appeared in the audited home-page journey.
- The existing embedded brand imagery remains unchanged because no measured result proves replacement is necessary.
- A single shared framework chunk produced the only unused-JavaScript estimate; removing framework runtime code is not a safe local optimisation.
- Google Sheets services use the existing cache/fallback contract. The build completed without production credentials and reported the absent spreadsheet identifier explicitly.

## Cloudflare evidence

- Wrangler: 4.106.0.
- Next production build: PASS, 35 static/dynamic routes generated.
- OpenNext build on this Windows host: BLOCKED before application compilation. OpenNext emits its own Windows compatibility warning, then esbuild fails while resolving `open-next.config.ts` after traversing toward the drive root. Granting read-only drive access did not change the result.
- WSL is not installed on this host. No production deployment was attempted.

The Cloudflare code/configuration contract remains unchanged. A supported Linux/WSL CI run of `npm run build:cloudflare` and `npm run deploy:dry-run` is required before release approval.

## Performance acceptance

Section 8 passes with one operational condition: validate the unchanged OpenNext adapter in Linux/WSL CI and begin field Web Vitals monitoring at launch. There is no evidence supporting architectural redesign or asset deletion.
