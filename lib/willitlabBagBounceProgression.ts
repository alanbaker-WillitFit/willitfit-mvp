export const BAG_BOUNCE_LEVEL_COUNT = 10;

export type BagBounceLevel = {
  level: number;
  rows: number;
  columns: number;
  ballSpeed: number;
  paddleWidthRatio: number;
  movingRows: boolean;
  heavyBagEvery: number;
  priorityBagCount: number;
  sideConveyors: boolean;
};

export function getBagBounceLevel(level: number): BagBounceLevel {
  const safeLevel = Math.max(1, Math.min(BAG_BOUNCE_LEVEL_COUNT, Math.floor(level)));
  const progress = (safeLevel - 1) / (BAG_BOUNCE_LEVEL_COUNT - 1);

  return {
    level: safeLevel,
    rows: safeLevel <= 2 ? 3 : safeLevel <= 6 ? 4 : 5,
    columns: safeLevel <= 3 ? 6 : safeLevel <= 7 ? 7 : 8,
    ballSpeed: Number((4.1 + progress * 2.4).toFixed(2)),
    paddleWidthRatio: Number((0.28 - progress * 0.08).toFixed(3)),
    movingRows: safeLevel >= 4,
    heavyBagEvery: safeLevel < 5 ? 0 : Math.max(3, 8 - Math.floor((safeLevel - 5) / 2)),
    priorityBagCount: safeLevel < 7 ? 0 : Math.min(4, safeLevel - 6),
    sideConveyors: safeLevel >= 4,
  };
}

export function buildBagBounceProgression(): BagBounceLevel[] {
  return Array.from({ length: BAG_BOUNCE_LEVEL_COUNT }, (_, index) =>
    getBagBounceLevel(index + 1),
  );
}
