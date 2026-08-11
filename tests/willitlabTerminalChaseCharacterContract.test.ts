import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const html = readFileSync(join(root, "public/lab/terminal-chase/index.html"), "utf8");
const assets = readFileSync(join(root, "public/lab/terminal-chase/character-assets.js"), "utf8");
const integration = readFileSync(join(root, "public/lab/terminal-chase/character-integration.js"), "utf8");
const css = readFileSync(join(root, "public/lab/terminal-chase/character-integration.css"), "utf8");
const sw = readFileSync(join(root, "public/lab/terminal-chase/sw.js"), "utf8");
const game = readFileSync(join(root, "public/lab/terminal-chase/game.js"), "utf8");

describe("Terminal Chase character derivative contract", () => {
  it("keeps hazard derivatives optional and fail-safe", () => {
    expect(assets).toContain("staff: null");
    expect(assets).toContain("traveller: null");
    expect(integration).toContain("if (!element || !source");
    expect(integration).toContain('image.addEventListener("error"');
  });

  it("loads the sprite layer after gameplay without changing core mechanics", () => {
    expect(html).toContain('src="character-assets.js"');
    expect(html).toContain('src="game.js"');
    expect(html).toContain('src="character-integration.js"');
    expect(game).not.toContain("WILLIT_TERMINAL_CHASE_CHARACTERS");
  });

  it("hides code-drawn fallback art only after a derivative has loaded", () => {
    expect(integration).toContain('classList.add("has-character-sprite")');
    expect(css).toContain(".player.has-character-sprite .player-head");
    expect(css).toContain(".hazard.has-character-sprite");
  });

  it("keeps the integration contract in the Terminal Chase offline namespace", () => {
    expect(sw).toContain("willitlab-terminal-chase-");
    expect(sw).toContain("./character-assets.js");
    expect(sw).toContain("./character-integration.js");
    expect(sw).toContain("./character-integration.css");
  });
});
