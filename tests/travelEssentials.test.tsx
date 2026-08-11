import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import TravelEssentials, { TravelEssentialsSheet } from "@/components/TravelEssentials";
import {
  AFFILIATE_CATALOGUE_CAPACITY,
  affiliatePlaceholdersForCategory,
  getTravelEssentialCategory,
  visibleTravelEssentialCategories,
} from "@/data/travelEssentials";
import type { AffiliateSlot } from "@/types";

describe("Travel Essentials fail-closed framework", () => {
  it("maps every category control to the correct sheet record", () => {
    for (const category of visibleTravelEssentialCategories) expect(getTravelEssentialCategory(category.id)).toEqual(category);
  });

  it("renders all six category buttons without merchant or affiliate links", () => {
    const markup = renderToStaticMarkup(<TravelEssentials />);
    expect((markup.match(/aria-haspopup="dialog"/g) ?? [])).toHaveLength(6);
    expect(markup).not.toMatch(/<a\b|https?:\/\/|£|\$/i);
  });

  it("renders the governed catalogue capacity and accessible modal contract", () => {
    const category = visibleTravelEssentialCategories[0]!;
    const markup = renderToStaticMarkup(<TravelEssentialsSheet category={category} onClose={() => undefined} />);
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(markup).toContain(`Up to ${AFFILIATE_CATALOGUE_CAPACITY} governed recommendations.`);
    expect((markup.match(/Recommendation coming soon/g) ?? [])).toHaveLength(AFFILIATE_CATALOGUE_CAPACITY);
    expect(markup).toContain("This governed recommendation slot is ready for a verified product.");
    expect(markup).not.toMatch(/<a\b|https?:\/\//i);
  });

  it("uses the standard affiliate card for governed live products while keeping empty slots fail closed", () => {
    const category = visibleTravelEssentialCategories[0]!;
    const slots = affiliatePlaceholdersForCategory(category.slug);
    const liveSlot: AffiliateSlot = {
      ...slots[0]!,
      title: "Approved travel essential",
      description: "A governed test recommendation.",
      merchant: "Approved Merchant",
      affiliateUrl: "https://example.com/approved-product",
      cta: "View offer",
      disclosure: "Affiliate link",
      placeholder: false,
    };
    const markup = renderToStaticMarkup(
      <TravelEssentialsSheet category={category} slots={[liveSlot, ...slots.slice(1)]} onClose={() => undefined} />,
    );

    expect(markup).toContain("wf-card wf-card--compact");
    expect(markup).toContain("Approved Merchant");
    expect(markup).toContain("Approved travel essential");
    expect(markup).toContain("View offer");
    expect(markup).toContain('rel="noopener noreferrer sponsored"');
    expect((markup.match(/Recommendation coming soon/g) ?? [])).toHaveLength(AFFILIATE_CATALOGUE_CAPACITY - 1);
  });
});
