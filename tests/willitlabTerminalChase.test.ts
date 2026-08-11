import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TERMINAL_CHASE_LEVEL_COUNT,
  buildTerminalChaseProgression,
  getTerminalChaseLevel,
} from "../lib/willitlabTerminalChaseProgression";

const root = process.cwd();
const html = readFileSync(join(root, "public/lab/terminal-chase/index.html"), "utf8");
const game = readFileSync(join(root, "public/lab/terminal-chase/game.js"), "utf8");
const css = readFileSync(join(root, "public/lab/terminal-chase/styles.css"), "utf8");
const sw = readFileSync(join(root, "public/lab/terminal-chase/sw.js"), "utf8");

describe("WillIt Lab Terminal Chase RC1", () => {
  it("defines exactly 10 progressively harder terminal levels", () => {
    const levels = buildTerminalChaseProgression();
    expect(TERMINAL_CHASE_LEVEL_COUNT).toBe(10);
    expect(levels).toHaveLength(10);
    expect(levels[0]!.enemyCount).toBeLessThan(levels[9]!.enemyCount);
    expect(levels[0]!.enemySpeed).toBeLessThan(levels[9]!.enemySpeed);
    expect(levels[0]!.powerDurationMs).toBeGreaterThan(levels[9]!.powerDurationMs);
  });

  it("introduces tunnels, moving barriers and later final-terminal pressure in stages", () => {
    expect(getTerminalChaseLevel(1).tunnelOpen).toBe(false);
    expect(getTerminalChaseLevel(2).tunnelOpen).toBe(true);
    expect(getTerminalChaseLevel(3).movingBarrier).toBe(false);
    expect(getTerminalChaseLevel(4).movingBarrier).toBe(true);
    expect(getTerminalChaseLevel(10).theme).toBe("final");
  });

  it("uses code-driven maze geometry rather than a maze image", () => {
    expect(html).toContain('id="maze"');
    expect(game).toContain("const MAPS = [");
    expect(game).toContain("function isWall");
    expect(game).toContain("gridTemplateColumns");
    expect(css).toContain(".cell.wall");
    expect(html).not.toContain("maze.png");
  });

  it("supports four-direction keyboard, swipe and touch movement", () => {
    expect(game).toContain("ArrowUp");
    expect(game).toContain("ArrowDown");
    expect(game).toContain("ArrowLeft");
    expect(game).toContain("ArrowRight");
    expect(game).toContain("pointerup");
    expect(html).toContain('id="up-button"');
    expect(html).toContain('id="down-button"');
  });

  it("uses Approval Tokens, power rerouting and a locked new-gate objective", () => {
    expect(html).toContain("Approval Tokens");
    expect(html).toContain('../bag-bounce/asset-refs.js');
    expect(game).toContain("WILLIT_BAG_BOUNCE_ASSETS?.approvalToken");
    expect(game).toContain("powerUntil");
    expect(game).toContain("HAZARD REROUTED");
    expect(game).toContain('gateEl.classList.toggle("locked", tokenCount > 0)');
  });

  it("does not ship source-sheet character imagery into gameplay", () => {
    expect(css).toContain(".player-head");
    expect(css).toContain(".player-body");
    expect(css).toContain(".hazard.staff");
    expect(game).not.toContain("character-sheet");
    expect(html).not.toContain("character-sheet");
  });

  it("supports pause-safe play and an isolated offline cache", () => {
    expect(game).toContain('document.addEventListener("visibilitychange"');
    expect(game).toContain("function setPause");
    expect(sw).toContain("willitlab-terminal-chase-rc1-baseline-1");
    expect(sw).toContain("../bag-bounce/asset-refs.js");
    expect(sw).toContain('key.startsWith("willitlab-terminal-chase-")');
  });
});
