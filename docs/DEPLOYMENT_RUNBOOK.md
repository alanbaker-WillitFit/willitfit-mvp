# Cloudflare Worker deployment run book

The deployment target is the Cloudflare Worker project `willitfit-mvp-rc1`. The deprecated Cloudflare Pages project is not the release target.

## Pre-deployment

```bash
npm ci
npm run verify
npm run build:cloudflare
npm run deploy:dry-run
```

All four commands must exit successfully. Do not deploy from a build that only passed `next build`.

## Secrets

Confirm these Worker secrets exist:

```text
GOOGLE_SHEETS_SPREADSHEET_ID
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
```

## Deploy

```bash
npm run deploy
```

## Post-deployment verification

1. Open the production home page.
2. Check an exact-fit, close-fit, and oversize bag.
3. Open `/ryanair`, `/airlines`, `/tips`, `/sitemap.xml`, and `/robots.txt`.
4. Open `/diagnostics` and confirm the required Sheet tabs are `fresh` or `cached`, with `Schema = Valid`.
5. Confirm no fallback-data warning is shown when live Sheet access is expected.
6. Record the deployed commit and UTC deployment time.

## Rollback

Use Cloudflare deployment history to restore the previous successful Worker version. Do not debug by switching back to the deprecated Pages project.

## RC3 release controls

Build and dry-run in a supported Linux environment. Record the commit, Node/npm versions, Wrangler version, OpenNext output, dry-run output and artifact hash in the release evidence. Production deployment requires Product Owner UAT sign-off.

## Monitoring and support

1. Enable Cloudflare Worker logs and request/error analytics for the production Worker.
2. Enable privacy-respecting Cloudflare Web Analytics for traffic and Web Vitals, or explicitly approve an equivalent.
3. Alert on elevated 5xx responses, Worker exceptions and origin/Sheet access failures.
4. Review `/diagnostics` with authenticated operational access only when `ENABLE_DIAGNOSTICS=true`; disable it after investigation.
5. Track LCP, CLS and field INP after launch. Do not optimise from a single synthetic run.
6. Route traveller/content reports to the documented support owner and record incidents in the issue register.

## Rollback verification

Before launch, identify the previous successful deployment ID and exercise rollback in the release environment. After rollback, repeat the exact-fit, close-fit, oversize, airline-page, sitemap, robots and diagnostics smoke checks. Record recovery time and the restored deployment ID.
