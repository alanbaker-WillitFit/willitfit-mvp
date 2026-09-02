import { describe, expect, it } from "vitest";
import {
  createRc6RuntimeReader,
  resolveRc6RuntimeSpreadsheetId,
} from "@/services/rc6/runtimeBinding";

describe("RC6 Runtime binding", () => {
  it("requires an explicit spreadsheet ID", () => {
    expect(() => createRc6RuntimeReader("   ")).toThrow("RC6 Runtime spreadsheet ID is required.");
  });

  it("creates a reader without mutating the default Runtime configuration", () => {
    const reader = createRc6RuntimeReader("runtime-rc6-test-id");
    expect(typeof reader).toBe("function");
  });

  it("resolves only the dedicated RC6 Runtime variable", () => {
    expect(resolveRc6RuntimeSpreadsheetId({
      RC6_RUNTIME_SPREADSHEET_ID: " runtime-rc6 ",
      GOOGLE_SHEETS_SPREADSHEET_ID: "runtime-live",
    })).toBe("runtime-rc6");
  });

  it("does not fall back to the production Runtime variable", () => {
    expect(resolveRc6RuntimeSpreadsheetId({
      GOOGLE_SHEETS_SPREADSHEET_ID: "runtime-live",
    })).toBeNull();
  });
});
