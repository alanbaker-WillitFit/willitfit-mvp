# WillItFit RC4 content contract

Mother RC4 → RC4-aligned runtime sheet → RC4 website build.

The Mother workbook is the naming authority. The production spreadsheet ID variable remains
`GOOGLE_SHEETS_SPREADSHEET_ID`; the existing aliases `GOOGLE_SPREADSHEET_ID` and
`GOOGLE_SHEET_ID` remain read-only compatibility aliases. RC4 does not change credentials or
write to Google Sheets.

## Current naming mismatches discovered

1. Mother uses `13_Content`, while the current runtime has no general site-content tab.
2. Travel tips are governed in Mother `13_Content` but published to runtime `06_Travel_Tips`.
3. Mother `10_Products` and runtime `09_Affiliate_Products` use different identifiers and lack a
   common stable slot-position contract.
4. Runtime recommendation tabs `82_Affiliate_Intent_Map`, `83_Affiliate_Rules`, and
   `84_Recommendation_Cards` have no single matching Mother tab.
5. Existing content uses `Status`, `Lifecycle Status`, and `Runtime Publish Status`; RC4's
   canonical controls are `Active`, `Review Status`, and `Publish`.
6. No existing Mother or runtime tab governs Lab configuration.
7. `Content Engine` and `Site Content` appear in earlier code/documentation as provisional names.
   RC4 canonical runtime names are `90_Site_Content` and `91_Lab_Config`; aliases are read-only.
8. The legacy Mother tab `64_Audit_04_Relationship_Integrity` is 34 characters, exceeding
   Excel's 31-character worksheet limit. The generated local migration copy records this and
   renames only that local copy to `64_Audit_04_Relationships`; production is untouched.

## Contract matrix

| Mother tab and field | Runtime tab and field | Website consumer | Type | Required | Status/publication rule | Fallback | Legacy alias |
|---|---|---|---|---|---|---|---|
| `02_Airlines.AirlineID` | `01_Airlines.AirlineID` | airline loader/routes | stable ID | yes | airline row Published/Live | certified bundled airline | none |
| `03_Policies` dimensions | `02_Baggage_Rules.HeightCm/WidthCm/DepthCm` | checker/airline pages | positive number cm | per available bag type | published rule only | certified bundled rule | none |
| `13_Content.ContentID` | `90_Site_Content.ContentID` | shared runtime content service | stable ID | yes | duplicate published IDs fail closed | bundled record | `Content ID` |
| `13_Content.Content Type` | `90_Site_Content.Module` + `Content Type` | About, Hints, FAQs, Notices, future modules | controlled text | yes | Published + Active + Publish=Yes | per-module bundled content | none |
| `13_Content.Priority` | `90_Site_Content.Priority` | all content modules | integer | optional | ascending, then ContentID | bundled order | `Display Order`, `Order` |
| `13_Content.Lifecycle Status` | `90_Site_Content.Active` | all content modules | Active/Inactive | yes | Inactive is never displayed | bundled Active record | `Lifecycle Status` |
| `13_Content.Status` | `90_Site_Content.Review Status` | all content modules | Draft/Review/Published | yes | only Published may display | bundled Published record | `Status`, `Workflow Status` |
| `13_Content.Runtime Publish Status` | `90_Site_Content.Publish` | all content modules | Yes/No | yes | explicit No blocks publication | bundled Yes record | `Runtime Publish Status` |
| `13_Content` Travel Tip fields | `06_Travel_Tips.TipID/Title/Content/Category/Status` | tips pages/cards | content record | yes for published tips | Published/Live only | bundled tips | `Content Engine` tab |
| `08_FAQs` FAQ fields | `90_Site_Content` with `Module=FAQs` | FAQ consumers (migration-ready) | content record | optional | Published + Active + Publish=Yes | existing bundled FAQ | existing FAQ loader |
| `10_Products.Affiliate Slot ID` | `09_Affiliate_Products.Affiliate Slot ID` | Travel Essentials | stable ID | yes for product | published HTTPS link only | stable placeholder | `AffiliateID`, `SlotID` |
| `10_Products.Slot Position` | `09_Affiliate_Products.Slot Position` | Travel Essentials | integer 1–10 | yes for product | first valid published row per category/position | stable placeholder | `Position`, `Display Order` |
| `10_Products.Product Title` | `09_Affiliate_Products.Product Title` | product card | text | yes for product | published record only | placeholder title | `Product`, `Title` |
| `10_Products.Affiliate URL` | `09_Affiliate_Products.Affiliate URL` | product CTA | HTTPS URL | yes for product | invalid/non-HTTPS fails closed | no link rendered | `AffiliateURL`, `URL` |
| `84_Recommendation_Cards` matching fields | `84_Recommendation_Cards` | result recommendations | governed record | optional | existing published rule | no card | none |
| `91_Lab_Config.ConfigID` | `91_Lab_Config.ConfigID` | post-result game invitation | stable ID | yes | Published + Active + Publish=Yes | one bundled WillItFly record | `Config ID` |
| `91_Lab_Config.GameID` | `91_Lab_Config.GameID` | game identity | slug | yes | one independently governed game | `willitfly` | `Game ID` |
| `91_Lab_Config.Game Path` | `91_Lab_Config.Game Path` | invitation destination | site-relative path | yes | used only for the published active game | `/lab/index.html` | `GamePath`, `Destination URL` |
| `91_Lab_Config.Trigger Date` | `91_Lab_Config.Trigger Date` | post-result game invitation | ISO date | yes | invitation appears at/after 00:00 UTC | WillItFly: 2026-06-15 | `TriggerDate` |

## Publication and validation rules

- Mother remains authoritative; publish a reviewed, approved export to the existing runtime
  spreadsheet rather than editing production records by hand.
- `Publish` is authoritative when present. `Publish=No` fails closed even if a review value says
  Published. Where legacy rows lack `Publish`, Published/Live/Approved remains a compatibility path.
- Draft and Review records never display. Inactive records never display.
- Airline eligibility requires a published airline row and at least one published, valid baggage
  rule. Missing cabin or personal-item rules no longer suppress the entire airline.
- Affiliate positions are fixed at 1–10 for each canonical category. A missing, duplicate,
  unpublished, unsafe, or invalid product leaves the corresponding placeholder in place.
- Sheet failure is isolated: the checker and informational modules use validated bundled content.

## Migration sequence

1. Generate and review the local RC4 Mother and runtime files with
   `node scripts/content-automation/build-rc4-workbooks.mjs`.
2. Compare added columns with the production sheet; preserve every existing row and tab.
3. Add `90_Site_Content` and `91_Lab_Config` to a non-production copy.
4. Add the affiliate slot columns without renaming or deleting legacy columns.
5. Validate unique IDs, statuses, ordering, positive dimensions, HTTPS links, and Publish controls.
6. Export reviewed Mother records into the mapped runtime tabs.
7. Smoke-test the website against the non-production copy using the existing credential mechanism.
8. Only after explicit approval, apply additive changes to the existing production spreadsheet.

No RC4 step requires a new spreadsheet ID or new credentials.
