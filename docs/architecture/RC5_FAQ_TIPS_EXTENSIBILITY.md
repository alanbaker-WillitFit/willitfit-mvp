# WillItFit RC5 — FAQ / Tips extensibility contract

## Purpose

Keep RC5 compatible with the future People often ask / Answer Page direction without turning the full Answer Engine into an RC5 release dependency.

## Existing authorities

- `05_FAQs` remains the governed FAQ dataset.
- `06_Tips` remains the governed Travel Tips dataset.
- The two datasets must not be merged into a second authority.
- Runtime consumers must continue to fail closed for incomplete or unpublished records.

## Current minimum FAQ contract

Required fields remain:

- `FAQ ID`
- `Category`
- `Question`
- `Answer`
- `Review Status`
- `Publish`

The current Mother also carries airline, fare, bag type, search terms, source reference, priority, review date, notes and product-scope columns. Those remain governed metadata and are intentionally not duplicated into presentation code.

## Current minimum Tips contract

Required fields remain:

- `Tip ID`
- `Category`
- `Title`
- `Tip / Hint`
- `Review Status`
- `Publish`

The current Mother also carries airline, fare, bag type, context trigger, search terms, source reference, priority, review date, notes and product-scope columns.

## RC5 People often ask gateway

The homepage gateway may display up to three Runtime FAQ records only when they are:

1. published;
2. reviewed or approved;
3. structurally complete; and
4. already accepted by the existing FAQ Runtime reader.

The gateway preserves Runtime order. It does not invent questions, dynamically rank demand, or create independent answer content.

## Additive future fields

Future governed Answer Page work may add optional fields such as stable canonical intent/question references, observed-language variants, answer-page references, related-tip references, or display-surface eligibility. RC5 code must tolerate additive columns and must not require these fields to launch.

New fields must reference stable governed IDs rather than duplicate factual truth. Ordinary answer-page publication remains a future governed data/snapshot capability, not a bespoke code deployment per page.

## Travel Tips relationship

Travel Tips remain a separate user-facing capability. A future reviewed relationship may connect:

`Tip -> probable intent -> People often ask -> governed answer`

or the reverse when genuinely useful. RC5 does not automate or publish speculative relationships.

## Non-goals for RC5

RC5 does not require:

- the full Answer/Page Register;
- weighted-intent search;
- dynamic FAQ ranking;
- historic Tip reprocessing;
- Ask WillIt interpretation/ranking;
- automated Tip-to-question mapping; or
- the post-launch analytics learning loop.

The RC5 requirement is extensibility: do not create an architecture that prevents those governed capabilities later.
