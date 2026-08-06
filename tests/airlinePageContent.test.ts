import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("RC5 airline page baggage content", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components", "AirlinePage.tsx"), "utf8");

  it("shows personal, cabin, checked and oversized summary cards", () => {
    expect(source).toContain("Personal item");
    expect(source).toContain("Cabin bag");
    expect(source).toContain("Checked baggage");
    expect(source).toContain("Oversized and specialist baggage");
  });

  it("includes checked baggage and governed descriptions in the fare table", () => {
    expect(source).toContain("Description");
    expect(source).toContain("Checked baggage");
    expect(source).toContain("Weight guidance");
    expect(source).toContain("fare.checkedBag");
  });

  it("links airline pages to the oversized guide", () => {
    expect(source).toContain('/size-guides/oversized-baggage');
  });
});
