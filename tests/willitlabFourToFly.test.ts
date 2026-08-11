import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const html = readFileSync(join(root, "public/lab/four-to-fly/index.html"), "utf8");
const css = readFileSync(join(root, "public/lab/four-to-fly/styles.css"), "utf8");
const game = readFileSync(join(root, "public/lab/four-to-fly/game.js"), "utf8");
const sw = readFileSync(join(root, "public/lab/four-to-fly/sw.js"), "utf8");

describe("WillIt Lab Four to Fly RC1", () => {
  it("ships a standalone 7 by 6 connect-four game", () => {
    expect(html).toContain("Four to <span>Fly</span>");
    expect(game).toContain("const ROWS=6,COLS=7");
    expect(game).toContain("winCells");
    expect(game).toContain("landingRow");
    expect(game).toContain("isDraw");
    expect(() => new Function(game)).not.toThrow();
  });

  it("supports CPU and local two-player play with three CPU levels", () => {
    expect(html).toContain('data-mode="cpu"');
    expect(html).toContain('data-mode="local"');
    expect(html).toContain('value="easy"');
    expect(html).toContain('value="standard"');
    expect(html).toContain('value="hard"');
    expect(game).toContain("chooseCpuColumn");
    expect(game).toContain("minimax");
  });

  it("reuses the approved round Approval Token and keeps the second token WillIt branded", () => {
    expect(html).toContain("../bag-bounce/asset-refs.js");
    expect(game).toContain("WILLIT_BAG_BOUNCE_ASSETS?.approvalToken");
    expect(game).toContain('token.textContent="it"');
    expect(css).toContain("--green:#22C55E");
    expect(css).toContain("--navy:#0D1B3D");
  });

  it("provides keyboard, touch-friendly column controls and win feedback", () => {
    expect(html).toContain('id="columnButtons"');
    expect(game).toContain('e.key==="ArrowLeft"');
    expect(game).toContain('e.key==="ArrowRight"');
    expect(game).toContain('e.key==="Enter"');
    expect(css).toContain(".token.win");
    expect(css).toContain("prefers-reduced-motion");
  });

  it("ships in an isolated offline cache", () => {
    expect(sw).toContain("willitlab-four-to-fly-rc1-baseline-1");
    expect(sw).toContain("./game.js");
    expect(sw).toContain("./styles.css");
    expect(sw).toContain("../bag-bounce/asset-refs.js");
  });
});
