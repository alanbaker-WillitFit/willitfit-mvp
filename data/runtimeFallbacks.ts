import type { Airline, TravelTip } from "@/types";

// RC5 core runtime fails closed. If the isolated runtime cannot be read or its
// schema is invalid, the checker and travel-tip modules receive no embedded or
// RC4-era records. Deferred editorial modules retain their existing fallback
// until each receives an approved RC5 runtime contract.
export const FALLBACK_AIRLINES: Airline[] = [];
export const FALLBACK_TIPS: TravelTip[] = [];
export { FALLBACK_RUNTIME_CONTENT } from "./runtimeContent";
