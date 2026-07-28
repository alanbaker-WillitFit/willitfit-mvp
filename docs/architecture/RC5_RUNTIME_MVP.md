# RC5 MVP Runtime Binding

## Environment

- Runtime: `RC5_Runtime_Test`
- Spreadsheet ID: `1rtf2tv8AN4ooTqOHqdonoci3bc863E7h6auK8NJn-Io`
- Environment classification: TEST only
- Production connected: No
- Publication enabled: No

## Required local/runtime variables

```text
GOOGLE_SHEETS_SPREADSHEET_ID=1rtf2tv8AN4ooTqOHqdonoci3bc863E7h6auK8NJn-Io
GOOGLE_SERVICE_ACCOUNT_EMAIL=<local-or-test-service-account-email>
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=<local-or-test-private-key>
```

Credentials must remain in the local or Cloudflare secret store and must not be committed.

## Canonical RC5 MVP tabs

- `01_Airlines`
- `02_Baggage_Rules`
- `06_Travel_Tips`

`00_Runtime_Control` governs the environment and feature state but is not yet consumed by the application loader.

## Fail-closed rules

- Core RC5 modules do not traverse RC4-era tab aliases.
- Missing or invalid canonical tabs return no core records.
- Embedded airline and travel-tip fallback records are disabled on the RC5 branch.
- Production spreadsheet IDs must not be used for RC5 development certification.

## Dimension adapter

For the MVP runtime, the existing application dimension object is populated as follows:

- `Length cm` -> internal `heightCm`
- `Width cm` -> internal `widthCm`
- `Depth cm` -> internal `depthCm`

This is an explicit development adapter, not a final semantic ruling. Orientation-safe comparison and user-facing labels must be verified during connected-build testing.
