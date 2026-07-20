export type RoutingCollision = {
  slug: string;
  resources: ["airline", "seo-page"];
};

export function findRoutingCollisions(
  airlineSlugs: readonly string[],
  seoPageSlugs: readonly string[]
): RoutingCollision[] {
  const airlineSet = new Set(airlineSlugs.filter(Boolean));
  const collisions = Array.from(new Set(seoPageSlugs.filter((slug) => airlineSet.has(slug))));
  return collisions.sort().map((slug) => ({ slug, resources: ["airline", "seo-page"] }));
}

export function hasRoutingCollision(
  slug: string,
  airlineSlugs: readonly string[],
  seoPageSlugs: readonly string[]
): boolean {
  return airlineSlugs.includes(slug) && seoPageSlugs.includes(slug);
}
