import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const html = readFileSync(join(root, "public/lab/bag-bounce/index.html"), "utf8");
const css = readFileSync(join(root, "public/lab/bag-bounce/visual-qa.css"), "utf8");
const sw = readFileSync(join(root, "public/lab/bag-bounce/sw.js"), "utf8");

describe("Bag Bounce live-screen visual QA contract", () => {
  it("loads a dedicated visual QA override after the base stylesheet", () => {
    expect(html).toContain('<link rel="stylesheet" href="styles.css">');
    expect(html).toContain('<link rel="stylesheet" href="visual-qa.css">');
    expect(html.indexOf("styles.css")).toBeLessThan(html.indexOf("visual-qa.css"));
  });

  it("keeps intro and outro character crops independently tuned", () => {
    expect(css).toContain(".intro-crop img");
    expect(css).toContain(".outro-crop img");
    expect(css).toContain("width:232%");
    expect(css).toContain("width:228%");
  });

  it("uses contained suitcase artwork and readable player-bag scaling", () => {
    expect(css).toContain(".bag-art{object-fit:contain");
    expect(css).toContain(".player-bag{width:50px;height:50px");
    expect(css).toContain(".player-bag img{object-fit:contain");
  });

  it("contains explicit phone-width tuning without altering game mechanics", () => {
    expect(css).toContain("@media(max-width:390px)");
    expect(css).toContain("@media(max-width:600px)");
    expect(css).not.toContain("tokenVX");
    expect(css).not.toContain("paddleRatio");
  });

  it("ships the visual QA stylesheet through its own cache revision", () => {
    expect(sw).toContain("willitlab-bag-bounce-rc1-visual-qa-3");
    expect(sw).toContain('"./visual-qa.css"');
  });
});
