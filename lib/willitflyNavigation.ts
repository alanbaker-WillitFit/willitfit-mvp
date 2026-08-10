export type WillItFlyNavigationLinkType = "INTERNAL" | "SISTER_PRODUCT";

export type RuntimeNavigationRoute = {
  navigationId: string;
  position: number;
  displayOrder: number;
  routeKey: string;
  label: string;
  path: string;
  linkType: WillItFlyNavigationLinkType;
  targetProduct: string;
  active: boolean;
  publish: boolean;
  featureFlag?: string;
  surface: string;
  external: boolean;
};

export type NavigationFeatureState = Record<string, boolean>;

export function isPublishedNavigationRoute(
  route: RuntimeNavigationRoute,
  features: NavigationFeatureState = {},
): boolean {
  if (!route.active || !route.publish) {
    return false;
  }

  if (!Number.isInteger(route.position) || route.position < 1) {
    return false;
  }

  if (!Number.isFinite(route.displayOrder)) {
    return false;
  }

  const featureFlag = route.featureFlag?.trim();
  if (featureFlag && features[featureFlag] !== true) {
    return false;
  }

  return Boolean(route.label.trim() && route.path.trim());
}

export function resolvePublishedNavigationRoutes(
  routes: RuntimeNavigationRoute[],
  features: NavigationFeatureState = {},
): RuntimeNavigationRoute[] {
  return routes
    .filter((route) => isPublishedNavigationRoute(route, features))
    .sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }

      if (a.position !== b.position) {
        return a.position - b.position;
      }

      return a.navigationId.localeCompare(b.navigationId);
    });
}

export function isSisterProductRoute(route: RuntimeNavigationRoute): boolean {
  return route.linkType === "SISTER_PRODUCT" || route.targetProduct === "WillItFit";
}
