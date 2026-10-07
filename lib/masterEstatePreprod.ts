import snapshot from "@/data/master-estate-page-candidates.snapshot.json";

export type WillItProduct = "FIT" | "FLY" | "SHARED";
export type PublicationState = "HOLD_VALIDATION" | "PUBLISHABLE" | "RETIRED";
export type MasterEstatePageCandidate = (typeof snapshot.pages)[number];

export const MASTER_ESTATE_BASELINE = snapshot.baseline;

export function getPreprodCandidates(product: WillItProduct): MasterEstatePageCandidate[] {
  return snapshot.pages
    .filter((page) => page.product === product || page.product === "SHARED")
    .sort((a, b) => a.rank - b.rank);
}

export function getPreprodCandidate(product: WillItProduct, slug: string): MasterEstatePageCandidate | null {
  return getPreprodCandidates(product).find((page) => page.slug === slug) ?? null;
}

export function getPublishableCandidates(product: WillItProduct): MasterEstatePageCandidate[] {
  return getPreprodCandidates(product).filter((page) => page.publicationState === "PUBLISHABLE" && page.indexable);
}
