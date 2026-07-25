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

## Local RC4 TEST runtime

Copy `.env.local.example` to `.env.local` and add the read-only service-account
email and private key. The example is deliberately pinned to the TEST workbook:

```text
1jDzgRN6gRZ6C2i1pb7eMLz22e8opVIn6opPqg3vslhg
```

The application uses the same loader locally and in Cloudflare. There is no
separate local content source:

- a successful runtime read, including an empty tab, is authoritative;
- fallback is used only when the runtime ID, authentication, request, or
  non-empty tab schema fails;
- `.env.local` is ignored by Git and must never contain the LIVE workbook ID.

The runtime loader requests these canonical reduced tabs first:

`02_Airlines`, `03_Airline Rules`, `05_FAQs`, `06_Tips`,
`07_Site Content`, `09_Affiliates`, and `10_Lab`.

Legacy aliases are temporary read compatibility only. They are tried only when
the canonical tab cannot be read, never when it is successfully empty.
