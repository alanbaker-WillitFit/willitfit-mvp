# RC2.56 Changelog — Ask WillItFit Foundation

## Added
- Dedicated `/ask` question-search route mirroring the core tool page architecture.
- Predictive, controlled search over validated knowledge objects.
- Direct indexable answer routes at `/ask/[slug]` for SEO and AI referrals.
- Quick answer, detailed explanation, evidence/review block, related questions, and checker return path.
- Desktop and mobile `Ask WillItFit` navigation entry.
- Ask and answer routes included in sitemap generation.

## Architecture
- Added `services/knowledge.ts` as an interim typed knowledge source.
- RC14 remains the intended authoritative source; static seed objects make the feature testable before runtime-sheet integration.
- Search deliberately funnels users to available answers and provides a controlled fallback rather than generating unsupported answers.
