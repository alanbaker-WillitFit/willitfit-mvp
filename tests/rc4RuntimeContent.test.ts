import { describe, expect, it } from "vitest";
import {
  mapRuntimeContentRow,
  readFirstAvailableRuntimeTab,
  runtimePublished,
} from "@/services/runtimeContent";
import { adaptAirlineRow, adaptBaggageRuleRow } from "@/services/airlines";
import { mapFaqRow } from "@/services/faqs";
import { mapTipRow } from "@/services/tips";
import { buildAffiliateSlots } from "@/services/runtimeAffiliates";
import { mapLabConfiguration, FALLBACK_LAB_CONFIGS } from "@/services/labConfig";
import { isLabInvitationActive, selectLabInvitation } from "@/lib/lab";
import { getMeasurementState } from "@/components/BagVisualizer";
import { validateSheetHeaders } from "@/services/sheetSchemas";
import type { FitResult, LabConfiguration } from "@/types";

const completedCloseCabinCheck = {
  verdict: "close",
  bagType: "cabinBag",
} as FitResult;

describe("RC4 reduced runtime contract", () => {
  it("requires every governance field that is present", () => {
    expect(runtimePublished({ Active: "Active", "Review Status": "Published", Publish: "No" })).toBe(false);
    expect(runtimePublished({ Active: "Active", "Review Status": "In Review", Publish: "Yes" })).toBe(false);
    expect(runtimePublished({ Active: "Active", "Review Status": "Approved", Publish: "Yes" })).toBe(true);
    expect(runtimePublished({ Status: "Draft" })).toBe(false);
    expect(runtimePublished({ Status: "Live" })).toBe(true);
  });

  it("maps reduced Site Content fields and derives its module", () => {
    const record = mapRuntimeContentRow({
      "Content ID": "ABOUT-1",
      Page: "About",
      Section: "Introduction",
      "Content Type": "Section",
      Title: "Hello",
      Content: "World",
      "Display Order": "2",
      Active: "Yes",
      "Review Status": "Approved",
      Publish: "Yes",
    }, 0);
    expect(record).toMatchObject({
      contentId: "ABOUT-1",
      module: "About",
      displayOrder: 2,
      published: true,
      source: "sheet",
    });
  });

  it("treats an accessible empty canonical tab as authoritative", async () => {
    const calls: string[] = [];
    const reader = async <T extends Record<string, string>>(tabName: string): Promise<T[] | null> => {
      calls.push(tabName);
      return (tabName === "canonical" ? [] : [{ ID: "legacy" }]) as unknown as T[];
    };
    const result = await readFirstAvailableRuntimeTab(["canonical", "legacy"], reader);
    expect(result).toEqual({ rows: [], tabName: "canonical" });
    expect(calls).toEqual(["canonical"]);
  });

  it("tries a legacy alias only when the canonical read fails", async () => {
    const reader = async <T extends Record<string, string>>(tabName: string): Promise<T[] | null> =>
      tabName === "canonical" ? null : ([{ ID: "legacy" }] as unknown as T[]);
    const result = await readFirstAvailableRuntimeTab(["canonical", "legacy"], reader);
    expect(result.tabName).toBe("legacy");
    expect(result.rows).toEqual([{ ID: "legacy" }]);
  });

  it("validates the reduced canonical headers", () => {
    expect(validateSheetHeaders("03_Airline Rules", [
      "Rule ID", "Airline ID", "Fare", "Bag Type", "Length cm", "Width cm",
      "Depth cm", "Review Status", "Publish",
    ]).valid).toBe(true);
    expect(validateSheetHeaders("06_Tips", [
      "Tip ID", "Category", "Title", "Tip / Hint", "Review Status", "Publish",
    ]).valid).toBe(true);
  });
});

