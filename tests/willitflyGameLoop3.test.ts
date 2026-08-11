import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const gameSource = readFileSync(join(process.cwd(), "public/lab/game.js"), "utf8");
const serviceWorkerSource = readFileSync(join(process.cwd(), "public/lab/sw.js"), "utf8");

describe("WillItFly Loop 3 gameplay contract", () => {
  it("uses a craft-specific collision envelope instead of the full sprite rectangle", () => {
    expect(gameSource).toContain("const CRAFT_HITBOX");
    expect(gameSource).toContain("function playerCollisionRect()");
    expect(gameSource).toContain("rect.left + rect.width * inset.left");
    expect(gameSource).toContain("rect.right - rect.width * inset.right");
  });

  it("keeps player control physics stable while route difficulty changes by level", () => {
    expect(gameSource).toContain("const CONTROL = Object.freeze");
    expect(gameSource).toContain("gravity: 0.32");
    expect(gameSource).toContain("flap: -6.55");
    expect(gameSource).toContain("speed: 2.75 + progress * 2.25");
    expect(gameSource).toContain("spawnIntervalMs: 1650 - progress * 250");
  });

  it("caps vertical velocity and uses the collision envelope for route boundaries", () => {
    expect(gameSource).toContain("CONTROL.maxRise");
    expect(gameSource).toContain("CONTROL.maxFall");
    expect(gameSource).toContain("playerRect.top < gameRect.top");
    expect(gameSource).toContain("playerRect.bottom > gameRect.bottom");
  });

  it("ships Loop 3 through a distinct offline cache revision", () => {
    expect(serviceWorkerSource).toContain('willitfly-rc1-lab-loop3-flight-feel');
  });
});
