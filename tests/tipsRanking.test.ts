import { describe, expect, it } from "vitest";
import { normaliseTipPriority, sortTipsByPriority } from "@/services/tips";
import type { TravelTip } from "@/types";

function tip(title: string, priority?: number): TravelTip {
  return {
    tipId: title,
    title,
    slug: title.toLowerCase().replaceAll(" ", "-"),
    content: `${title} content`,
    category: "Travel Tips",
    seoKeyword: "",
    cta: "Check your bag size",
    status: "Live",
    priority,
  };
}

describe("Tips priority governance", () => {
  it("treats 1 as highest and 10 as the default", () => {
    expect(normaliseTipPriority(1)).toBe(1);
    expect(normaliseTipPriority(10)).toBe(10);
    expect(normaliseTipPriority(undefined)).toBe(10);
    expect(normaliseTipPriority(0)).toBe(10);
    expect(normaliseTipPriority(11)).toBe(10);
  });

  it("sorts ascending by priority and alphabetically within equal priority", () => {
    const result = sortTipsByPriority([
      tip("Zulu", 10),
      tip("Bravo", 2),
      tip("Alpha", 2),
      tip("Highest", 1),
    ]);

    expect(result.map((item) => item.title)).toEqual(["Highest", "Alpha", "Bravo", "Zulu"]);
  });
});
