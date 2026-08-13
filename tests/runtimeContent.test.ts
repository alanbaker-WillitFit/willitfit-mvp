import { describe, expect, it } from "vitest";
import { mapRuntimeContentRow, runtimeBoolean, runtimePublished } from "@/services/runtimeContent";

describe("runtime content governance", () => {
  it("recognises approved publication status", () => {
    expect(runtimeBoolean("Approved")).toBe(true);
    expect(runtimePublished({ Publish: "Approved" })).toBe(true);
  });

  it("fails closed when no governance signal is present", () => {
    expect(runtimePublished({
      ContentID: "CONTENT001",
      Module: "Articles",
      Title: "Ungoverned content",
    })).toBe(false);
  });

  it("rejects explicit non-published governance states", () => {
    expect(runtimePublished({ Publish: "Draft" })).toBe(false);
    expect(runtimePublished({ "Review Status": "Pending" })).toBe(false);
    expect(runtimePublished({ Active: "No", Publish: "Approved" })).toBe(false);
  });

  it("does not invent unstable row-based content IDs", () => {
    const record = mapRuntimeContentRow({
      Module: "Articles",
      Publish: "Approved",
      Title: "Missing stable identifier",
    }, 16);

    expect(record.contentId).toBe("");
    expect(record.published).toBe(true);
  });

  it("preserves a supplied stable content ID", () => {
    const record = mapRuntimeContentRow({
      ContentID: "CONTENT001",
      Module: "Articles",
      Publish: "Approved",
      Title: "Governed content",
    }, 0);

    expect(record.contentId).toBe("CONTENT001");
    expect(record.published).toBe(true);
  });
});
