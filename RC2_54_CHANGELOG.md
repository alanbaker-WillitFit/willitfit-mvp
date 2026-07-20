# RC2.54 — Launch Hardening

## Changes

- Replaced unnecessary fully dynamic rendering on the homepage, airline directory, tips, tip detail, and products routes with one-hour route revalidation.
- Disabled `/diagnostics` in production unless `ENABLE_DIAGNOSTICS=true` is explicitly configured.
- Reduced diagnostics error disclosure to a safe generic state.
- Added cross-resource airline/SEO slug collision reporting to diagnostics.
- Changed public routing to fail closed when an airline and SEO page share a slug.
- Added a shared safe JSON-LD serializer and applied it to all structured-data script blocks.
- Aligned React and React DOM type packages with React 19.
- Preserved the deployed Cloudflare Worker name `willitfit-mvp-rc1`.
- Added regression tests for JSON-LD escaping and routing collisions.
