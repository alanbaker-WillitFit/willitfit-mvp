import { describe, expect, it } from "vitest";
import { REQUIRED_SHEET_HEADERS, validateSheetHeaders } from "@/services/sheetSchemas";

describe("sheet schema validation", () => {
  it("accepts all required airline headers", () => {
    const result = validateSheetHeaders("01_Airlines", REQUIRED_SHEET_HEADERS["01_Airlines"] ?? []);
    expect(result.valid).toBe(true);
    expect(result.missingHeaders).toEqual([]);
    expect(result.duplicateHeaders).toEqual([]);
  });

  it("reports missing required headers", () => {
    const result = validateSheetHeaders("01_Airlines", ["AirlineID", "AirlineName", "Status"]);
    expect(result.valid).toBe(false);
    expect(result.missingHeaders).toContain("IATA Code");
    expect(result.missingHeaders).toContain("Publish");
  });

  it("reports duplicate headers", () => {
    const headers = [...(REQUIRED_SHEET_HEADERS["08_SEO_Pages"] ?? []), "Title"];
    const result = validateSheetHeaders("08_SEO_Pages", headers);
    expect(result.valid).toBe(false);
    expect(result.duplicateHeaders).toEqual(["Title"]);
  });

  it("ignores blank header cells", () => {
    const headers = [...(REQUIRED_SHEET_HEADERS["06_Travel_Tips"] ?? []), "", "  "];
    const result = validateSheetHeaders("06_Travel_Tips", headers);
    expect(result.valid).toBe(true);
  });

  it("does not impose a schema on an unknown tab", () => {
    const result = validateSheetHeaders("Custom_Tab", ["Anything"]);
    expect(result.valid).toBe(true);
  });
});
