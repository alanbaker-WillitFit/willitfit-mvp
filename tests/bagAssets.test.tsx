import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BagVisualizer from "@/components/BagVisualizer";

const iconDirectory = path.join(process.cwd(), "public", "assets", "icons");
const lockedAssets = [
  "cabin-bag-photo-rc4.jpg",
  "personal-item-photo-rc4.jpg",
  "cabin-bag-measurement-rc4.jpg",
  "personal-item-measurement-rc4.jpg",
];

describe("RC4 bag artwork contract", () => {
  it("keeps every locked photographic master in the public asset directory", () => {
    for (const asset of lockedAssets) {
      expect(fs.existsSync(path.join(iconDirectory, asset)), asset).toBe(true);
    }
  });

  it("does not retain the superseded public line-art assets", () => {
    expect(fs.existsSync(path.join(iconDirectory, "cabin-bag.svg"))).toBe(false);
    expect(fs.existsSync(path.join(iconDirectory, "personal-bag.svg"))).toBe(false);
  });

  it("uses the locked measurement photographs in result visuals", () => {
    const cabin = renderToStaticMarkup(
      <BagVisualizer bagType="cabinBag" verdict="fits" dimensions={{ heightCm: 55, widthCm: 40, depthCm: 20 }} />,
    );
    const personal = renderToStaticMarkup(
      <BagVisualizer bagType="personalItem" verdict="fits" dimensions={{ heightCm: 40, widthCm: 30, depthCm: 20 }} />,
    );

    expect(cabin).toContain("cabin-bag-measurement-rc4.jpg");
    expect(personal).toContain("personal-item-measurement-rc4.jpg");
  });

  it("uses the locked photographic masters in the bag selector", () => {
    const selector = fs.readFileSync(path.join(process.cwd(), "components", "DimensionForm.tsx"), "utf8");

    expect(selector).toContain("cabin-bag-photo-rc4.jpg");
    expect(selector).toContain("personal-item-photo-rc4.jpg");
  });

  it("keeps runtime hints inside the form so they cannot displace the result column", () => {
    const selector = fs.readFileSync(path.join(process.cwd(), "components", "DimensionForm.tsx"), "utf8");
    const hint = selector.indexOf("!result && hints.length > 0");
    const formClose = selector.indexOf("</form>");

    expect(hint).toBeGreaterThan(-1);
    expect(hint).toBeLessThan(formClose);
  });
});
