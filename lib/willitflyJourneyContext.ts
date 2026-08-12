import type { RuntimeDestinationFact } from "@/lib/willitflyCards";
import type { WillItFlyTravelTime } from "@/services/willitflyRuntime";

export const WILLITFLY_DEFAULT_ORIGIN_MARKET_ID = "UK";
export const WILLITFLY_DEFAULT_ORIGIN_LABEL = "UK";
export const WILLITFLY_DEFAULT_ORIGIN_TIME_ZONE = "Europe/London";

const TIME_ZONE_FACT_KEYS = new Set([
  "IANA_TIMEZONE",
  "IANA_TIME_ZONE",
  "TIMEZONE_IANA",
  "TIME_ZONE_IANA",
  "TIMEZONE",
  "TIME_ZONE",
]);

const MULTI_TIME_ZONE_FACT_KEYS = new Set([
  "MULTIPLE_TIMEZONES",
  "MULTIPLE_TIME_ZONES",
  "TIMEZONE_COUNT",
  "TIME_ZONE_COUNT",
]);

function isValidIanaTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: value }).format(new Date());
    return value.includes("/") || value === "UTC";
  } catch {
    return false;
  }
}

function indicatesMultipleTimeZones(fact: RuntimeDestinationFact): boolean {
  const key = fact.factKey.trim().toUpperCase();
  if (!MULTI_TIME_ZONE_FACT_KEYS.has(key)) return false;
  const value = fact.factValue.trim().toLowerCase();
  if (["yes", "true", "multiple"].includes(value)) return true;
  const count = Number(value);
  return Number.isFinite(count) && count > 1;
}

export function resolveDestinationTimeZone(
  facts: RuntimeDestinationFact[],
  destinationId: string,
): { timeZone: string | null; multiple: boolean } {
  const destinationFacts = facts.filter((fact) => fact.destinationId === destinationId);
  if (destinationFacts.some(indicatesMultipleTimeZones)) return { timeZone: null, multiple: true };

  for (const fact of destinationFacts) {
    const key = fact.factKey.trim().toUpperCase();
    if (!TIME_ZONE_FACT_KEYS.has(key)) continue;
    const candidate = fact.factValue.trim();
    if (/[|,;]/.test(candidate)) return { timeZone: null, multiple: true };
    if (isValidIanaTimeZone(candidate)) return { timeZone: candidate, multiple: false };
  }

  return { timeZone: null, multiple: false };
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
): number | null {
  const originOffset = timeZoneOffsetMinutes(WILLITFLY_DEFAULT_ORIGIN_TIME_ZONE, instant);
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
