"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/airlines", label: "Airlines" },
  { href: "/tips", label: "Travel tips" },
];

function SuitcaseLogoIcon() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-700 shadow-soft">
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" aria-hidden="true">
        <path
          d="M11 11V8.8C11 6.7 12.7 5 14.8 5h2.4C19.3 5 21 6.7 21 8.8V11"
          stroke="#1FAA59"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="7"
          y="11"
          width="18"
          height="16"
          rx="3"
          fill="none"
          stroke="#1FAA59"
          strokeWidth="2.2"
        />
        <path
          d="M11.5 19.2l3.1 3.1 6.1-7"
          stroke="#1FAA59"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-navy-100 bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3.5" onClick={() => setOpen(false)}>
          <SuitcaseLogoIcon />

          <span className="font-heading text-2xl font-bold tracking-tight text-navy-700">
            WillItFit
          </span>
        </Link>

        <nav className="hidden items-center gap-8 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-sm font-semibold text-navy-600 transition hover:text-green-600"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/#checker"
            className="rounded-full bg-green-500 px-4 py-2 font-body text-sm font-semibold text-white shadow-soft transition hover:bg-green-600"
          >
            Check my bag
          </Link>
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-navy-700 sm:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-navy-100 bg-paper px-4 py-3 sm:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 font-body text-sm font-semibold text-navy-700"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/#checker"
            className="mt-2 block rounded-full bg-green-500 px-4 py-2 text-center font-body text-sm font-semibold text-white"
            onClick={() => setOpen(false)}
          >
            Check my bag
          </Link>
        </nav>
      )}
    </header>
  );
}