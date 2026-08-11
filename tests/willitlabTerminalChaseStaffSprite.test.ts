import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const assets = readFileSync(join(root, "public/lab/terminal-chase/character-assets.js"), "utf8");
const integration = readFileSync(join(root, "public/lab/terminal-chase/character-integration.js"), "utf8");
const sw = readFileSync(join(root, "public/lab/terminal-chase/sw.js"), "utf8");
const sprite = readFileSync(join(root, "public/lab/terminal-chase/sprites/hazard-staff-female.png"));
const game = readFileSync(join(root, "public/lab/terminal-chase/game.js"), "utf8");

describe("Terminal Chase staff hazard sprite", () => {
  it("registers the transparent staff derivative without changing gameplay", () => {
    expect(assets).toContain('staff: "./sprites/hazard-staff-female.png"');
    expect(Array.from(sprite.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(sprite.length).toBeGreaterThan(1000);
    expect(integration).toContain('assets.hazards?.[type]');
    expect(game).not.toContain("hazard-staff-female.png");
  });

  it("keeps unprepared hazard types fail-safe", () => {
    expect(assets).toContain("cart: null");
    expect(assets).toContain("traveller: null");
    expect(assets).toContain("security: null");
  });

  it("ships the staff sprite in the current offline cache", () => {
    expect(sw).toContain("willitlab-terminal-chase-rc1-staff-sprite-1");
    expect(sw).toContain("./sprites/hazard-staff-female.png");
  });
});
