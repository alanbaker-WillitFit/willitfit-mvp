import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const html = readFileSync(join(root, "public/lab/bag-bounce/index.html"), "utf8");
const css = readFileSync(join(root, "public/lab/bag-bounce/styles.css"), "utf8");
const sw = readFileSync(join(root, "public/lab/bag-bounce/sw.js"), "utf8");

describe("Bag Bounce presentation contract", () => {
  it("stages the approved character sheets as cropped game artwork rather than raw asset previews", () => {
    expect(html).toContain("character-crop intro-crop");
    expect(html).toContain("character-crop outro-crop");
    expect(css).toContain(".character-crop{width:min(100%,380px);height:300px}");
    expect(css).toContain("image-rendering:pixelated");
    expect(css).toContain(".intro-crop img{width:240%;left:-67%;top:-35%}");
  });

  it("keeps the certified game mechanics untouched while strengthening the baggage-route hierarchy", () => {
    expect(html).toContain("class=\"route-header\"");
    expect(html).toContain("BAGGAGE ROUTE");
    expect(html).toContain("LEFT BELT");
    expect(html).toContain("RIGHT BELT");
    expect(css).toContain(".bag-field{position:absolute;inset:44px 66px 155px;z-index:2}");
  });

  it("presents the intro and result as responsive story layouts", () => {
    expect(html).toContain("class=\"story-layout\"");
    expect(html).toContain("class=\"story-layout result-layout\"");
    expect(html).toContain("class=\"mission-card\"");
    expect(css).toContain("@media(max-width:820px)");
  });

  it("advances the offline cache for the presentation package", () => {
    expect(sw).toContain('willitlab-bag-bounce-rc1-presentation-2');
  });
});
