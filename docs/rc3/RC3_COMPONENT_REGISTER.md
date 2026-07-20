# RC3 Component Register

| Area | Components | Responsibility |
|---|---|---|
| Shell | `Header`, `Footer`, `NavDropdown`, `Breadcrumbs`, `PolicyPage` | Global navigation, orientation and product framing |
| Decision | `DimensionForm`, `AirlineSelector`, `AllowancePreview`, `BagVisualizer` | Traveller input and allowance context |
| Outcome | `FitResultCard`, `StatusIcon`, `ResultQuestions`, `ResultRecommendation` | PASS/CLOSE/FAIL decision and governed next steps |
| Guidance | `AdvisoryPanels`, `AirlineGuidance`, `FAQSection`, `TrustBadgeRow` | Supporting knowledge and confidence |
| Discovery | `AskWillItFitSearch`, `AirlineCard`, `TravelTipCard`, `AirlineSeoHub` | Search and content discovery |
| Commercial | `AffiliateCard` | Clearly disclosed, optional recommendation |
| Page composition | `AirlinePage`, `HeroIllustration` | Shared page-level presentation |

All registered components were traced to imports or routes before inclusion. Removal requires a full-codebase reference check and runtime evidence.
