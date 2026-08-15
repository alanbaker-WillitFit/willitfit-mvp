"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RuntimeNavigationRoute } from "@/lib/willitflyNavigation";
import styles from "./WillItFlyExperience.module.css";

const RC1_SHELL_ROUTES: RuntimeNavigationRoute[] = [
  {
    navigationId: "rc1-destinations",
    position: 1,
    displayOrder: 1,
    routeKey: "destinations",
    label: "Destinations",
    path: "/fly",
    linkType: "INTERNAL",
    targetProduct: "WillItFly",
    active: true,
    publish: true,
    surface: "HEADER",
    external: false,
  },
  {
    navigationId: "rc1-sources",
    position: 2,
    displayOrder: 2,
    routeKey: "sources",
    label: "Sources",
    path: "/fly/sources",
    linkType: "INTERNAL",
    targetProduct: "WillItFly",
    active: true,
    publish: true,
    surface: "HEADER",
    external: false,
  },
  {
    navigationId: "rc1-travel-updates",
    position: 3,
    displayOrder: 3,
    routeKey: "travel-updates",
    label: "Travel Updates",
    path: "/fly/travel-updates",
    linkType: "INTERNAL",
    targetProduct: "WillItFly",
    active: true,
    publish: true,
    surface: "HEADER",
    external: false,
  },
];

function Brand() {
  return (
    <span className={styles.brand}>
      <strong>Will<span>It</span>Fly</strong>
      <small>Know Before You Go.</small>
    </span>
  );
}

function NavigationLink({ route, onNavigate }: { route: RuntimeNavigationRoute; onNavigate?: () => void }) {
  const className = route.linkType === "SISTER_PRODUCT" ? styles.sisterProductLink : undefined;

  if (route.external) {
    return (
      <a href={route.path} className={className} onClick={onNavigate}>
        {route.label}
      </a>
    );
  }

  return (
    <Link href={route.path} className={className} onClick={onNavigate}>
      {route.label}
    </Link>
  );
}

export default function WillItFlyHeader({ routes }: { routes: RuntimeNavigationRoute[] }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigationRoutes = useMemo(() => routes.length > 0 ? routes : RC1_SHELL_ROUTES, [routes]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        requestAnimationFrame(() => buttonRef.current?.focus());
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" aria-label="WillItFly home" className={styles.brandLink} onClick={() => setOpen(false)}>
          <Brand />
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary navigation">
          {navigationRoutes.map((route) => <NavigationLink key={route.navigationId} route={route} />)}
        </nav>

        <button
          ref={buttonRef}
          type="button"
          className={styles.menuButton}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="willitfly-mobile-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          <span /><span /><span />
        </button>
      </div>

      {open ? (
        <nav id="willitfly-mobile-navigation" className={styles.mobileMenu} aria-label="Mobile navigation">
          {navigationRoutes.map((route) => (
            <NavigationLink key={route.navigationId} route={route} onNavigate={() => setOpen(false)} />
          ))}
        </nav>
      ) : null}
    </header>
  );
}
