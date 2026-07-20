import { describe, expect, it } from "vitest";
import { safeJsonLd } from "@/lib/jsonLd";

describe("safeJsonLd", () => {
  it("escapes script-breaking less-than characters", () => {
    const output = safeJsonLd({ value: "</script><script>alert(1)</script>" });
    expect(output).not.toContain("</script>");
    expect(output).toContain("\\u003c/script>");
  });

  it("escapes JavaScript line separators", () => {
    const output = safeJsonLd({ value: "a\u2028b\u2029c" });
    expect(output).toContain("\\u2028");
    expect(output).toContain("\\u2029");
  });
});
