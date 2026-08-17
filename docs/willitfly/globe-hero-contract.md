# WillItFly RC1 Globe Hero Contract

Status: RC1 implementation contract

## Governing direction

The flat-map-first hero is superseded by a premium white interactive globe. Search remains the primary interaction. The globe is a presentation layer over governed destination data; it does not create or repair destination geography.

## Data boundary

- Mother remains the governed source of destination identity and geography.
- Cockpit controls publication/withdrawal.
- Runtime is delivery-only.
- Build consumes Runtime latitude/longitude only.
- Missing, blank, malformed or 0,0 sentinel coordinates fail closed.
- Build must not invent destination coordinates, capitals or fallback geography.

## Hero behaviour

1. Neutral state shows the white globe and the message `Know before you fly.`
2. User searches by destination name or governed alias.
3. A resolved destination with valid coordinates becomes the globe focus.
4. The selected destination receives the primary marker.
5. Changing destination resets journey mode and additional stops.
6. Journey routes appear only when `More journey options` is explicitly opened.
7. When governed coordinates are missing, destination identity can remain available but no false location is plotted.

## Visual contract

- Near-white/off-white environment.
- White globe with restrained depth, relief and shadow.
- Monochrome geography; no blue ocean treatment.
- Minimal-radius controls and cards.
- Strong black/navy typography.
- Green reserved for meaningful WillIt interaction/status emphasis.
- Generous whitespace.
- No decorative map labels or cartographic clutter.
- Desktop globe composition intentionally leaves room for search and destination identity surfaces.
- Mobile/tablet use purpose-built framing rather than scaled desktop geometry.

## Motion and accessibility

- Rotation/texture transition must be restrained.
- `prefers-reduced-motion` reduces the transition to effectively immediate state change.
- Search and destination navigation remain functional if the globe has no valid coordinates.
- Globe content is supplementary; semantic destination information remains in ordinary HTML.

## Journey mode

Normal destination mode shows only the selected destination marker. Origin, extra stops and route lines are permitted only in explicit journey mode. Hidden-side journey points are not drawn as if they were visible on the front hemisphere.

## Rendering technology

WebGL is optional, not mandatory. RC1 prioritises reliability, deterministic behaviour, progressive enhancement and acceptable mobile performance. The current lightweight implementation uses the governed flat relief asset as a restrained spherical texture and applies deterministic orthographic point projection. A later renderer may replace the visual engine without changing the data contract.

## Certification gate

Before RC1 sign-off, verify:

- exact branch HEAD;
- lint/build/test pass;
- globe projection tests pass;
- blank coordinate regression remains fail-closed;
- desktop visual smoke test;
- tablet visual smoke test;
- mobile portrait and landscape smoke tests;
- reduced-motion behaviour;
- search remains usable when coordinates are absent;
- normal destination selection never displays journey routes;
- journey mode does not leak between destinations;
- Lab certification remains a separate required gate and is not implied by globe certification.
