"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const ATMOSPHERE_ROUTES = [
  "/airlines",
  "/tips",
  "/articles",
  "/about",
  "/faqs",
  "/ask",
  "/size-guides",
  "/products",
] as const;

function usesAirportAtmosphere(pathname: string): boolean {
  return ATMOSPHERE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export default function PageAtmosphereShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const enabled = usesAirportAtmosphere(pathname);

  return (
    <div className={enabled ? "wf-page-atmosphere-shell is-airport" : "wf-page-atmosphere-shell"}>
      {enabled && <div className="wf-page-atmosphere" aria-hidden="true" />}
      {children}
    </div>
  );
}
