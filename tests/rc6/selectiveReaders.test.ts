import { describe, expect, it } from "vitest";
import { getRc6Settings } from "@/services/rc6/settings";
import { getRc6NavigationItems } from "@/services/rc6/navigation";
import { getRc6SeoPages } from "@/services/rc6/seoPages";
import type { Rc6TabReader } from "@/services/rc6/runtimeReader";

function readerFor(rowsByTab: Record<string, Record<string, string>[]>): Rc6TabReader {
  return async <T extends Record<string, string>>(tabName: string): Promise<T[] | null> => {
    const rows = rowsByTab[tabName];
    return rows ? (rows as T[]) : null;
  };
}

describe("RC6 selective readers", () => {
  it("keeps WillItFly navigation disabled when the governed URL is missing", async () => {
    const settings = await getRc6Settings(readerFor({
      "01_Settings": [
        { "Control Field": "willitfly_nav_enabled", Value: "Yes" },
        { "Control Field": "willitfly_nav_url", Value: "" },
      ],
    }));

    expect(settings.willItFlyNavEnabled).toBe(false);
    expect(settings.willItFlyNavUrl).toBe("");
  });

  it("suppresses inactive navigation even when Publish is Yes", async () => {
    const items = await getRc6NavigationItems(readerFor({
      "07.1_Navigation": [{
        "Link ID": "NAV-WILLITFLY-001",
        Label: "WillItFly",
        URL: "https://www.will-it-fly.net",
        "Display Order": "90",
        "Open in New Tab": "Yes",
        Active: "No",
        Publish: "Yes",
      }],
    }));

    expect(items).toEqual([]);
  });

  it("suppresses Draft SEO rows even when structurally complete", async () => {
    const pages = await getRc6SeoPages(readerFor({
      "08_SEO Pages": [{
        "SEO ID": "RYR-SEO-HUB",
        "Page Type": "Airline Hub",
        "Parent ID": "RYR",
        Slug: "/ryanair",
        "Page Title": "Ryanair Cabin Bag Size Guide | WillItFit",
        "Meta Title": "Ryanair Cabin Bag Size Guide | WillItFit",
        "Meta Description": "Description",
        H1: "Ryanair Cabin Bag Guide",
        "Canonical URL": "https://will-it-fit.net/ryanair",
        Active: "Active",
        "Review Status": "Draft",
        Publish: "No",
      }],
    }));

    expect(pages).toEqual([]);
  });

  it("returns an approved published SEO row", async () => {
    const pages = await getRc6SeoPages(readerFor({
      "08_SEO Pages": [{
        "SEO ID": "TEST-SEO-1",
        "Page Type": "Test",
        "Parent ID": "TEST",
        Slug: "/test",
        "Page Title": "Test | WillItFit",
        "Meta Title": "Test | WillItFit",
        "Meta Description": "Description",
        H1: "Test",
        "Canonical URL": "https://will-it-fit.net/test",
        Active: "Active",
        "Review Status": "Approved",
        Publish: "Yes",
      }],
    }));

    expect(pages).toHaveLength(1);
    expect(pages[0]?.slug).toBe("/test");
  });
});
