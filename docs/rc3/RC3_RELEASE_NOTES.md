# WillItFit RC3.0 Release Notes

Status: release candidate for Product Owner UAT; not yet production-approved.

## What changed

- Unified the checker, allowance, answer and next steps into one Decision Module while retaining RC2 calculation logic.
- Added governed navigation and discovery across airlines, Ask WillItFit, tips, products, About and Lab.
- Consolidated the existing design into documented tokens and reusable component states.
- Improved keyboard, focus, responsive, reduced-motion and non-colour accessibility behaviour.
- Integrated WillItFly RC0.4 as an isolated optional offline Lab experience.
- Corrected evidenced contrast defects and ensured metadata remains in the document head for all crawlers.
- Added regression, QA, accessibility, performance, UAT and production-readiness evidence.

## Compatibility

- Canonical production Mother schema is unchanged.
- RC2 airline, question, status, fit and affiliate contracts are preserved.
- Worker target remains `willitfit-mvp-rc1` to avoid creating an unintended parallel production service.

## Known conditions

- Cloudflare/OpenNext must be built and dry-run in Linux/WSL because the adapter warns about Windows and fails before config compilation on this host.
- Product Owner device UAT and final approval are pending.
- Field INP and other production Web Vitals require post-deployment monitoring.
