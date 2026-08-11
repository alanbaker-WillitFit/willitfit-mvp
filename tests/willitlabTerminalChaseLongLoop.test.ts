import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildTerminalChaseProgression } from "../lib/willitlabTerminalChaseProgression";

const root = process.cwd();
const game = readFileSync(join(root, "public/lab/terminal-chase/game.js"), "utf8");
const css = readFileSync(join(root, "public/lab/terminal-chase/refinement.css"), "utf8");
const sw = readFileSync(join(root, "public/lab/terminal-chase/sw.js"), "utf8");

describe("Terminal Chase long refinement loop 1", () => {
  it("makes level one an orientation level and preserves progressive pressure", () => {
    const levels = buildTerminalChaseProgression();
    expect(levels[0]!.enemyCount).toBe(1);
    expect(levels[4]!.enemyCount).toBe(3);
    expect(levels[9]!.enemyCount).toBe(5);
    expect(levels[0]!.enemySpeed).toBeLessThan(levels[4]!.enemySpeed);
    expect(levels[4]!.enemySpeed).toBeLessThan(levels[9]!.enemySpeed);
  });

  it("protects player restarts and staggers hazard releases", () => {
    expect(game).toContain("const SPAWN_GRACE_MS = 1700");
    expect(game).toContain("const HAZARD_RELEASE_GAP_MS = 520");
    expect(game).toContain("releaseAt");
    expect(game).toContain("graceUntil");
    expect(game).toContain("START ROUTE · PROTECTED");
    expect(css).toContain(".player.protected");
    expect(css).toContain(".hazard.waiting");
  });

  it("chooses hazard starts away from the player and avoids forced reversals", () => {
    expect(game).toContain("function chooseHazardStarts");
    expect(game).toContain("gridDistance(cell, player) >= 8");
    expect(game).toContain("gridDistance(candidate, other) >= 3");
    expect(game).toContain("const withoutReverse = options.filter");
    expect(game).toContain("function targetForHazard");
  });

  it("fixes tunnel wrapping and warns before moving barriers close", () => {
    expect(game).toContain("const TUNNEL_ROW = 7");
    expect(game).toContain("function isTunnelMove");
    expect(game).toContain("function normalizeMoveX");
    expect(game).toContain("const BARRIER_WARNING_MS = 650");
    expect(game).toContain("barrier-warning");
    expect(css).toContain(".cell.barrier-warning");
    expect(css).toContain(".tunnel-mouth");
  });

  it("gives levels one, five and ten distinct presentation states", () => {
    expect(game).toContain('theme: "tutorial"');
    expect(game).toContain('theme: "midpoint"');
    expect(game).toContain('theme: "finale"');
    expect(game).toContain('level === 10 ? "FINAL TERMINAL"');
    expect(css).toContain('.game[data-theme="tutorial"]');
    expect(css).toContain('.game[data-theme="midpoint"]');
    expect(css).toContain('.game[data-theme="finale"]');
    expect(css).toContain(".game.final-payoff");
  });

  it("keeps the refinement inside the Terminal Chase cache namespace", () => {
    expect(sw).toContain('willitlab-terminal-chase-');
    expect(sw).toContain('./refinement.css');
  });
});
