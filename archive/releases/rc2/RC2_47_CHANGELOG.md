# RC2.47 — Checker Accuracy

## Form behaviour

- Added field-level touched state and validation messages.
- Added predictable paste/typing sanitisation for commas, units, spaces, multiple decimal points and excessive digits.
- Added blur normalisation for trailing decimal points, leading zeros and redundant decimal zeroes.
- Added focus on the first invalid measurement after submit.
- Added an explicit airline-selection error after submit.
- Added a Reset measurements action that clears dimensions, validation state, fare selection and prior results while retaining the selected airline and bag type.
- Continued to preserve entered measurements when changing airline or bag type.
- Removed the disabled-submit behaviour so validation feedback is always reachable.

## Validation rules

- Measurements remain limited to 1–150 cm.
- Inputs support up to three whole-number digits and one decimal place.
- Commas are normalised to decimal points.
- Pasted units and non-numeric characters are removed.

## Tests

- Added regression coverage for input sanitisation, pasted values, decimal normalisation, leading zeros, empty values and boundary validation.
