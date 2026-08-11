import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const html = readFileSync(join(root, "public/lab/bag-bounce/index.html"), "utf8");
const controller = readFileSync(join(root, "public/lab/bag-bounce/feedback.js"), "utf8");
const css = readFileSync(join(root, "public/lab/bag-bounce/feedback.css"), "utf8");
const game = readFileSync(join(root, "public/lab/bag-bounce/game.js"), "utf8");
const sw = readFileSync(join(root, "public/lab/bag-bounce/sw.js"), "utf8");

describe("Bag Bounce moment feedback contract", () => {
  it("keeps feedback outside the certified gameplay file", () => {
    expect(html).toContain('href="feedback.css"');
    expect(html).toContain('src="feedback.js"');
    expect(game).not.toContain("comboWindowMs");
    expect(game).not.toContain("feedback-final-clear");
  });

  it("reacts to heavy, priority, cleared-bag and lost-token states", () => {
    expect(controller).toContain('classList.contains("damaged")');
    expect(controller).toContain('classList.contains("priority")');
    expect(controller).toContain('classList.contains("cleared")');
    expect(controller).toContain('TOKEN RETURNED · STREAK RESET');
    expect(controller).toContain('HEAVY BAG · ONE MORE HIT');
    expect(controller).toContain('PRIORITY BAG CLEARED');
  });

  it("adds a bounded bag streak without changing score rules", () => {
    expect(controller).toContain("const comboWindowMs = 1400");
    expect(controller).toContain("BAG STREAK");
    expect(controller).toContain("combo < 3");
    expect(controller).toContain("resetCombo");
    expect(game).toContain('score += bag.type === "heavy" ? 60 : bag.type === "personal" ? 80 : 50');
  });

  it("gives the final route a distinct level-10 payoff", () => {
    expect(controller).toContain('text === "ROUTE CLEAR" && currentLevel() === 10');
    expect(controller).toContain('FINAL ROUTE CLEAR · BAG TO LOADING');
    expect(controller).toContain('game.classList.add("final-payoff")');
    expect(css).toContain(".game.feedback-final-clear::after");
    expect(css).toContain(".game.final-payoff .player-bag");
  });

  it("honours reduced motion and ships through the offline package", () => {
    expect(css).toContain("@media(prefers-reduced-motion:reduce)");
    expect(sw).toContain('willitlab-bag-bounce-rc1-feedback-5');
    expect(sw).toContain('./feedback.css');
    expect(sw).toContain('./feedback.js');
  });
});