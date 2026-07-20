import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const lab = (file: string) => readFileSync(resolve(process.cwd(), "public", "lab", file), "utf8");

describe("WillIt Lab isolation", () => {
  it("contains no score-registration or personal-data form", () => {
    expect(lab("index.html")).not.toMatch(/register-form|type="email"|username/i);
    expect(lab("game.js")).not.toMatch(/register-score|fetch\(|XMLHttpRequest|sendBeacon/);
  });

  it("does not reference core decision, search or airline modules", () => {
    const source = `${lab("index.html")}\n${lab("game.js")}\n${lab("themes.js")}`;
    expect(source).not.toMatch(/fitCalculator|recommendations|googleSheets|airlines\.json|knowledge/i);
  });

  it("stores only device game state under a separate namespace", () => {
    const source = lab("game.js");
    expect(source).toContain("willitfly.bestScore");
    expect(source).toContain("willitfly.localLeaderboard");
    expect(source).not.toContain("willitfit.");
  });

  it("preserves zoom, reduced motion and return navigation", () => {
    expect(lab("index.html")).not.toContain("user-scalable=no");
    expect(lab("index.html")).toContain('href="/lab"');
    expect(lab("styles.css")).toContain("prefers-reduced-motion");
  });
});
