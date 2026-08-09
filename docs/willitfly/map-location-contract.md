# WillItFly RC1 Map Location Contract

Status: RC1-DRAFT-0.2 build/runtime co-evolution

## Authority split

- Runtime owns destination geographic truth: `Destination_ID`, `Latitude`, `Longitude`.
- Build owns projection from latitude/longitude to the A01 hero map.
- The hero asset calibration belongs to the build and must not be duplicated as per-destination X/Y values in Runtime.
- Missing or invalid coordinates fail closed: render A01 without a marker.
- Cockpit is not changed until the Runtime contract stabilises and is locked.

## Runtime fields

`02_Destinations` already contains `Latitude` and `Longitude`. These fields are now explicitly traced in `91_Field_Map` as direct mappings from Mother `11.2_Destinations` and are required for WF058/WF065 map positioning.

## Build files

- `lib/willitflyMapProjection.ts` — calibrated A01 projection.
- `lib/willitflyMarker.ts` — marker frame cycle.
- `lib/willitflyAssets.ts` — production asset paths.
- `components/fly/DestinationMap.tsx` — responsive map + marker component.
- `components/fly/DestinationMap.module.css` — fixed marker display geometry.
- `tests/willitflyMapProjection.test.ts` — projection/fail-closed/frame-cycle checks.

## Asset paths

The local production build should place the approved assets at:

- `/public/assets/fly/map/willitfly-hero-world-map.png`
- `/public/assets/fly/markers/location-marker-1.jpeg`
- `/public/assets/fly/markers/location-marker-2.jpeg`
- `/public/assets/fly/markers/location-marker-3.png`

The three marker source assets remain unaltered. The component renders all frames at one CSS size and cycles `1 -> 2 -> 3 -> 2 -> 1` using a 500 ms frame interval. Reduced-motion users receive a static middle frame.

## Calibration

A01 source dimensions are 1264 x 843. `WILLITFLY_HERO_MAP_CALIBRATION_V1` describes the geographic plate inside the image. It is deliberately build-owned and versioned. Visual calibration must be verified with widely separated governed locations before RC1 lock; recommended sentinels are Sydney, Palma/Mallorca, Wales, Tokyo and a North American location.

## Acceptance criteria

1. Search resolves a destination record by stable ID/slug.
2. Runtime provides finite latitude and longitude.
3. Projection returns a percentage-based point within A01.
4. Marker remains centered on that point at desktop and mobile widths.
5. Marker frames render at identical CSS dimensions.
6. Missing/invalid coordinates suppress the marker, never guess.
7. Reduced-motion suppresses blinking.
8. No WillItFit Runtime or Mother fallback is used by the WillItFly map component.
