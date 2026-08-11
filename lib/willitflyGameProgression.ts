export const WILLITFLY_GAME_LEVEL_COUNT = 20;
export const WILLITFLY_GATES_PER_LEVEL = 2;

export type WillItFlyCraftId = 4 | 6 | 2 | 1;

export type WillItFlyGameLevel = {
  level: number;
  craftId: WillItFlyCraftId;
  speed: number;
  gateGapRatio: number;
  movingGate: boolean;
  movementAmplitudeRatio: number;
  movementRate: number;
  collectibleOffsetRatio: number;
  gatesRequired: number;
};

export function craftForLevel(level: number): WillItFlyCraftId {
  if (level <= 4) return 4;
  if (level <= 9) return 6;
  if (level <= 14) return 2;
  return 1;
}

export function getWillItFlyGameLevel(level: number): WillItFlyGameLevel {
  const safeLevel = Math.max(1, Math.min(WILLITFLY_GAME_LEVEL_COUNT, Math.floor(level)));
  const progress = (safeLevel - 1) / (WILLITFLY_GAME_LEVEL_COUNT - 1);

  return {
    level: safeLevel,
    craftId: craftForLevel(safeLevel),
    speed: Number((2.75 + progress * 2.25).toFixed(3)),
    gateGapRatio: Number((0.34 - progress * 0.13).toFixed(3)),
    movingGate: safeLevel >= 5,
    movementAmplitudeRatio: safeLevel < 5 ? 0 : Number((0.035 + progress * 0.095).toFixed(3)),
    movementRate: safeLevel < 5 ? 0 : Number((0.65 + progress * 1.1).toFixed(3)),
    collectibleOffsetRatio: safeLevel <= 4 ? 0 : Number((0.015 + progress * 0.105).toFixed(3)),
    gatesRequired: WILLITFLY_GATES_PER_LEVEL,
  };
}

export function buildWillItFlyGameProgression(): WillItFlyGameLevel[] {
  return Array.from({ length: WILLITFLY_GAME_LEVEL_COUNT }, (_, index) =>
    getWillItFlyGameLevel(index + 1),
  );
}