describe("RC4 reduced field adapters", () => {
  it("maps reduced airline and baggage-rule fields", () => {
    expect(adaptAirlineRow({
      "Airline ID": "FR",
      "Airline Name": "Ryanair",
      "Baggage URL": "https://example.com/bags",
      Active: "Yes",
      "Review Status": "Approved",
      Publish: "Yes",
    })).toMatchObject({
      AirlineID: "FR",
      AirlineName: "Ryanair",
      OfficialBaggageURL: "https://example.com/bags",
      Status: "Live",
    });
    expect(adaptBaggageRuleRow({
      "Rule ID": "FR-CABIN",
      "Airline ID": "FR",
      Fare: "Regular",
      "Bag Type": "Cabin",
      "Length cm": "55",
      "Width cm": "40",
      "Depth cm": "20",
      "Weight kg": "10",
      "Review Status": "Approved",
      Publish: "Yes",
    })).toMatchObject({
      FareClass: "Regular",
      HeightCm: "55",
      WidthCm: "40",
      DepthCm: "20",
      Status: "Live",
    });
  });

  it("maps reduced FAQs and Tips", () => {
    expect(mapFaqRow({
      "FAQ ID": "FAQ-1",
      Category: "Measuring",
      Question: "How?",
      Answer: "Measure the full bag.",
      Priority: "1",
      "Review Status": "Approved",
      Publish: "Yes",
    }, 0)).toMatchObject({ contentId: "FAQ-1", module: "FAQs", published: true });

    expect(mapTipRow({
      "Tip ID": "TIP-1",
      Category: "Measurement",
      Title: "Include wheels",
      "Tip / Hint": "Measure handles and wheels.",
      "Context Trigger": "Bag check",
      "Review Status": "Approved",
      Publish: "Yes",
    }, 0)).toMatchObject({
      tipId: "TIP-1",
      content: "Measure handles and wheels.",
      journeyStage: "Bag check",
      status: "Live",
    });
  });
});

describe("RC4 affiliate adapter compatibility", () => {
  it("always returns ten stable slots for each of six categories", () => {
    const slots = buildAffiliateSlots();
    expect(slots).toHaveLength(60);
    expect(new Set(slots.map((slot) => slot.slotId)).size).toBe(60);
    expect(slots.every((slot) => slot.placeholder)).toBe(true);
  });

  it("maps a valid reduced affiliate row without adding new functionality", () => {
    const slots = buildAffiliateSlots([{
      "Affiliate ID": "packing-cubes-01",
      Category: "packing-cubes",
      "Display Order": "1",
      "Product Name": "Verified cubes",
      "Destination URL": "https://example.com/cubes",
      Active: "Yes",
      "Review Status": "Approved",
      Publish: "Yes",
    }]);
    expect(slots[0]).toMatchObject({
      slotId: "packing-cubes-01",
      title: "Verified cubes",
      placeholder: false,
    });
  });
});

describe("RC4 Lab completed-check trigger", () => {
  const config: LabConfiguration = mapLabConfiguration({
    "Lab ID": "LAB-GATERUSH-TEST",
    "Game ID": "gate-rush",
    "Game Name": "Gate Rush",
    "Game Path": "/lab/gate-rush.html",
    "Trigger Type": "Code",
    "Bag Type": "Cabin",
    "Result State": "Close",
    Priority: "1",
    Active: "Yes",
    "Review Status": "Approved",
    Publish: "Yes",
  });

  it("cannot activate without a completed bag-check result", () => {
    expect(isLabInvitationActive(config)).toBe(false);
  });

  it("activates from a matching completed result, not the current date", () => {
    expect(isLabInvitationActive(config, completedCloseCabinCheck)).toBe(true);
    expect(isLabInvitationActive(config, {
      ...completedCloseCabinCheck,
      bagType: "personalItem",
    })).toBe(false);
  });

  it("never uses fallback configuration as an invitation source", () => {
    expect(selectLabInvitation(FALLBACK_LAB_CONFIGS, completedCloseCabinCheck)).toBeNull();
  });

  it("keeps both real game routes and records dates only as references", () => {
    expect(FALLBACK_LAB_CONFIGS.map(({ gameId, gamePath, implementationReference, published }) => ({
      gameId, gamePath, implementationReference, published,
    }))).toEqual([
      {
        gameId: "willitfly",
        gamePath: "/lab/index.html",
        implementationReference: "2026-06-15",
        published: false,
      },
      {
        gameId: "gate-rush",
        gamePath: "/lab/gate-rush.html",
        implementationReference: "2026-06-22",
        published: false,
      },
    ]);
  });
});

describe("RC4 close-fit measurement labels", () => {
  it("shows an over-limit close result as Close fit, not Too large", () => {
    expect(getMeasurementState(57, 55, "close")).toEqual({
      className: "is-close",
      label: "Close fit",
    });
    expect(getMeasurementState(60, 55, "no-fit").label).toBe("Too large");
  });
});
