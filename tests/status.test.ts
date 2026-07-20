import { describe, expect, it } from "vitest";
import { parseStatus } from "../services/airlines";

describe("parseStatus", () => {
  it.each([undefined, "", "Pending", "typo"])("defaults %s to Draft", (value) => {
    expect(parseStatus(value)).toBe("Draft");
  });
  it.each(["Live", "active", "approved", "published"])("publishes explicit %s", (value) => {
    expect(parseStatus(value)).toBe("Live");
  });
  it.each(["Archived", "inactive", "retired"])("archives %s", (value) => {
    expect(parseStatus(value)).toBe("Archived");
  });
});
