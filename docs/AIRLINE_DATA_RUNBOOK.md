# Airline add, update, and retire run book

Google Sheets remains the source of truth.

## Add an airline

1. Add one row to `01_Airlines` with a unique `AirlineID` and slug.
2. Keep `Status = Draft` while preparing data.
3. Add personal-item and cabin-bag rules to `02_Baggage_Rules` using the same `AirlineID`.
4. Use positive centimetre values for all three dimensions.
5. Use an official HTTPS baggage-policy URL.
6. Record `LastChecked` in ISO format: `YYYY-MM-DD`.
7. Review `/diagnostics`; missing or duplicate required columns must be resolved.
8. Change the airline and approved rules to `Live` only after verification.

## Update an airline

1. Verify the official airline source.
2. Update affected rule rows rather than creating conflicting duplicate live rows.
3. Update `LastChecked` using ISO format.
4. Test personal-item and cabin-bag results.
5. Confirm fare-class labels and weight limits remain accurate.

## Retire an airline or rule

Set `Status = Archived`. Do not delete historical rows unless they are erroneous duplicates with no audit value.

## Publication safeguards

- Blank or unknown statuses are treated as Draft.
- Duplicate published airline IDs or slugs are withheld.
- Invalid or incomplete dimensions are withheld.
- Invalid non-HTTPS source URLs are not published.
- Missing required Sheet columns fail the affected tab closed.
