# RC5 Runtime Binding

## Environment

- Runtime: `RC5_Runtime_Test`
- Spreadsheet ID: `1pi8u7ddOaBeC9plEzh-TDck3pvVhw9mQg1Q24E7K4yU`
- Source authority: `WillItFit Mother RC1 — RC5 WORKING COPY`
- Source spreadsheet ID: `1OO5QjofjOOsNgRlS4pgAdLDqPwXxguTWXxzCH_5gvfQ`
- Environment classification: TEST only
- Production connected: No
- Publication enabled: No

## Required local/runtime variables

```text
GOOGLE_SHEETS_SPREADSHEET_ID=1pi8u7ddOaBeC9plEzh-TDck3pvVhw9mQg1Q24E7K4yU
GOOGLE_SERVICE_ACCOUNT_EMAIL=<local-or-test-service-account-email>
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=<local-or-test-private-key>
```

Credentials must remain in the local or Cloudflare secret store and must not be committed.

## Canonical RC5 tabs

Core application tabs:

- `02_Airlines`
- `03_Airline Rules`
- `05_FAQs`
- `06_Tips`
- `07_Site Content`
- `09_Affiliate_Placements`
- `10_Lab`

Additional Mother-derived runtime data retained for RC5 development:

- `00.13_Affiliate_Programmes`
- `01_Settings`
- `04_Special Baggage All`
- `04.1_Special Baggage Results`
- `08_SEO Pages`
- `11_Countries_Base`
- `11.1_Country_Travel_Facts`
- `15_Redirects`

`00_Runtime_Control` records TEST isolation and validation state. It is not yet consumed by the application loader.

## Fail-closed rules

- Core RC5 modules do not traverse compact RC4 runtime aliases.
- Missing or invalid canonical tabs return no core records.
- Embedded airline and travel-tip fallback records remain disabled on the RC5 branch.
- Production spreadsheet IDs must not be used for RC5 development certification.

## Current status

The full Mother-derived dataset has been copied into the isolated TEST runtime. Runtime schema and connected application behaviour still require validation before certification.
