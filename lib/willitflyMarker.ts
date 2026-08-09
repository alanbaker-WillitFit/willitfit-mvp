export const WILLITFLY_LOCATION_MARKER_SEQUENCE = [0, 1, 2, 1] as const;

export const WILLITFLY_LOCATION_MARKER_FRAME_MS = 500;

/**
 * Returns the zero-based marker frame for a sequence step.
 * Sequence is deliberately symmetric: dull -> medium -> bright -> medium -> dull.
 */
export function getWillItFlyMarkerFrame(step: number): number {
  if (!Number.isFinite(step)) return 0;
  const normalized = Math.abs(Math.trunc(step)) % WILLITFLY_LOCATION_MARKER_SEQUENCE.length;
  return WILLITFLY_LOCATION_MARKER_SEQUENCE[normalized] ?? 0;
}
