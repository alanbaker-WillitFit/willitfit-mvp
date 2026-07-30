import { describe, expect, it } from "vitest";
import { buildGovernedArticles, capArticleBlurb, normaliseArticleSlug } from "@/services/articles";
import type { RuntimeContentRecord } from "@/types";

function record(overrides: Partial<RuntimeContentRecord> = {}): RuntimeContentRecord {
  return {
    contentId: "ART001",
    module: "Articles",
    page: "articles",
    section: "packing-smart",
    contentType: "Article",
    title: "Packing smart",
    body: "Useful governed article content.",
    supportingText: "A practical article blurb.",
    displayOrder: 1,
    active: true,
    reviewStatus: "Approved",
    published: true,
    notes: "",
    source: "sheet",
    ...overrides,
  };
}

describe("Articles governed contract", () => {
  it("normalises article slugs canonically", () => {
    expect(normaliseArticleSlug("  Packing Smart!  ")).toBe("packing-smart");
    expect(normaliseArticleSlug("---")).toBe("");
  });

  it("caps card blurbs at thirty words", () => {
    const text = Array.from({ length: 35 }, (_, index) => `word${index + 1}`).join(" ");
    const blurb = capArticleBlurb(text);

    expect(blurb.split(/\s+/)).toHaveLength(30);
    expect(blurb.endsWith("…")).toBe(true);
  });

  it("builds a valid governed article and orders its sections", () => {
    const articles = buildGovernedArticles([
      record({ contentId: "ART002", displayOrder: 2, title: "Second section", body: "Second." }),
      record({ contentId: "ART001", displayOrder: 1, title: "Packing smart", body: "First." }),
    ]);

    expect(articles).toHaveLength(1);
    expect(articles[0]?.slug).toBe("packing-smart");
    expect(articles[0]?.sections.map((section) => section.contentId)).toEqual(["ART001", "ART002"]);
  });

  it("fails closed for unpublished, inactive, incomplete or unsluggable records", () => {
    expect(buildGovernedArticles([record({ published: false })])).toEqual([]);
    expect(buildGovernedArticles([record({ active: false })])).toEqual([]);
    expect(buildGovernedArticles([record({ body: "" })])).toEqual([]);
    expect(buildGovernedArticles([record({ title: "" })])).toEqual([]);
    expect(buildGovernedArticles([record({ contentId: "" })])).toEqual([]);
    expect(buildGovernedArticles([record({ page: "articles", section: "", title: "", contentId: "" })])).toEqual([]);
  });

  it("rejects ambiguous duplicate section identifiers", () => {
    const articles = buildGovernedArticles([
      record({ contentId: "ART001", body: "First version." }),
      record({ contentId: "ART001", body: "Conflicting version.", displayOrder: 2 }),
    ]);

    expect(articles).toEqual([]);
  });

  it("keeps valid sections while excluding invalid records from the same article", () => {
    const articles = buildGovernedArticles([
      record(),
      record({ contentId: "ART002", published: false, displayOrder: 2 }),
      record({ contentId: "ART003", body: "", displayOrder: 3 }),
    ]);

    expect(articles[0]?.sections.map((section) => section.contentId)).toEqual(["ART001"]);
  });
});
