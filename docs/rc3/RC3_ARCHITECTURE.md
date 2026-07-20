# RC3 Architecture Baseline

Status: accepted baseline for Sections 1–2  
Source: certified RC2.59 build at commit `98e96d4`

## Runtime

WillItFit is a Next.js 15 App Router application using React 19 and strict TypeScript. Pages and route handlers live in `app/`; reusable UI lives in `components/`; pure decision logic lives in `lib/`; workbook-backed content access lives in `services/`; stateful form behaviour lives in `hooks/`.

The application is built for Cloudflare by OpenNext. `wrangler.jsonc` binds the generated static assets and worker entry point. Runtime content is exported to `data/*.json`; Google Sheets access is a controlled fallback, not the primary page-render dependency.

## Dependency direction

`app → components → hooks/lib/services → data`

- UI components may consume typed services and pure decision functions.
- Business rules remain in `lib/fitCalculator.ts` and related presentation adapters.
- Data access remains isolated in `services/`.
- The Lab remains a static, separately versioned experience and must not become a dependency of the core decision journey.
- No RC2 business rule may change without an explicit RC3 specification requirement and decision-log entry.

## Rendering and resilience

- App Router server components are the default; client components are used only for interaction.
- Root, not-found and error boundaries provide safe failure states.
- Static content exports support deterministic builds and Cloudflare caching.
- Affiliate and recommendation failures must degrade to useful non-commercial guidance.

## Design governance

Brand values, typography, radius, shadow and motion values are governed in `tokens/designTokens.ts` for Tailwind and `styles/tokens.css` for runtime CSS variables. `app/globals.css` defines reusable product primitives using those variables. RC2.37 locked colours are preserved.

## Security and privacy boundaries

The checker does not require personal data. External content and affiliate URLs are treated as untrusted inputs and validated in the service layer. Secrets belong in environment bindings and are never committed. Diagnostics must not expose credentials or raw private configuration.
