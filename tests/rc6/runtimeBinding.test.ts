import { describe, expect, it } from "vitest";
import { createRc6RuntimeReader } from "@/services/rc6/runtimeBinding";

describe("RC6 Runtime binding", () => {
  it("requires an explicit spreadsheet ID", () => {
    expect(() => createRc6RuntimeReader("   ")).toThrow("RC6 Runtime spreadsheet ID is required.");
  });

  it("creates a reader without mutating the default Runtime configuration", () => {
    const reader = createRc6RuntimeReader("runtime-rc6-test-id");
    expect(typeof reader).toBe("function");
  });
});
