import { Airline, TravelTip } from "@/types";

/**
 * IMPORTANT: This is not a second data source. It exists solely so the
 * site degrades gracefully (per the error-handling requirement) if the
 * Google Sheet is unreachable, mis-configured, or temporarily empty.
 * The Sheet remains the single source of truth in all normal operation —
 * see services/airlines.ts for the fallback trigger logic.
 */

export const FALLBACK_AIRLINES: Airline[] = [
  {
    airlineId: "fallback-1",
    airlineName: "Ryanair",
    slug: "ryanair",
    country: "Ireland",
    logoUrl: "",
    personalItem: { heightCm: 40, widthCm: 20, depthCm: 25 },
    cabinBag: { heightCm: 55, widthCm: 40, depthCm: 20 },
    weightLimitKg: 10,
    websiteUrl: "https://www.ryanair.com",
    lastUpdated: "fallback",
    status: "Live",
  },
  {
    airlineId: "fallback-2",
    airlineName: "easyJet",
    slug: "easyjet",
    country: "United Kingdom",
    logoUrl: "",
    personalItem: { heightCm: 45, widthCm: 36, depthCm: 20 },
    cabinBag: { heightCm: 56, widthCm: 45, depthCm: 25 },
    weightLimitKg: 15,
    websiteUrl: "https://www.easyjet.com",
    lastUpdated: "fallback",
    status: "Live",
  },
  {
    airlineId: "fallback-3",
    airlineName: "British Airways",
    slug: "british-airways",
    country: "United Kingdom",
    logoUrl: "",
    personalItem: { heightCm: 40, widthCm: 30, depthCm: 15 },
    cabinBag: { heightCm: 56, widthCm: 45, depthCm: 25 },
    weightLimitKg: 23,
    websiteUrl: "https://www.britishairways.com",
    lastUpdated: "fallback",
    status: "Live",
  },
];

export const FALLBACK_TIPS: TravelTip[] = [
  {
    tipId: "fallback-tip-1",
    title: "How gate agents actually measure your bag",
    slug: "how-gate-agents-measure-your-bag",
    content:
      "Most airlines use a rigid sizer cage at the gate, not a tape measure — a bag that bulges by even a centimetre can fail the check even if its rated dimensions are compliant.",
    category: "Packing",
    seoKeyword: "airline bag sizer",
    cta: "Check your bag now",
    status: "Live",
  },
];
