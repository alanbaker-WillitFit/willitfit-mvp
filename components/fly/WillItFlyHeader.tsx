"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { RuntimeNavigationRoute } from "@/lib/willitflyNavigation";
import styles from "./WillItFlyExperience.module.css";

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
          {routes.map((route) => <NavigationLink key={route.navigationId} route={route} />)}
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
          {routes.length > 0 ? routes.map((route) => (
            <NavigationLink key={route.navigationId} route={route} onNavigate={() => setOpen(false)} />
          )) : (
            <span className={styles.menuEmpty}>Navigation is not published yet.</span>
          )}
        </nav>
      ) : null}
    </header>
  );
}
