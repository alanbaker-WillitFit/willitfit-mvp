import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const gameSource = readFileSync(join(root, "public/lab/game.js"), "utf8");
const htmlSource = readFileSync(join(root, "public/lab/index.html"), "utf8");
const cssSource = readFileSync(join(root, "public/lab/styles.css"), "utf8");
const serviceWorkerSource = readFileSync(join(root, "public/lab/sw.js"), "utf8");

describe("WillItFly Loop 4 refinement contract", () => {
  it("provides explicit pause and resume controls for touch and keyboard players", () => {
    expect(htmlSource).toContain('id="pause-button"');
    expect(htmlSource).toContain('id="resume-overlay"');
    expect(gameSource).toContain("function pauseGame()");
    expect(gameSource).toContain("function resumeGame()");
    expect(gameSource).toContain('["KeyP", "Escape"]');
  });

  it("freezes moving-gate time while paused instead of jumping on resume", () => {
    expect(gameSource).toContain("const pausedDuration = Math.max(0, now - pausedAt)");
    expect(gameSource).toContain("obstacle.bornAt += pausedDuration");
    expect(gameSource).toContain("if (!running || paused) return");
  });

  it("fails safe on browser visibility and viewport changes", () => {
    expect(gameSource).toContain('document.addEventListener("visibilitychange"');
    expect(gameSource).toContain("if (document.hidden) pauseGame()");
    expect(gameSource).toContain('window.addEventListener("resize", handleViewportChange)');
  });

  it("respects reduced-motion presentation without changing gameplay progression", () => {
    expect(gameSource).toContain('window.matchMedia("(prefers-reduced-motion: reduce)").matches');
    expect(gameSource).toContain("if (reducedMotion) return");
    expect(cssSource).toContain("@media(prefers-reduced-motion:reduce)");
    expect(cssSource).toContain(".season-layer{display:none}");
  });

  it("ships the refinement through a distinct Loop 4 offline cache", () => {
    expect(serviceWorkerSource).toContain('willitfly-rc1-lab-loop4-pause-polish');
  });
});
