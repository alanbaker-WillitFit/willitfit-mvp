import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("WillItFly Lab Loop 2 visual contract", () => {
  it("pins the approved aircraft map to the right-facing asset revision", () => {
    const source = readFileSync(join(root, "public/lab/flight-assets.js"), "utf8");
    expect(source).toContain('const REVISION = "rc1-loop2-right-facing"');
    expect(source.match(/&v=\$\{REVISION\}/g)).toHaveLength(4);
  });

  it("renders the corrected transparent sprites without the old multiply workaround", () => {
    const css = readFileSync(join(root, "public/lab/styles.css"), "utf8");
    expect(css).not.toContain("mix-blend-mode:multiply");
    expect(css).toContain(".player img{width:100%;height:100%;object-fit:contain;filter:drop-shadow");
  });

  it("uses a dedicated Loop 2 service-worker cache revision", () => {
    const source = readFileSync(join(root, "public/lab/sw.js"), "utf8");
    expect(source).toContain('willitfly-rc1-lab-loop2-right-facing');
  });
});
