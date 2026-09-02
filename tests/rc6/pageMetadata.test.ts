import { describe, expect, it } from "vitest";
import { resolveRc6PageSeo } from "@/services/rc6/pageMetadata";
import { safeJsonLd } from "@/lib/jsonLd";

type Row = Record<string, string>;

function page(overrides: Partial<Row> = {}): Row {
  return {
    title: "Synthetic Packing Cubes",
    heroTitle: "Synthetic Packing Cubes for RC6 Testing",
    metaTitle: "Synthetic Packing Cubes | RC6 Test",
    metaDescription: "Synthetic test page. Not for public indexing or production publication.",
    canonicalUrl: "https://example.com/test/packing-cubes",
    structuredDataType: "CollectionPage",
    ...overrides,
  };
}

describe("RC6 governed page metadata", () => {
  it("resolves CollectionPage metadata and JSON-LD from governed fields", () => {
    const resolved = resolveRc6PageSeo(page());
    expect(resolved).toMatchObject({
      title: "Synthetic Packing Cubes | RC6 Test",
      canonicalUrl: "https://example.com/test/packing-cubes",
      structuredDataType: "CollectionPage",
    });
    expect(resolved?.structuredData).toEqual({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Synthetic Packing Cubes",
      description: "Synthetic test page. Not for public indexing or production publication.",
      url: "https://example.com/test/packing-cubes",
    });
  });

  it("supports the governed Product structured-data type", () => {
    expect(resolveRc6PageSeo(page({ structuredDataType: "Product" }))?.structuredDataType).toBe("Product");
  });

  it("fails closed when required metadata is blank", () => {
    expect(resolveRc6PageSeo(page({ metaTitle: "" }))).toBeNull();
    expect(resolveRc6PageSeo(page({ metaDescription: "" }))).toBeNull();
  });

  it("fails closed on non-HTTPS or malformed canonical URLs", () => {
    expect(resolveRc6PageSeo(page({ canonicalUrl: "http://example.com/test" }))).toBeNull();
    expect(resolveRc6PageSeo(page({ canonicalUrl: "/test/packing-cubes" }))).toBeNull();
    expect(resolveRc6PageSeo(page({ canonicalUrl: "not a url" }))).toBeNull();
  });

  it("fails closed on an unsupported structured-data type", () => {
    expect(resolveRc6PageSeo(page({ structuredDataType: "Thing" }))).toBeNull();
  });

  it("falls back from title to heroTitle only for structured-data name", () => {
    const resolved = resolveRc6PageSeo(page({ title: "", heroTitle: "Fallback hero" }));
    expect(resolved?.structuredData.name).toBe("Fallback hero");
  });

  it("serializes governed structured data safely for script embedding", () => {
    const resolved = resolveRc6PageSeo(page({
      title: "</script><script>alert(1)</script>",
      metaDescription: "a\u2028b\u2029c",
    }));
    const serialized = safeJsonLd(resolved?.structuredData);
    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script>");
    expect(serialized).toContain("\\u2028");
    expect(serialized).toContain("\\u2029");
  });
});
