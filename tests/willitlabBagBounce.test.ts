import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BAG_BOUNCE_LEVEL_COUNT,
  buildBagBounceProgression,
  getBagBounceLevel,
} from "../lib/willitlabBagBounceProgression";

const root = process.cwd();
const gameSource = readFileSync(join(root, "public/lab/bag-bounce/game.js"), "utf8");
const htmlSource = readFileSync(join(root, "public/lab/bag-bounce/index.html"), "utf8");
const assetSource = readFileSync(join(root, "public/lab/bag-bounce/asset-refs.js"), "utf8");
const swSource = readFileSync(join(root, "public/lab/bag-bounce/sw.js"), "utf8");

describe("WillIt Lab Bag Bounce RC1", () => {
  it("defines exactly 10 progressively harder levels", () => {
    const levels = buildBagBounceProgression();
    expect(BAG_BOUNCE_LEVEL_COUNT).toBe(10);
    expect(levels).toHaveLength(10);
    for (let index = 1; index < levels.length; index += 1) {
      expect(levels[index]!.ballSpeed).toBeGreaterThan(levels[index - 1]!.ballSpeed);
      expect(levels[index]!.paddleWidthRatio).toBeLessThan(levels[index - 1]!.paddleWidthRatio);
    }
  });

  it("introduces moving rows, heavy bags and priority targets in stages", () => {
    expect(getBagBounceLevel(3).movingRows).toBe(false);
    expect(getBagBounceLevel(4).movingRows).toBe(true);
    expect(getBagBounceLevel(4).heavyBagEvery).toBe(0);
    expect(getBagBounceLevel(5).heavyBagEvery).toBeGreaterThan(0);
    expect(getBagBounceLevel(6).priorityBagCount).toBe(0);
    expect(getBagBounceLevel(7).priorityBagCount).toBeGreaterThan(0);
  });

  it("uses the approved round Approval Token, blue bag and approved airport agents", () => {
    expect(assetSource).toContain("data:image/webp;base64,");
    expect(assetSource).toContain("roundApprovalToken");
    expect(assetSource).toContain("1J5nE20QlhaWDv-DpGK5WUQniuXDF7Ham");
    expect(assetSource).toContain("12yX70NOWAO3v4_e-u7UUFM-5FWSCY4yy");
    expect(assetSource).toContain("1a-JzJj_oWIbgdyibteTwKN1yDhKfKVw6");
  });

  it("frames luggage as clearing and redirecting rather than destruction", () => {
    expect(htmlSource).toContain("Redirect blocking bags");
    expect(htmlSource).toContain("conveyors");
    expect(gameSource).toContain("clearBag");
    expect(gameSource).not.toContain("explode");
    expect(gameSource).not.toContain("destroy");
  });

  it("supports touch, keyboard and pause-safe play", () => {
    expect(gameSource).toContain("pointermove");
    expect(gameSource).toContain("ArrowLeft");
    expect(gameSource).toContain("ArrowRight");
    expect(gameSource).toContain("function pauseGame()");
    expect(gameSource).toContain('document.addEventListener("visibilitychange"');
  });

  it("ships through a dedicated Bag Bounce offline cache", () => {
    expect(swSource).toContain('willitlab-bag-bounce-rc1');
    expect(swSource).toContain("round-token-refresh");
  });
});
