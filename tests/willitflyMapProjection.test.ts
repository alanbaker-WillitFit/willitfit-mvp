import { describe, expect, it } from "vitest";
import { projectLatLongToHeroMap } from "@/lib/willitflyMapProjection";
import { getWillItFlyMarkerFrame } from "@/lib/willitflyMarker";

describe("WillItFly hero map projection", () => {
  it("projects Sydney onto the east coast of Australia on A01", () => {
    const point = projectLatLongToHeroMap(-33.8688, 151.2093);
    expect(point).not.toBeNull();
    expect(point!.xPercent).toBeGreaterThan(87);
    expect(point!.xPercent).toBeLessThan(91);
    expect(point!.yPercent).toBeGreaterThan(70);
    expect(point!.yPercent).toBeLessThan(76);
  });

  it("projects Palma onto the western Mediterranean on A01", () => {
    const point = projectLatLongToHeroMap(39.5696, 2.6502);
    expect(point).not.toBeNull();
    expect(point!.xPercent).toBeGreaterThan(49);
    expect(point!.xPercent).toBeLessThan(53);
    expect(point!.yPercent).toBeGreaterThan(35);
    expect(point!.yPercent).toBeLessThan(39);
  });

  it("projects Wales onto Great Britain independently from a country-level pin", () => {
    const point = projectLatLongToHeroMap(52.1307, -3.7837);
    expect(point).not.toBeNull();
    expect(point!.xPercent).toBeGreaterThan(47);
    expect(point!.xPercent).toBeLessThan(51);
    expect(point!.yPercent).toBeGreaterThan(29);
    expect(point!.yPercent).toBeLessThan(33);
  });

  it("fails closed for missing, blank-sentinel or invalid coordinates", () => {
    expect(projectLatLongToHeroMap(null, 2)).toBeNull();
    expect(projectLatLongToHeroMap(52, undefined)).toBeNull();
    expect(projectLatLongToHeroMap(0, 0)).toBeNull();
    expect(projectLatLongToHeroMap(95, 2)).toBeNull();
    expect(projectLatLongToHeroMap(52, 181)).toBeNull();
  });
});

describe("WillItFly location marker cycle", () => {
  it("cycles dull to medium to bright to medium and back to dull", () => {
    expect([0, 1, 2, 3, 4].map(getWillItFlyMarkerFrame)).toEqual([0, 1, 2, 1, 0]);
  });
});
