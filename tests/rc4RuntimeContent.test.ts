import { describe, expect, it } from "vitest";
import { mapRuntimeContentRow, runtimePublished } from "@/services/runtimeContent";
import { buildAffiliateSlots } from "@/services/runtimeAffiliates";
import { isLabInvitationActive } from "@/lib/lab";
import { FALLBACK_LAB_CONFIGS } from "@/services/labConfig";
import type { LabConfiguration } from "@/types";

describe("RC4 governed content", () => {
  it("requires an affirmative Publish value when the field is present", () => {
    expect(runtimePublished({ Active: "Active", "Review Status": "Published", Publish: "No" })).toBe(false);
    expect(runtimePublished({ Active: "Active", "Review Status": "Published", Publish: "Yes" })).toBe(true);
  });

  it("maps canonical Mother-aligned fields", () => {
    const record = mapRuntimeContentRow({
      ContentID: "ABOUT-1",
      Module: "About",
      Page: "about",
      Section: "Introduction",
      "Content Type": "Section",
      Title: "Hello",
      Content: "World",
      Priority: "2",
      Active: "Active",
      "Review Status": "Published",
      Publish: "Yes",
    }, 0);
    expect(record).toMatchObject({ contentId: "ABOUT-1", displayOrder: 2, published: true, source: "sheet" });
  });
});

describe("RC4 affiliate slots", () => {
  it("always returns ten stable slots for each of six categories", () => {
    const slots = buildAffiliateSlots();
    expect(slots).toHaveLength(60);
    expect(new Set(slots.map((slot) => slot.slotId)).size).toBe(60);
    expect(slots.every((slot) => slot.placeholder)).toBe(true);
  });

  it("replaces only a valid published HTTPS slot", () => {
    const slots = buildAffiliateSlots([{
      "Affiliate Slot ID": "packing-cubes-01",
      Category: "packing-cubes",
      "Slot Position": "1",
      "Product Title": "Verified cubes",
      "Affiliate URL": "https://example.com/cubes",
      Active: "Active",
      "Review Status": "Published",
      Publish: "Yes",
    }]);
    expect(slots[0]).toMatchObject({ slotId: "packing-cubes-01", placeholder: false });
    expect(slots.slice(1).every((slot) => slot.placeholder)).toBe(true);
  });
});

describe("RC4 Lab trigger", () => {
  const config: LabConfiguration = {
    configId: "LAB-1",
    gameId: "packing",
    gameName: "Packing",
    gamePath: "/lab/packing",
    triggerDate: "2026-06-15",
    invitationTitle: "Lab",
    invitationBody: "Try it",
    cta: "Enter",
    active: true,
    reviewStatus: "Published",
    published: true,
    source: "fallback",
  };

  it("is inactive before the configured date and active on it", () => {
    expect(isLabInvitationActive(config, new Date("2026-06-14T23:59:59Z"))).toBe(false);
    expect(isLabInvitationActive(config, new Date("2026-06-15T00:00:00Z"))).toBe(true);
  });

  it("keeps the original WillItFly game and trigger", () => {
    expect(FALLBACK_LAB_CONFIGS.map(({ gameId, gamePath, triggerDate }) => ({
      gameId, gamePath, triggerDate,
    }))).toEqual([
      { gameId: "willitfly", gamePath: "/lab/index.html", triggerDate: "2026-06-15" },
    ]);
  });
});
