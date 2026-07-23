import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import TravelEssentials, { TravelEssentialsSheet } from "@/components/TravelEssentials";
import { getTravelEssentialCategory, visibleTravelEssentialCategories } from "@/data/travelEssentials";

describe("Travel Essentials fail-closed framework", () => {
  it("maps every category control to the correct sheet record", () => {
    for (const category of visibleTravelEssentialCategories) expect(getTravelEssentialCategory(category.id)).toEqual(category);
  });
  it("renders all six category buttons without merchant or affiliate links", () => {
    const markup = renderToStaticMarkup(<TravelEssentials />);
    expect((markup.match(/aria-haspopup="dialog"/g) ?? [])).toHaveLength(6);
    expect(markup).not.toMatch(/<a\b|https?:\/\/|£|\$/i);
  });
  it("renders the governed empty state and accessible modal contract", () => {
    const category = visibleTravelEssentialCategories[0]!;
    const markup = renderToStaticMarkup(<TravelEssentialsSheet category={category} onClose={() => undefined} />);
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect((markup.match(/Recommendation coming soon/g) ?? [])).toHaveLength(10);
    expect(markup).toContain("This governed recommendation slot is ready for a verified product.");
    expect(markup).not.toMatch(/<a\b|https?:\/\//i);
  });
});
