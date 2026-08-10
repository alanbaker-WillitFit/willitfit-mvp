import { describe, expect, it } from "vitest";

import {
  isSisterProductRoute,
  resolvePublishedNavigationRoutes,
  type RuntimeNavigationRoute,
} from "../lib/willitflyNavigation";

const baseRoute: RuntimeNavigationRoute = {
  navigationId: "NAV-001",
  position: 1,
  displayOrder: 1,
  routeKey: "DESTINATIONS",
  label: "Destinations",
  path: "/fly/destinations",
  linkType: "INTERNAL",
  targetProduct: "WillItFly",
  active: true,
  publish: true,
  surface: "GLOBAL",
  external: false,
};

describe("WillItFly governed navigation", () => {
  it("renders only active published routes in governed order", () => {
    const routes: RuntimeNavigationRoute[] = [
      { ...baseRoute, navigationId: "NAV-002", position: 2, displayOrder: 2, label: "Airports" },
      { ...baseRoute, navigationId: "NAV-003", position: 3, displayOrder: 3, label: "Ask WillItFly", publish: false },
      baseRoute,
    ];

    expect(resolvePublishedNavigationRoutes(routes).map((route) => route.label)).toEqual([
      "Destinations",
      "Airports",
    ]);
  });

  it("suppresses feature-controlled routes unless enabled", () => {
    const lab = { ...baseRoute, navigationId: "NAV-LAB", featureFlag: "WILLIT_LAB", label: "Lab" };

    expect(resolvePublishedNavigationRoutes([lab])).toEqual([]);
    expect(resolvePublishedNavigationRoutes([lab], { WILLIT_LAB: true })).toHaveLength(1);
  });

  it("identifies the WillItFit sister-product link", () => {
    const fit = {
      ...baseRoute,
      navigationId: "NAV-FIT",
      linkType: "SISTER_PRODUCT" as const,
      targetProduct: "WillItFit",
      label: "WillItFit",
      path: "https://will-it-fit.net",
      external: true,
    };

    expect(isSisterProductRoute(fit)).toBe(true);
  });
});
