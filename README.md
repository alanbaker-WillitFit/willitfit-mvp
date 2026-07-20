# WillItFit MVP Build

**Know before you go.** WillItFit checks whether a cabin bag, backpack, or personal item meets an airline's published baggage size limits in seconds, with no sign-up.

This build is aligned to **WillIt Engineering Register baseline and RC2.50 stability controls**. The application uses central WDS tokens, card primitives, motion standards, layout primitives, interaction states, and responsive section flow so components inherit the same behaviour instead of defining transitions independently.

---

## 1. Stack

- **Next.js 15** App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **OpenNext for Cloudflare Workers**
- **Google Sheets** as the CMS / data source through the Google Sheets REST API using service-account OAuth

No database, no user accounts, and no hardcoded airline/content data beyond the explicit fallback dataset.

---

## 2. Architecture rule

**No airline, tip, FAQ, or affiliate data should be hardcoded in page or component code.**

Data should come from the Google Sheet through `/services/*.ts`. The only exception is `/data/fallback.ts`, which is a clearly labelled resilience dataset used if the Sheet is unavailable.

---

## 3. Project structure

```text
app/            Routes, layout, sitemap, robots, error/not-found
components/     UI components and WDS-inheriting cards/forms/results
services/       Google Sheet tab readers and mappers
lib/            Pure logic: fit calculation, schema, utilities
hooks/          Client-side form state
types/          Shared TypeScript models
data/           Fallback dataset only
public/         Production assets only
engineering-archive/  Non-shipped archive/preview assets
```

---

## 4. Typography standard

This build intentionally does **not** use `next/font/google` or remote Google Fonts.

The MVP uses a system font stack for speed, reliability, privacy, and offline-safe builds. Tailwind maps `font-heading` and `font-body` to native UI fonts such as San Francisco, Segoe UI, and Roboto depending on device.

This avoids external font-fetch failures during local or Cloudflare builds.

---

## 5. Google Sheet tabs

Create one spreadsheet with these tabs and exact header names. Column order may vary, but names should match exactly. The numbered tab names are intentional: they mirror the WillIt operating sheet structure and prevent similarly named tabs being read by mistake.

| Tab | Columns | Purpose |
|---|---|---|
| `01_Airlines` | `AirlineID, AirlineName, Slug, Country, AirlineType, OfficialBaggageURL, Status, LastChecked, Notes` | One row per airline. Stores identity, slug, source URL and review state. |
| `02_Baggage_Rules` | `RuleID, AirlineID, FareClass, BagType, IncludedInFare, HeightCm, WidthCm, DepthCm, WeightKg, Quantity, Storage, PriorityAllowed` | One or more allowance rules per airline. The app currently maps cabin and personal-item rows from this tab. |
| `06_Travel_Tips` | `TipID, Title, Slug, Content, Category, SEOKeyword, CTA, Status` | Travel-tip content used by tip cards and `/tips/[slug]` pages. |
| `07_Poll_Questions` | `Question, OptionA, OptionB, OptionC, OptionD, Category, Status` | Future engagement/poll content. Not wired into the UI yet. |
| `08_SEO_Pages` | `PageSlug, Title, MetaDescription, H1, BodyContent, FAQJSON, Status` | Generic SEO landing pages served from `/[slug]`. |
| `09_Affiliate_Products` | `AffiliateID, Brand, Product, Category, AffiliateURL, ImageURL, Status` | Contextual affiliate catalogue for travel accessories and fit-related recommendations. |

Only rows with `Status = Live` are shown. Some services also accept `Active` for backwards compatibility during migration. Use `Draft` for staged content and `Archived` for retired rows.

`FAQJSON` should contain a JSON array, for example:

```json
[{"question":"Can I take a backpack?","answer":"Usually yes, if it fits within the airline's personal item allowance."}]
```

Malformed FAQ JSON is logged and skipped rather than crashing the page.

---

## 6. Service account setup

1. In Google Cloud Console, enable the **Google Sheets API**.
2. Create a service account and JSON key.
3. Share the Sheet with the service account `client_email` as **Viewer**.
4. Copy the Sheet ID, service account email, and private key into `.env.local` using `.env.example` as the template.

---

## 7. Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Visit:

```text
http://localhost:3000
```

With no `.env.local`, the app still runs using `/data/fallback.ts`.

---

## 8. Validation

Run the consolidated release check:

```bash
npm run verify
```

This runs TypeScript, ESLint, automated tests, and the standard Next.js production build. Cloudflare packaging must then be checked separately:

```bash
npm run build:cloudflare
npm run deploy:dry-run
```

For Cloudflare preview:

```bash
npm run preview
```

For Cloudflare deployment:

```bash
npm run deploy
```

---

## 9. Cloudflare/OpenNext deployment

This project is configured for **OpenNext Cloudflare Workers**, not Vercel.

Key files:

- `open-next.config.ts`
- `wrangler.jsonc`
- `package.json` scripts: `preview`, `deploy`

Before deploying, configure required environment variables/secrets for Google Sheets access and set `NEXT_PUBLIC_SITE_URL` to the production domain.

---

## 10. Asset rule

Only production assets should live under `public/`.

Current production assets:

```text
public/assets/logo/logo.svg
public/assets/icons/cabin-bag.svg
public/assets/icons/personal-bag.svg
```

Archive, preview, palette, and engineering reference assets have been moved to `engineering-archive/` so they do not ship as public website files.

---

## 11. Testing checklist before launch

- [ ] All launch airlines are present in the Sheet with `Status = Live`.
- [ ] Cabin and personal item dimensions are verified against official airline sources.
- [ ] Fit, close, and no-fit cases display the correct copy, colour, icon, and margin logic.
- [ ] Orientation-flexible matching works, for example 40×55×20 against 55×40×20.
- [ ] Airline selector, bag-type buttons, form fields, result card, FAQ accordion, and CTA buttons are keyboard accessible.
- [ ] `/airlines`, canonical `/<airline-slug>` routes and legacy `/airlines/[slug]` redirects, `/tips`, `/tips/[slug]`, SEO pages, `sitemap.xml`, and `robots.txt` render correctly.
- [ ] Temporarily remove Sheet access and confirm fallback data renders without exposing secrets.
- [ ] Lighthouse mobile checks pass for Performance, Accessibility, Best Practices, and SEO.
- [ ] Cloudflare preview works before production deploy.

---

## 12. Future roadmap

- Airline comparison tool
- Baggage fee calculator
- Saved bag profiles
- Affiliate recommendation routing by result state
- Multi-language support
- Sheet revalidation webhook
- Poll-of-the-day widget



---

## RC2.50 operational documents

- `docs/ENVIRONMENT.md`
- `docs/DEPLOYMENT_RUNBOOK.md`
- `docs/AIRLINE_DATA_RUNBOOK.md`
- `docs/KU_TEST_CHECKLIST.md`
- `RC2_50_CHANGELOG.md`

The `/diagnostics` page is non-indexed and reports Sheet load state plus required-column validation. It must never be extended to display secrets, tokens, private keys, or raw credential values.
