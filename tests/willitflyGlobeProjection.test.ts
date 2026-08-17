import { describe, expect, it } from "vitest";
import {
  getGlobeOrientation,
  getTexturePosition,
  hasGovernedGlobeCoordinate,
  projectCoordinateToGlobe,
} from "@/lib/willitflyGlobeProjection";

describe("WillItFly globe projection", () => {
  it("fails closed for blank, invalid and 0,0 coordinates", () => {
    expect(hasGovernedGlobeCoordinate(null, null)).toBe(false);
    expect(hasGovernedGlobeCoordinate(undefined, 10)).toBe(false);
    expect(hasGovernedGlobeCoordinate(91, 10)).toBe(false);
    expect(hasGovernedGlobeCoordinate(10, 181)).toBe(false);
    expect(hasGovernedGlobeCoordinate(0, 0)).toBe(false);
    expect(getGlobeOrientation(null, null)).toBeNull();
  });

  it("centres the selected governed destination on the visible face", () => {
    const orientation = getGlobeOrientation(51.5074, -0.1278);
    const point = projectCoordinateToGlobe(
      { latitude: 51.5074, longitude: -0.1278 },
      orientation,
    );

    expect(point).not.toBeNull();
    expect(point?.visible).toBe(true);
    expect(point?.xPercent).toBeCloseTo(50, 5);
    expect(point?.yPercent).toBeCloseTo(50, 5);
  });

  it("marks points on the far side of the globe as hidden", () => {
    const orientation = getGlobeOrientation(0, 10);
    const point = projectCoordinateToGlobe(
      { latitude: 0, longitude: -170 },
      orientation,
    );

    expect(point).not.toBeNull();
    expect(point?.visible).toBe(false);
  });

  it("derives deterministic texture positions from governed coordinates", () => {
    const orientation = getGlobeOrientation(35.6762, 139.6503);
    expect(getTexturePosition(orientation)).toEqual({
      xPercent: ((139.6503 + 180) / 360) * 100,
      yPercent: 50 - 35.6762 * 0.16,
    });
  });
});
