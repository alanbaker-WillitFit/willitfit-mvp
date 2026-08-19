# RC6 CI Observability — 2026-08-19

Purpose: make RC6 certification evidence directly observable through GitHub Actions without touching `main` or frozen RC5.

- RC6 build branch: `rc6-build-audit-20260819`
- Certification-only PR base: `rc6-certification-base-20260819`
- Workflow: `.github/workflows/rc6-certification.yml`
- The certification base is not a release or merge target.
- Draft PR runs are evidence channels only and must not be merged into the certification base as a release action.
- RC6 certification remains: projection contract → type-check → lint → tests → production build.
