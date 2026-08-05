"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { GovernedNavigationItem } from "@/services/navigation";
import BrandWordmark from "./BrandWordmark";

interface HeaderProps {
  tipCategories: string[];
  navigationItems: GovernedNavigationItem[];
}

const LINKS = [
  ["WillitFit", "/"], ["Airlines", "/airlines"], ["Ask WillitFit", "/ask"],
  ["Articles", "/articles"], ["Travel Essentials", "/products"], ["About", "/about"], ["FAQs", "/ask"],
] as const;

function Brand() {
  return (
    <span className="wf-brand" data-recovery-asset="temporary-coded-wordmark">
      <svg viewBox="0 0 34 42" aria-hidden="true"><path d="M10 9V6a7 7 0 0 1 14 0v3M5 9h24v29H5z" /><path className="wf-brand__tick" d="m10 23 5 5 10-13" /></svg>
      <span><strong><BrandWordmark /></strong><small>Know Before You <i>Go.</i></small></span>
    </span>
  );
}

function GovernedLink({ item, onNavigate }: { item: GovernedNavigationItem; onNavigate?: () => void }) {
  if (!item.active) {
    return (
      <span aria-disabled="true" style={{ color: "#8a94a6", cursor: "not-allowed", opacity: 0.75 }}>
        {item.label} <small style={{ fontSize: "0.68em" }}>Coming soon</small>
      </span>
    );
  }

  return (
    <a
      href={item.url}
      target={item.openInNewTab ? "_blank" : undefined}
      rel={item.openInNewTab ? "noopener noreferrer" : undefined}
      onClick={onNavigate}
    >
      {item.label}
    </a>
  );
}

export default function Header({ tipCategories: _tipCategories, navigationItems }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        requestAnimationFrame(() => menuButton.current?.focus());
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="wf-header">
      <div className="wf-container wf-header__inner">
        <Link href="/" aria-label="WillitFit home" onClick={() => setOpen(false)}><Brand /></Link>
        <nav aria-label="Primary navigation" className="wf-desktop-nav">
          <Link href="/" aria-current="page"><BrandWordmark /></Link>
          {LINKS.slice(1, 3).map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}
          <Link href="/tips">Travel Tips</Link>
          {LINKS.slice(3).map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}
          {navigationItems.map((item) => <GovernedLink key={item.id} item={item} />)}
        </nav>
        <button ref={menuButton} type="button" className="wf-menu-button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(value => !value)}>
          <span /><span /><span />
        </button>
      </div>
      {open && (
        <nav id="mobile-navigation" className="wf-mobile-menu" aria-label="Mobile navigation">
          <Link href="/" onClick={() => setOpen(false)}><BrandWordmark /></Link>
          {LINKS.slice(1, 3).map(([label, href]) => <Link key={label} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          <Link href="/tips" onClick={() => setOpen(false)}>Travel Tips</Link>
          {LINKS.slice(3).map(([label, href]) => <Link key={label} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          {navigationItems.map((item) => <GovernedLink key={item.id} item={item} onNavigate={() => setOpen(false)} />)}
        </nav>
      )}
    </header>
  );
}
