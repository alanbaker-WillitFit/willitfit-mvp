"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface NavDropdownProps {
  label: string;
  baseHref: string; // e.g. "/tips" — the "All" link and query-param base
  categories: string[]; // real category values from the Sheet
  categoryParam?: string; // defaults to "category"
}

// Mixed nav behavior: this renders as a hover/click dropdown when the item
// actually has categories to show. If a page has no categories yet (empty
// Sheet column), it degrades to a plain link — never an empty dropdown.
export default function NavDropdown({ label, baseHref, categories, categoryParam = "category" }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (categories.length === 0) {
    return (
      <Link href={baseHref} className="wf-interactive font-body text-sm font-semibold text-navy-600 hover:text-green-600">
        {label}
      </Link>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="wf-interactive flex min-h-12 items-center gap-1 font-body text-sm font-semibold text-navy-600 hover:text-green-600"
      >
        {label}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={cn("transition-transform", open && "rotate-180")} aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute left-0 top-full z-50 mt-2 min-w-56 rounded-xl border border-navy-100 bg-white p-2 shadow-lg"
        >
          <Link
            href={baseHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center rounded-lg px-3 py-2 font-body text-sm font-semibold text-navy-700 hover:bg-navy-50"
          >
            All {label.toLowerCase()}
          </Link>
          <div className="my-1 border-t border-navy-100" />
          {categories.map((c) => (
            <Link
              key={c}
              href={`${baseHref}?${categoryParam}=${encodeURIComponent(c)}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-3 py-2 font-body text-sm text-navy-600 hover:bg-navy-50 hover:text-green-600"
            >
              {c}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
