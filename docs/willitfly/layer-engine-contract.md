# WillItFly RC1 Layer Engine Contract

Status: ACTIVE BUILD CONTRACT / NOT YET UI-CERTIFIED

## Governing model

WillItFly supports a maximum of four content layers. Each layer can expose a maximum of ten governed cards. These are capacity ceilings, not content targets.

RC1 is expected to use two layers for many destinations. Layers 3 and 4 exist as governed growth capacity and must not be populated merely to fill depth.

## Runtime ownership

Runtime tables:

- `04.3_Layer_Contracts` defines the supported layer depths, role, maximum card count, publication mode and fallback behaviour.
- `04.4_Layer_Cards` defines the actual cards eligible for each layer.

A layer card carries, at minimum:

- `Layer_Card_ID`
- `Layer_ID`
- `Destination_ID`
- `Topic_ID`
- `Position`
- `Card_Type`
- `Content_Ref_ID`
- `Card_Title`
- `Summary`
- `Visual_Asset_ID`
- `Visual_Mode`
- `Target_Layer_ID`
- `Target_Route_Key`
- `Active`
- `Review_Status`
- `Publish`
- `Display_Order`

## Universal card rules

1. FACT and PRODUCT cards participate in the same numbered sequence.
2. Positions are governed values from 1 to 10.
3. Build does not manufacture blank slots.
4. Only eligible, active, reviewed and `Publish=Yes` cards render.
5. If three cards are publishable, exactly three cards display.
6. Build sorts governed cards deterministically and caps output at ten.
7. A card may optionally point to a deeper governed layer or route.
8. Build never creates a deeper layer merely because the engine supports four levels.

## Visual fallback

If a selected card or layer has an approved `Visual_Asset_ID`, Build may render that governed dedicated visual.

If there is no approved dedicated visual, Build must use the destination map treatment as the visual fallback. That fallback preserves:

- the approved world map asset,
- the governed destination pin where valid latitude/longitude exists,
- the persistent Location Identity treatment,
- selected place,
- applicable region,
- country,
- governed flag.

Missing or invalid coordinates suppress only the pin. Build must not substitute a generic image or invent geographic placement.

## Commercial/product cards

PRODUCT is a card type, not a separate rendering pipeline. A PRODUCT card occupies an ordinary governed position in the layer sequence and is shown only when its own publication rules pass.

Selecting a PRODUCT card may open a deeper governed Product Experience layer. Merchant exit is separate from the layer-card selection and remains governed through the commercial data contract.

Factual and commercial source data remain separately governed even though FACT and PRODUCT cards share the same presentation sequence.

## Build implementation

`lib/willitflyLayerEngine.ts` defines:

- maximum layer/card constants,
- typed Runtime layer-card records,
- publication eligibility,
- deterministic published-card resolution,
- visual asset versus map-fallback resolution,
- governed deeper-layer target detection.

`tests/willitflyLayerEngine.test.ts` covers the core contract, including published-only compact rendering, FACT/PRODUCT parity and map fallback.

## Workstream boundaries

Mother alignment and Cockpit publication/operational mapping are intentionally separate workstreams. They must consume the locked Runtime/Build contract later rather than being improvised inside this Build thread.

This Build change does not modify Mother or Cockpit.

## Verification state

The Runtime schema and Build layer-engine foundation are committed. Local type-check, lint, Vitest, Next.js build and visual UI integration have not yet been executed for this layer-engine change. Do not represent the layer system as UI-certified until those gates pass.
