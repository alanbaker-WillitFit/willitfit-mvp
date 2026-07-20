# Key-user test checklist

Record device, browser, input, expected result, actual result, screenshot, and pass/fail for every case.

## Checker

- [ ] Exact allowance returns Good to Go.
- [ ] One dimension 0.1 cm over returns Close to the Limit.
- [ ] One dimension exactly 2 cm over returns Close to the Limit.
- [ ] One dimension more than 2 cm over returns Too Large.
- [ ] A three-digit oversize value cannot return Good to Go.
- [ ] Rotated dimensions are evaluated correctly.
- [ ] Decimal and comma-decimal entry works.
- [ ] Blank and partial inputs show field-level messages.
- [ ] Reset clears measurements and result without changing airline or bag type.
- [ ] Changing airline preserves entered measurements.
- [ ] Changing bag type preserves entered measurements.

## Airline pages

- [ ] `/ryanair` and other live slugs load the correct airline.
- [ ] `/airlines/<slug>` redirects permanently to `/<slug>`.
- [ ] Fare-class rows show only complete allowances.
- [ ] Related airlines link to canonical URLs.
- [ ] Official policy links use HTTPS.
- [ ] Reviewed dates match the Sheet.

## Data resilience

- [ ] Live Sheet data is reported as fresh or cached.
- [ ] Missing credentials activate fallback without exposing secrets.
- [ ] A missing required column marks the tab invalid in `/diagnostics`.
- [ ] Draft and Archived records remain unpublished.
- [ ] Duplicate published slugs are withheld.
