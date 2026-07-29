import { Airline, BagType } from "@/types";
import { resolveLimit } from "@/lib/fitCalculator";

export function checkerPreset(
  airline: Airline,
  bagType: BagType,
  fareClass: string | null = null
) {
  return resolveLimit(airline, bagType, fareClass).limit;
}
