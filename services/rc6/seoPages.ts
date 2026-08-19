import { readRc6Dataset } from "./runtimeReader";

type RuntimeRow = Record<string, string>;

export type Rc6SeoPage = Readonly<{
  id: string;
  slug: string;
  pageTitle: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  canonicalUrl: string;
}>;

function truthy(value: string | undefined): boolean {
  return ["yes", "true", "1", "active", "published", "live"].includes(String(value ?? "").trim().toLowerCase());
}

function approved(value: string | undefined): boolean {
  return ["approved", "published", "live"].includes(String(value ?? "").trim().toLowerCase());
}

export async function getRc6SeoPages(): Promise<Rc6SeoPage[]> {
  const result = await readRc6Dataset<RuntimeRow>("seoPages");
  if (result.kind !== "READY_WITH_ROWS") return [];

  const pages = result.rows
    .filter((row) => truthy(row.Active) && truthy(row.Publish) && approved(row["Review Status"]))
    .map((row) => ({
      id: String(row["SEO ID"] ?? "").trim(),
      slug: String(row.Slug ?? "").trim(),
      pageTitle: String(row["Page Title"] ?? "").trim(),
      metaTitle: String(row["Meta Title"] ?? "").trim(),
      metaDescription: String(row["Meta Description"] ?? "").trim(),
      h1: String(row.H1 ?? "").trim(),
      canonicalUrl: String(row["Canonical URL"] ?? "").trim(),
    }))
    .filter((page) => page.id && page.slug && page.pageTitle && page.metaTitle && page.metaDescription && page.h1 && /^https:\/\//i.test(page.canonicalUrl));

  const duplicateSlugs = new Set<string>();
  const seen = new Set<string>();
  for (const page of pages) {
    if (seen.has(page.slug)) duplicateSlugs.add(page.slug);
    else seen.add(page.slug);
  }
  return pages.filter((page) => !duplicateSlugs.has(page.slug));
}
