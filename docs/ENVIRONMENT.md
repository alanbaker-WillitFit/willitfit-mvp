# Environment variables

## Required in production

| Variable | Purpose | Storage |
|---|---|---|
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Google Sheet source ID | Cloudflare secret or variable |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Read-only service-account identity | Cloudflare secret |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Service-account PKCS8 private key | Cloudflare secret |
| `NEXT_PUBLIC_SITE_URL` | Canonical public origin, currently `https://will-it-fit.net` | Build/runtime variable |

## Optional

| Variable | Default | Purpose |
|---|---:|---|
| `SHEET_REVALIDATE_SECONDS` | `3600` | In-process Sheet row cache lifetime |
| `NEXT_PUBLIC_SITE_NAME` | `WillItFit` | Public site name |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | blank | Reserved analytics setting |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | blank | Reserved analytics setting |

## Private-key format

Keep the key as one secret value with escaped newlines:

```text
-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

Never commit `.env.local`, service-account JSON, private keys, tokens, or spreadsheet credentials.
