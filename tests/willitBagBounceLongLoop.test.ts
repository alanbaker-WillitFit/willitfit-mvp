import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const gameSource = readFileSync(join(root, "public/lab/bag-bounce/game.js"), "utf8");
const cssSource = readFileSync(join(root, "public/lab/bag-bounce/styles.css"), "utf8");
const swSource = readFileSync(join(root, "public/lab/bag-bounce/sw.js"), "utf8");

describe("Bag Bounce long-loop refinement contract", () => {
  it("uses a tighter token hitbox and bounded paddle-angle rebound", () => {
    expect(gameSource).toContain("const inset = size * 0.16");
    expect(gameSource).toContain("const maxAngle = Math.PI * 0.36");
    expect(gameSource).toContain("Math.abs(tokenVX) < speed * 0.22");
  });

  it("freezes moving-row time while paused", () => {
    expect(gameSource).toContain("worldPauseOffset += Math.max(0, now - pausedAt)");
    expect(gameSource).toContain("const worldNow = now - worldPauseOffset");
    expect(gameSource).toContain("positionBags(worldNow)");
  });

  it("routes cleared baggage all the way toward a side conveyor", () => {
    expect(gameSource).toContain("fieldRect.width / 2 + bag.width");
    expect(gameSource).toContain('bag.el.classList.add("cleared")');
    expect(cssSource).toContain("@keyframes toBelt");
    expect(cssSource).toContain("translateX(var(--clear-x,0))");
  });

  it("gives level completion a visible route-clear beat before advancing", () => {
    expect(gameSource).toContain("function beginLevelTransition()");
    expect(gameSource).toContain('game.classList.add("route-clear")');
    expect(gameSource).toContain('flash(level >= LEVEL_COUNT ? "ROUTE CLEAR" : "BELT CLEAR")');
    expect(cssSource).toContain("@keyframes loadRoute");
  });

  it("uses the approved standard suitcase art inside the obstacle field", () => {
    expect(gameSource).toContain("assets.standardBag");
    expect(gameSource).toContain('img.className = "bag-art"');
    expect(cssSource).toContain(".bag-art");
  });

  it("ships through its own long-loop offline cache revision", () => {
    expect(swSource).toContain('willitlab-bag-bounce-rc1-longloop-1');
  });
});
