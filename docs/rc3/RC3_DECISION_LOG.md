# RC3 Decision Log

| ID | Decision | Basis | Effect |
|---|---|---|---|
| D-001 | Use certified RC2.59 as the sole RC3 code baseline. | Section 1 requires preservation of RC2 business logic. | Prevents parallel-baseline drift. |
| D-002 | Implement all ten sections on one feature branch with a logical commit at each passing gate. | The directive requires sequential delivery and feature branches. | Traceable, reversible changes. |
| D-003 | Govern existing RC2.37 visual values rather than inventing a new palette. | Evolution, Never Revolution. | No visual redesign; tokens become explicit. |
| D-004 | Retain static exported content as the primary runtime source. | Current architecture is deterministic and Cloudflare-friendly. | No new live-sheet dependency. |
| D-005 | Link WillIt Lab navigation to the isolated About-page entry until its Section 7 route is certified. | Section 4 requires a valid destination; Section 7 governs the experiment itself. | No dead route and no premature Lab runtime dependency. |
| D-006 | Publish WillItFly as static `/lab/` assets behind a small Next.js boundary page. | Static isolation gives the strongest failure and bundle boundary while preserving the offline PWA. | Lab cannot import or delay the checker; its service worker scope remains local. |
| D-007 | Use existing darker design tokens for the four Lighthouse-proven contrast failures. | Restores WCAG contrast without changing layout, hierarchy or product styling. | The certified rerun contains zero contrast failures and scores Accessibility 100. |
| D-008 | Disable streamed metadata for all user agents and reuse the existing logo as the icon. | Metadata must remain discoverable to HTML-limited and AI crawlers. | Lighthouse SEO and Best Practices both reach 100 without a new asset. |
| D-009 | Treat Windows OpenNext failure as an environment gate, not an application rewrite trigger. | OpenNext formally warns about Windows and the repeat failure persisted after drive-read permission. | Linux/WSL CI is the minimum corrective path before release approval. |
| D-010 | Keep the existing Cloudflare Worker target name while versioning the package as 3.0.0. | Renaming the Worker can create an unintended parallel production service. | RC3 remains a controlled upgrade of the certified deployment target. |
