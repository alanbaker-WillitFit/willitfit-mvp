# WillItFly RC1

**Know Before You Go.** WillItFly is a governed destination decision utility that gives travellers practical, source-backed answers before they travel.

This branch is the active WillItFly RC1 cleanse and build line. It is intentionally isolated from WillItFit baggage-checking logic and from the WillItFit Runtime.

## Architecture

Authoritative flow:

`Mother -> Cockpit -> WillItFly RC1 Runtime -> Website`

Current RC1 development uses the separate WillItFly Runtime directly as the website delivery source while Cockpit remains frozen until the Runtime contract is stable enough to lock.

Rules:

- Mother remains authoritative.
- The website reads WillItFly Runtime only; it never reads Mother directly.
- There is no WillItFit Runtime fallback.
- Missing or unapproved factual data fails closed rather than being invented.
- Destination identity is anchored by stable `Destination_ID` records.
- Canonical destination routes use `/fly/[destinationSlug]`.
- Runtime owns governed data; Build owns presentation and deterministic rendering logic.

## RC1 product journey

The homepage is the destination-first entry experience: destination selection -> stable `Destination_ID` -> governed identity and coordinates -> map/location experience -> destination route -> factual travel answers.

The five primary destination topics are:

- Power
- Connectivity
- Money
- Entry
- Weather

The location identity card remains persistent. Destination hierarchy/navigation must be driven by governed Runtime relationships rather than hard-coded geography.

## Runtime preview and publication

Local RC1 development may use:

```text
WILLITFLY_RUNTIME_PREVIEW=true
```

Preview permits controlled draft/review Runtime data for development. Global navigation remains independently governed by its `Active` and `Publish` controls; preview mode must not expose unpublished navigation.

Production publication remains fail-closed until the governed release process is approved.

## Local configuration

Copy `.env.local.example` to `.env.local` and supply the controlled WillItFly Runtime ID plus read-only Google service-account credentials. Never commit real credentials.

Core variables:

```text
WILLITFLY_RUNTIME_SPREADSHEET_ID=
WILLITFLY_RUNTIME_PREVIEW=true
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
```

## Development

```bash
npm ci
npm run dev
```

## Certification

Run the full RC1 verification gate:

```bash
npm run verify
```

The gate runs active-source TypeScript checking, ESLint, the WillItFly RC1 test boundary, and the Next.js production build. A technical pass does not by itself constitute UX acceptance; the destination-first journey must also be visually and functionally verified.

## Deployment

Cloudflare remains the deployment environment. Standard workflow is local verification -> controlled GitHub checkpoint -> CI certification -> staging verification -> approved release. The Raspberry Pi / Cockpit operations architecture is not a production web server and does not replace Cloudflare hosting.

## Archive

`archive/` contains inert historical material only. Active RC1 application code must not depend on archived WillItFit/RC4/RC5 implementation.
