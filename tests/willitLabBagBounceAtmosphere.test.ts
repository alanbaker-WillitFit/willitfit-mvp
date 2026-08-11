import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const html = readFileSync(join(root, "public/lab/bag-bounce/index.html"), "utf8");
const controller = readFileSync(join(root, "public/lab/bag-bounce/atmosphere.js"), "utf8");
const css = readFileSync(join(root, "public/lab/bag-bounce/atmosphere.css"), "utf8");
const game = readFileSync(join(root, "public/lab/bag-bounce/game.js"), "utf8");
const sw = readFileSync(join(root, "public/lab/bag-bounce/sw.js"), "utf8");

describe("Bag Bounce level-atmosphere contract", () => {
  it("keeps atmosphere outside the certified gameplay file", () => {
    expect(html).toContain('href="atmosphere.css"');
    expect(html).toContain('src="atmosphere.js"');
    expect(game).not.toContain("atmosphereForLevel");
  });

  it("gives the opening, heavy-bag and final-loading stages distinct identities", () => {
    expect(controller).toContain('band: "intro"');
    expect(controller).toContain('band: "heavy"');
    expect(controller).toContain('band: "final"');
    expect(controller).toContain('FINAL LOADING ROUTE');
    expect(css).toContain('.game[data-atmosphere="intro"]');
    expect(css).toContain('.game[data-atmosphere="heavy"]');
    expect(css).toContain('.game[data-atmosphere="final"]');
  });

  it("calls out level 1, level 5 and level 10 without changing level rules", () => {
    expect(css).toContain('.game[data-level="1"]');
    expect(css).toContain('.game[data-level="5"]');
    expect(css).toContain('.game[data-level="10"]');
    expect(game).toContain("rows: level <= 2 ? 3 : level <= 6 ? 4 : 5");
    expect(game).toContain("heavyEvery: level < 5 ? 0");
    expect(game).toContain("priorityCount: level < 7 ? 0");
  });

  it("ships the atmosphere layer through the dedicated Bag Bounce cache", () => {
    expect(sw).toContain('willitlab-bag-bounce-rc1-');
    expect(sw).toContain('./atmosphere.css');
    expect(sw).toContain('./atmosphere.js');
  });
});