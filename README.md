# WillItFit

**Know before you go.** A free tool that checks whether a cabin bag, backpack, or personal item meets an airline's published baggage size limits — in seconds, with no sign-up.

Built as an MVP: simple, fast, SEO-first, and entirely driven by a Google Sheet so airlines, tips, and content can be added or edited without touching code.

---

## 1. Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Google Sheets** as the CMS / data source (via `google-spreadsheet` + a service account)
- Deploys to **Vercel** with zero config beyond environment variables
- No database. No accounts. No backend to maintain.

## 2. Architecture rule

**No airline, tip, FAQ, or affiliate data is hardcoded anywhere in the codebase.** Everything in `/services/*.ts` reads from the Sheet at request time (cached and revalidated — see §6). Add a row to the Sheet, mark it `Live`, and it appears on the site on the next revalidation — no deploy required.

The one exception is `/data/fallback.ts`: a small, clearly-labelled dataset used **only** if the Sheet is unreachable, so the site degrades gracefully instead of breaking (see §7, Error handling).

## 3. Project structure

```
app/            Routes (App Router) — pages, layout, sitemap, robots, error/not-found
components/     UI components (Header, DimensionForm, FitResultCard, cards, FAQ…)
services/       One file per Sheet tab — fetch + map raw rows to typed objects
lib/            Pure logic: fit calculation, JSON-LD schema, small utilities
hooks/          Client-side state (the dimension form)
types/          Shared TypeScript types, mirroring the Sheet columns 1:1
data/           Fallback dataset only (not a second source of truth)
```

## 4. Set up the Google Sheet

Create one spreadsheet with these tabs and exact header rows (column order doesn't matter, names do):

| Tab | Columns |
|---|---|
| `Airlines` | `AirlineID, AirlineName, Country, LogoURL, PersonalItemHeight, PersonalItemWidth, PersonalItemDepth, CabinHeight, CabinWidth, CabinDepth, WeightLimit, WebsiteURL, LastUpdated, Status` |
| `Travel Tips` | `TipID, Title, Content, Category, SEOKeyword, CTA, Status` |
| `SEO Pages` | `PageSlug, Title, MetaDescription, H1, BodyContent, FAQJSON, Status` |
| `Poll Questions` | `Question, OptionA, OptionB, OptionC, OptionD, Category, Status` |
| `Affiliate Links` | `AffiliateID, Brand, Product, Category, AffiliateURL, ImageURL, Status` |

Only rows with `Status = Live` are shown on the site — use `Draft` to stage content and `Archived` to retire it without deleting history.

`FAQJSON` should contain a JSON array, e.g. `[{"question":"...","answer":"..."}]`. Malformed JSON is logged and skipped for that row rather than crashing the page.

### Connect a service account

1. In Google Cloud Console, create a project (or reuse one) → **APIs & Services → Library** → enable the **Google Sheets API**.
2. **IAM & Admin → Service Accounts** → create one → create a JSON key.
3. Open the Sheet → **Share** → add the service account's `client_email` as **Viewer**.
4. Copy `spreadsheet_id` (from the Sheet's URL), the service account `client_email`, and `private_key` into your `.env.local` (see `.env.example`).

## 5. Local development

```bash
npm install
cp .env.example .env.local   # fill in the Google Sheets values
npm run dev
```

Visit `http://localhost:3000`. With no `.env.local` configured, the site still runs using the fallback dataset, so you can develop UI without Sheets access.

## 6. Caching & revalidation

Pages use `export const revalidate = 3600` (1 hour) via Next's ISR — adjust per-page or via `SHEET_REVALIDATE_SECONDS` if you want a different cadence. A Sheet edit doesn't need a redeploy; it appears after the next revalidation window, or instantly if you wire up an on-demand revalidation webhook later (see roadmap).

## 7. Error handling

- **Sheet unreachable / auth failure** → falls back to `/data/fallback.ts` so the checker still works.
- **Unknown airline/tip slug** → custom `not-found.tsx`.
- **Unexpected runtime error** → `error.tsx` boundary with a retry button, never a blank screen.
- **Invalid dimensions** → the form disables submission and explains what's missing; no server round-trip needed since fit calculation runs client-side.

## 8. Deploying to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Vercel: **Add New → Project** → import the repo.
3. Framework preset: **Next.js** (auto-detected).
4. Add the environment variables from `.env.example` under **Settings → Environment Variables** (use the multiline-safe paste for `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` — Vercel preserves `\n` correctly when pasted as-is from the JSON key file).
5. Deploy. Vercel handles build, ISR, and edge caching automatically.
6. Point your domain at the Vercel project and update `NEXT_PUBLIC_SITE_URL`.

No serverless function configuration is needed — Sheet reads happen inside Server Components at request/revalidation time.

## 9. Testing checklist before launch

- [ ] All 10 target airlines present in the Sheet with `Status = Live` and correct cm values
- [ ] Submitting the checker with no airline selected shows the inline hint, not an error
- [ ] A bag that fits, one that's within 2 cm, and one that clearly doesn't fit each show the correct verdict, copy, and colour
- [ ] Rotating a bag's dimensions (e.g. entering 40×55×20 instead of 55×40×20) still grades correctly — orientation-flexible matching
- [ ] `/airlines` lists every live airline; each `/airlines/[slug]` page renders FAQ + breadcrumb JSON-LD (validate in Google's Rich Results Test)
- [ ] `/tips` and `/tips/[slug]` render from the sheet; empty-tips state shows a friendly message, not a crash
- [ ] Temporarily revoke Sheet access and confirm the site still renders via fallback data with no console-visible secrets
- [ ] Lighthouse mobile run ≥ 95 on Performance, Accessibility, Best Practices, SEO for `/` and one `/airlines/[slug]` page
- [ ] Keyboard-only pass: airline selector, bag-type toggle, and FAQ accordion are all reachable and operable
- [ ] `sitemap.xml` and `robots.txt` resolve and include every live airline/tip slug

## 10. Future roadmap (architected for, not built)

- Airline comparison tool (compare 2+ airlines side by side)
- Baggage fee calculator
- Interactive 3D/AR sizing cage visualiser
- Saved bags + accounts
- AI travel assistant
- Native mobile app
- Public API layer over the existing services
- Multi-language support
- On-demand Sheet → site revalidation webhook (skip the hourly wait)
- Poll-of-the-day widget (data service already exists in `services/polls.ts`, unused by any page yet)

---

Tagline: **Know Before You Go.**
