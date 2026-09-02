# WillIt Publishing UI V1

Status: build authority for RC6 publishing surfaces.

## Brand boundary

Only `WillItFit` or `WillItFly` branding may be rendered by publishing templates.

Never render or derive page styling from an airline or airport brand. In particular:

- no airline or airport logos;
- no airline livery as a required hero treatment;
- no airline corporate colours;
- no airline-style navigation;
- no airline-owned support widgets;
- no imitation of airline corporate UI.

Airline and airport names are factual entity labels only.

## Visual authority

The supplied reference templates define layout quality, hierarchy and density only.

The shared WillIt publishing language is:

1. WillIt header and navigation.
2. Cinematic photographic hero with left-side copy space.
3. Strong page title, short supporting summary and one primary CTA.
4. White content surface with restrained borders and soft card elevation.
5. Trust/source treatment close to the first facts.
6. Three-up primary fact cards on desktop, stacked responsively on smaller screens.
7. Dense information modules expressed as governed cards, tables and accordions.
8. Clear checker/tool CTA within the content flow.
9. Commercial content only inside governed in-flow slots.
10. Deep navy WillIt footer.

## Ownership rule

Code owns:

- typography hierarchy;
- spacing;
- responsive layout;
- card geometry;
- colours and design tokens;
- component behaviour;
- accessibility;
- loading/error/freshness states;
- commercial slot dimensions and allowed renderers.

Runtime/snapshots own:

- entity facts;
- headings and summaries where the contract allows;
- page sections and order where the contract allows;
- module visibility;
- FAQs;
- source/trust metadata;
- live aviation data;
- commercial activation and content;
- publication state.

Normal Runtime content changes must not require a code deployment.

## Core template composition

### Airline page

Hero -> trust/source -> baggage fact cards -> fare/rule detail -> live disruption summary -> checker CTA -> FAQ -> commercial slots -> source trust.

### Airport parent page

Hero -> current live summary -> airline links -> checker CTA -> terminals -> transport -> parking -> lounges -> hotels -> facilities -> FAQ -> commercial slots -> source trust.

### Airport delay page

Compact hero/identity -> freshness banner -> disruption metrics -> affected flights/events -> cause/confidence -> trend -> contextual help -> commercial slot -> methodology/source trust.

## Hero

Hero imagery must be WillIt-owned/licensed and neutral. The hero component accepts an `assetId`; content entries never provide arbitrary CSS or layout.

Default visual treatment for WillItFit is a dark-left overlay with white copy and a clean neutral aviation/travel image on the right.

## Commercial behaviour

Commercial slots are dormant by default. Missing, invalid, expired, inactive or unsupported Runtime entries render nothing. Facts and tool output never depend on commercial state.

No popups, interstitials, forced video, autoplay audio, countdowns, tool-result blocking or intrusive floating adverts.
