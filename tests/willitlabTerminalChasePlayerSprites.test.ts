import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const assets = readFileSync(join(root, "public/lab/terminal-chase/character-assets.js"), "utf8");
const integration = readFileSync(join(root, "public/lab/terminal-chase/character-integration.js"), "utf8");
const sw = readFileSync(join(root, "public/lab/terminal-chase/sw.js"), "utf8");
const game = readFileSync(join(root, "public/lab/terminal-chase/game.js"), "utf8");
const spritePaths = [
  "public/lab/terminal-chase/sprites/player-down.png",
  "public/lab/terminal-chase/sprites/player-up.png",
  "public/lab/terminal-chase/sprites/player-left.png",
  "public/lab/terminal-chase/sprites/player-right.png",
];

describe("Terminal Chase verified player sprites", () => {
  it("registers all four directional transparent derivatives", () => {
    expect(assets).toContain('down: "./sprites/player-down.png"');
    expect(assets).toContain('up: "./sprites/player-up.png"');
    expect(assets).toContain('left: "./sprites/player-left.png"');
    expect(assets).toContain('right: "./sprites/player-right.png"');
    for (const relativePath of spritePaths) {
      const data = readFileSync(join(root, relativePath));
      expect(data.length).toBeGreaterThan(700);
      expect(Array.from(data.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    }
  });

  it("derives visual direction from rendered player movement without touching gameplay", () => {
    expect(integration).toContain("installDirectionalPlayer");
    expect(integration).toContain("Math.abs(dx) > Math.abs(dy)");
    expect(integration).toContain('dx > 0 ? "right" : "left"');
    expect(integration).toContain('dy > 0 ? "down" : "up"');
    expect(integration).toContain("new MutationObserver(updateDirection)");
    expect(game).not.toContain("player-down.png");
    expect(game).not.toContain("directionalSprite");
  });

  it("keeps the verified player set in the current Terminal Chase offline cache", () => {
    expect(sw).toContain("willitlab-terminal-chase-");
    expect(sw).toContain("./sprites/player-down.png");
    expect(sw).toContain("./sprites/player-up.png");
    expect(sw).toContain("./sprites/player-left.png");
    expect(sw).toContain("./sprites/player-right.png");
  });
});
