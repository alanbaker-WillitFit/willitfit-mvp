import { describe, expect, it } from "vitest";
import { buildGovernedAboutContent } from "@/services/about";
import type { RuntimeContentRecord } from "@/types";

function record(overrides: Partial<RuntimeContentRecord> = {}): RuntimeContentRecord {
  return {
    contentId: "ABOUT001",
    module: "About",
    page: "about",
    section: "data-sources",
    contentType: "Section",
    title: "Where our data comes from",
    body: "Governed information about WillItFit data sources.",
    supportingText: "",
    displayOrder: 1,
    active: true,
    reviewStatus: "Approved",
    published: true,
    notes: "",
    source: "sheet",
    ...overrides,
  };
}

describe("About governed contract", () => {
  it("builds governed About content in deterministic order", () => {
    const about = buildGovernedAboutContent([
      record({ contentId: "ABOUT002", title: "How it is maintained", body: "Second.", displayOrder: 2 }),
      record({ contentId: "ABOUT001", displayOrder: 1 }),
    ]);

    expect(about?.heading).toBe("Where our data comes from");
    expect(about?.sections.map((section) => section.contentId)).toEqual(["ABOUT001", "ABOUT002"]);
  });

  it("fails closed when no complete approved section exists", () => {
    expect(buildGovernedAboutContent([])).toBeNull();
    expect(buildGovernedAboutContent([record({ published: false })])).toBeNull();
    expect(buildGovernedAboutContent([record({ active: false })])).toBeNull();
    expect(buildGovernedAboutContent([record({ title: "" })])).toBeNull();
    expect(buildGovernedAboutContent([record({ body: "" })])).toBeNull();
  });

  it("excludes invalid sections without suppressing valid governed content", () => {
    const about = buildGovernedAboutContent([
      record(),
      record({ contentId: "ABOUT002", published: false, displayOrder: 2 }),
      record({ contentId: "ABOUT003", body: "", displayOrder: 3 }),
    ]);

    expect(about?.sections.map((section) => section.contentId)).toEqual(["ABOUT001"]);
  });
});
