"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/airlines", label: "Airlines" },
  { href: "/tips", label: "Travel tips" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center"
          aria-label="WillItFit home"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/assets/branding/logo-master.svg"
            alt="WillItFit — Know Before You Go"
            width={240}
            height={73}
            priority
            className="h-auto w-[185px] sm:w-[240px]"
          />
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
            aria-hidden="true"
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
        <nav className="border-t border-navy-100 bg-white px-4 py-3 sm:hidden">
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