# RC6 CI Observability — 2026-08-19

Purpose: make RC6 certification evidence directly observable through GitHub Actions without changing product code, Runtime, deployment configuration, or frozen RC5.

- RC6 build branch: `rc6-build-audit-20260819`
- Certification-only PR base: `rc6-certification-base-20260819`
- Workflow: `.github/workflows/rc6-certification.yml`
- The same RC6-scoped workflow is registered on `main` solely for GitHub Actions discovery; it does not run on ordinary `main` pushes.
- The certification base is not a release or merge target.
- Draft PR runs are evidence channels only and must not be merged into the certification base as a release action.
- RC6 certification remains: projection contract → type-check → lint → tests → production build.
- 2026-08-19 17:34 BST: repository Actions policy confirmed enabled; fresh RC6 push issued to trigger certification evidence.
