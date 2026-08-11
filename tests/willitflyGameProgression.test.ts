import { describe, expect, it } from "vitest";
import {
  WILLITFLY_GAME_LEVEL_COUNT,
  WILLITFLY_GATES_PER_LEVEL,
  buildWillItFlyGameProgression,
  craftForLevel,
  getWillItFlyGameLevel,
} from "../lib/willitflyGameProgression";

describe("WillItFly 20-level game progression", () => {
  it("defines exactly 20 progressively harder levels", () => {
    const levels = buildWillItFlyGameProgression();
    expect(levels).toHaveLength(20);
    expect(WILLITFLY_GAME_LEVEL_COUNT).toBe(20);
    expect(levels.every((level) => level.gatesRequired === WILLITFLY_GATES_PER_LEVEL)).toBe(true);
    for (let index = 1; index < levels.length; index += 1) {
      expect(levels[index].speed).toBeGreaterThan(levels[index - 1].speed);
      expect(levels[index].gateGapRatio).toBeLessThan(levels[index - 1].gateGapRatio);
    }
  });

  it("uses the locked craft bands", () => {
    for (let level = 1; level <= 4; level += 1) expect(craftForLevel(level)).toBe(4);
    for (let level = 5; level <= 9; level += 1) expect(craftForLevel(level)).toBe(6);
    for (let level = 10; level <= 14; level += 1) expect(craftForLevel(level)).toBe(2);
    for (let level = 15; level <= 20; level += 1) expect(craftForLevel(level)).toBe(1);
  });

  it("introduces moving gates from level 5 and offsets collectibles only after the opening band", () => {
    expect(getWillItFlyGameLevel(4).movingGate).toBe(false);
    expect(getWillItFlyGameLevel(4).collectibleOffsetRatio).toBe(0);
    expect(getWillItFlyGameLevel(5).movingGate).toBe(true);
    expect(getWillItFlyGameLevel(5).movementAmplitudeRatio).toBeGreaterThan(0);
    expect(getWillItFlyGameLevel(5).collectibleOffsetRatio).toBeGreaterThan(0);
  });

  it("clamps invalid level requests into the governed 1-20 range", () => {
    expect(getWillItFlyGameLevel(-10).level).toBe(1);
    expect(getWillItFlyGameLevel(99).level).toBe(20);
  });
});
