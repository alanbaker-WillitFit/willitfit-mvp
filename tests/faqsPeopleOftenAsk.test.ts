import { describe, expect, it } from "vitest";
import type { RuntimeContentRecord } from "@/types";
import { isApprovedFaq, selectPeopleOftenAskFaqs } from "@/services/faqs";

function faq(id: string, reviewStatus: string, published = true): RuntimeContentRecord {
  return {
    contentId: id,
    module: "FAQs",
    page: "ask",
    section: "General",
    contentType: "FAQ",
    title: `Question ${id}`,
    body: `Answer ${id}`,
    supportingText: "",
    displayOrder: Number(id.replace(/\D/g, "")) || 999,
    active: true,
    reviewStatus,
    published,
    notes: "",
    source: "sheet",
  };
}

describe("People often ask FAQ selection", () => {
  it("requires published approved or reviewed FAQs", () => {
    expect(isApprovedFaq(faq("FAQ-1", "Approved"))).toBe(true);
    expect(isApprovedFaq(faq("FAQ-2", "Reviewed"))).toBe(true);
    expect(isApprovedFaq(faq("FAQ-3", "Draft"))).toBe(false);
    expect(isApprovedFaq(faq("FAQ-4", "Approved", false))).toBe(false);
  });

  it("preserves governed order and limits the homepage gateway to three", () => {
    const records = [
      faq("FAQ-1", "Approved"),
      faq("FAQ-2", "Draft"),
      faq("FAQ-3", "Reviewed"),
      faq("FAQ-4", "Approved"),
      faq("FAQ-5", "Approved"),
    ];

    expect(selectPeopleOftenAskFaqs(records).map((record) => record.contentId)).toEqual([
      "FAQ-1",
      "FAQ-3",
      "FAQ-4",
    ]);
  });
});
