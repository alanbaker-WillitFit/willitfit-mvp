import { describe, expect, it } from "vitest";
import { projectLatLongToHeroMap } from "@/lib/willitflyMapProjection";
import { getWillItFlyMarkerFrame } from "@/lib/willitflyMarker";

describe("WillItFly hero map projection", () => {
  it("projects Sydney into the south-east map quadrant", () => {
    const point = projectLatLongToHeroMap(-33.8688, 151.2093);
    expect(point).not.toBeNull();
    expect(point!.xPercent).toBeGreaterThan(85);
    expect(point!.xPercent).toBeLessThan(95);
    expect(point!.yPercent).toBeGreaterThan(65);
    expect(point!.yPercent).toBeLessThan(80);
  });

  it("projects Palma near the centre-right of Europe", () => {
    const point = projectLatLongToHeroMap(39.5696, 2.6502);
    expect(point).not.toBeNull();
    expect(point!.xPercent).toBeGreaterThan(48);
    expect(point!.xPercent).toBeLessThan(57);
    expect(point!.yPercent).toBeGreaterThan(27);
    expect(point!.yPercent).toBeLessThan(36);
  });

  it("projects Wales independently from a country-level pin", () => {
    const point = projectLatLongToHeroMap(52.1307, -3.7837);
    expect(point).not.toBeNull();
    expect(point!.xPercent).toBeGreaterThan(47);
    expect(point!.xPercent).toBeLessThan(55);
    expect(point!.yPercent).toBeGreaterThan(20);
    expect(point!.yPercent).toBeLessThan(30);
  });

  it("fails closed for missing or invalid coordinates", () => {
    expect(projectLatLongToHeroMap(null, 2)).toBeNull();
    expect(projectLatLongToHeroMap(52, undefined)).toBeNull();
    expect(projectLatLongToHeroMap(95, 2)).toBeNull();
    expect(projectLatLongToHeroMap(52, 181)).toBeNull();
  });
});

describe("WillItFly location marker cycle", () => {
  it("cycles dull to medium to bright to medium and back to dull", () => {
    expect([0, 1, 2, 3, 4].map(getWillItFlyMarkerFrame)).toEqual([0, 1, 2, 1, 0]);
  });
});
