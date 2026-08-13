import { describe, expect, it } from "vitest";
import {
  currentTimeDifferenceFromUk,
  formatAverageFlightTime,
  formatTimeDifference,
  resolveDefaultOriginFlightTime,
  resolveDestinationTimeZone,
} from "@/lib/willitflyJourneyContext";

describe("WillItFly journey context", () => {
  it("formats governed average flight minutes", () => {
    expect(formatAverageFlightTime(705)).toBe("11h 45m");
    expect(formatAverageFlightTime(120)).toBe("2h");
    expect(formatAverageFlightTime(0)).toBeNull();
  });

  it("selects the UK origin flight record", () => {
    const resolved = resolveDefaultOriginFlightTime([
      { originMarketId: "US", originDisplayName: "United States", destinationId: "JP", averageFlightMinutes: 780 },
      { originMarketId: "UK", originDisplayName: "United Kingdom", destinationId: "JP", averageFlightMinutes: 705 },
    ], "JP");
    expect(resolved?.averageFlightMinutes).toBe(705);
  });

  it("resolves an IANA timezone only from governed destination identity", () => {
    expect(resolveDestinationTimeZone({ timezoneId: "Asia/Tokyo", timezoneMode: "SINGLE" })).toEqual({ timeZone: "Asia/Tokyo", multiple: false });
    expect(resolveDestinationTimeZone({ timezoneId: "Japan Standard Time", timezoneMode: "SINGLE" })).toEqual({ timeZone: null, multiple: false });
    expect(resolveDestinationTimeZone({ timezoneId: undefined, timezoneMode: "SINGLE" })).toEqual({ timeZone: null, multiple: false });
  });

  it("fails closed for multiple-timezone destinations", () => {
    const result = resolveDestinationTimeZone({
      timezoneId: "America/New_York",
      timezoneMode: "MULTIPLE",
    });
    expect(result).toEqual({ timeZone: null, multiple: true });
  });

  it("calculates the DST-aware difference from Europe/London", () => {
    const winter = new Date("2026-01-15T12:00:00Z");
    const summer = new Date("2026-07-15T12:00:00Z");
    expect(currentTimeDifferenceFromUk("Asia/Tokyo", winter)).toBe(540);
    expect(currentTimeDifferenceFromUk("Asia/Tokyo", summer)).toBe(480);
    expect(formatTimeDifference(480)).toBe("+8 hrs from UK");
  });
});
