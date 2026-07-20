# RC3 Issue Register

| ID | Severity | Status | Issue | Resolution/evidence |
|---|---|---|---|---|
| I-001 | AMBER | RESOLVED | Navigation did not expose every RC3 destination in the specified hierarchy. | Desktop and mobile primary navigation now expose all seven specified destinations within two interactions. |
| I-002 | AMBER | RESOLVED | The outcome was rendered as a separate result card rather than one explicit page module. | One stateful parent now contains inputs, allowance, result and next steps; production build passes. |
| I-003 | AMBER | RESOLVED | Legal, privacy and accessibility footer destinations were absent. | Dedicated routes, metadata, sitemap entries and footer links added; 34-page build passes. |
| I-004 | AMBER | RESOLVED | Lab was separately packaged but not integrated through an approved discovery path. | Static RC0.4 integrated beneath `/lab/`, linked subtly from navigation/About/footer and protected by isolation tests. |
| I-005 | AMBER | OPEN | Windows-hosted OpenNext certification needs a reproducible supported execution path. | OpenNext's Windows warning and repeatable esbuild path-resolution failure are captured; execute `build:cloudflare` and `deploy:dry-run` in Linux/WSL CI before release approval. |
| I-006 | AMBER | MONITOR | Local throttled Lighthouse reports variable CPU-bound TBT (1.07 s certified run); navigation Lighthouse cannot measure field INP. | No third-party chain, image issue or unused CSS was found. Capture production Core Web Vitals/INP after deployment before considering further optimisation. |
| I-007 | LAUNCH GATE | OPEN | Product Owner physical-device UAT is not yet executed. | Execute and sign `RC3_UAT_CHECKLIST.md` before public launch. |
| I-008 | LAUNCH GATE | OPEN | Production deployment, rollback exercise and monitoring ownership are not yet verified. | Complete and sign `RC3_PRODUCTION_READINESS_CHECKLIST.md` before final GO. |
