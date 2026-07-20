# RC3 Route Register

| Route | Purpose | Runtime source |
|---|---|---|
| `/` | Unified cabin-bag decision journey | airlines, recommendations, FAQs, tips |
| `/airlines` | Airline directory | airline exports |
| `/airlines/[slug]` | Airline policy detail | airline page exports |
| `/ask` | Predictive question discovery | knowledge exports |
| `/ask/[slug]` | Answer detail | knowledge exports |
| `/tips` | Travel-tips directory | tips exports |
| `/tips/[slug]` | Travel-tip detail | tips exports |
| `/about` | Product purpose and trust | application content |
| `/products` | Product recommendations | affiliate exports |
| `/contact` | Contact route | application content |
| `/privacy` | Privacy statement | application content |
| `/accessibility` | Accessibility statement and recovery contact | application content |
| `/legal` | Terms, airline-policy and affiliate notices | application content |
| `/lab` | Optional Lab boundary and WillItFly launch | application content + isolated static assets |
| `/lab/index.html` | WillItFly RC0.4 offline-only PWA | `public/lab/` only |
| `/[slug]` | Governed SEO landing pages | SEO page exports |
| `/api/recommendations` | Recommendation lookup | recommendation service |
| `/robots.txt`, `/sitemap.xml` | Search-engine controls | generated metadata routes |
| `/diagnostics` | Operational diagnostics | diagnostics service |

Dynamic slugs are protected by `lib/routingCollisions.ts`; new static routes must be added to that collision contract.
