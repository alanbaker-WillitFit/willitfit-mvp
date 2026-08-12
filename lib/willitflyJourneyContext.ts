import type { WillItFlyDestination, WillItFlyTravelTime } from "@/services/willitflyRuntime";

export const WILLITFLY_DEFAULT_ORIGIN_MARKET_ID = "UK";
export const WILLITFLY_DEFAULT_ORIGIN_LABEL = "UK";
export const WILLITFLY_DEFAULT_ORIGIN_TIME_ZONE = "Europe/London";

function isValidIanaTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: value }).format(new Date());
    return value.includes("/") || value === "UTC";
  } catch {
    return false;
  }
}

export function resolveDestinationTimeZone(
  destination: Pick<WillItFlyDestination, "timezoneId" | "timezoneMode">,
): { timeZone: string | null; multiple: boolean } {
  if (destination.timezoneMode === "MULTIPLE") return { timeZone: null, multiple: true };

  const candidate = String(destination.timezoneId ?? "").trim();
  if (!candidate) return { timeZone: null, multiple: false };
  if (!isValidIanaTimeZone(candidate)) return { timeZone: null, multiple: false };
  return { timeZone: candidate, multiple: false };
}

export function resolveDefaultOriginFlightTime(
  travelTimes: WillItFlyTravelTime[],
  destinationId: string,
): WillItFlyTravelTime | null {
  const candidates = travelTimes.filter((item) => item.destinationId === destinationId);
  return candidates.find((item) => ["UK", "GB", "GBR"].includes(item.originMarketId.trim().toUpperCase())) ?? null;
}

export function formatAverageFlightTime(minutes: number): string | null {
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  if (hours === 0) return `${remainder}m`;
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}

function timeZoneOffsetMinutes(timeZone: string, instant: Date): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(instant);

    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const asUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );
    const instantAtSecond = Math.floor(instant.getTime() / 1000) * 1000;
    return Math.round((asUtc - instantAtSecond) / 60000);
  } catch {
    return null;
  }
}

export function currentTimeDifferenceFromUk(
  destinationTimeZone: string,
  instant: Date = new Date(),
  originTimeZone: string = WILLITFLY_DEFAULT_ORIGIN_TIME_ZONE,
): number | null {
  const originOffset = timeZoneOffsetMinutes(originTimeZone, instant);
  const destinationOffset = timeZoneOffsetMinutes(destinationTimeZone, instant);
  if (originOffset === null || destinationOffset === null) return null;
  return destinationOffset - originOffset;
}

export function formatTimeDifference(minutes: number): string {
  if (minutes === 0) return "Same time as UK";
  const sign = minutes > 0 ? "+" : "−";
  const absolute = Math.abs(minutes);
  const hours = Math.floor(absolute / 60);
  const remainder = absolute % 60;
  const value = remainder === 0 ? `${hours} hr${hours === 1 ? "" : "s"}` : `${hours}h ${remainder}m`;
  return `${sign}${value} from UK`;
}
