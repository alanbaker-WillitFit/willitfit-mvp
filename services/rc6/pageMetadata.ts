type Row = Readonly<Record<string, string>>;

export type Rc6StructuredDataType = "CollectionPage" | "Product";

export type Rc6PageSeo = Readonly<{
  title: string;
  description: string;
  canonicalUrl: string;
  structuredDataType: Rc6StructuredDataType;
  structuredData: Readonly<Record<string, unknown>>;
}>;

const SUPPORTED_STRUCTURED_DATA_TYPES = new Set<Rc6StructuredDataType>(["CollectionPage", "Product"]);

function normalized(value: string | undefined): string {
  return (value ?? "").trim();
}

function validHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function structuredDataType(value: string): Rc6StructuredDataType | null {
  return SUPPORTED_STRUCTURED_DATA_TYPES.has(value as Rc6StructuredDataType)
    ? value as Rc6StructuredDataType
    : null;
}

export function resolveRc6PageSeo(page: Row): Rc6PageSeo | null {
  const title = normalized(page.metaTitle);
  const description = normalized(page.metaDescription);
  const canonicalUrl = normalized(page.canonicalUrl);
  const type = structuredDataType(normalized(page.structuredDataType));
  const name = normalized(page.title) || normalized(page.heroTitle);

  if (!title || !description || !name || !validHttpsUrl(canonicalUrl) || !type) return null;

  const structuredData = Object.freeze({
    "@context": "https://schema.org",
    "@type": type,
    name,
    description,
    url: canonicalUrl,
  });

  return Object.freeze({
    title,
    description,
    canonicalUrl,
    structuredDataType: type,
    structuredData,
  });
}
