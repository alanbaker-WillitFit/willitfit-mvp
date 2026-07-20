import { describe, expect, it } from "vitest";
import { findRoutingCollisions, hasRoutingCollision } from "@/lib/routingCollisions";

describe("routing collisions", () => {
  it("reports shared airline and SEO slugs once in stable order", () => {
    expect(findRoutingCollisions(["ryanair", "easyjet"], ["easyjet", "easyjet", "bags"])).toEqual([
      { slug: "easyjet", resources: ["airline", "seo-page"] },
    ]);
  });

  it("fails closed only when both resource types own the slug", () => {
    expect(hasRoutingCollision("ryanair", ["ryanair"], ["ryanair"])).toBe(true);
    expect(hasRoutingCollision("ryanair", ["ryanair"], ["bags"])).toBe(false);
  });
});
