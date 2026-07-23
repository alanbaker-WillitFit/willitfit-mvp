"use client";

import Image from "next/image";
import React from "react";
import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState } from "react";
import { affiliatePlaceholdersForCategory, TravelEssentialCategory, visibleTravelEssentialCategories } from "@/data/travelEssentials";
import type { AffiliateSlot } from "@/types";
import BrandWordmark from "./BrandWordmark";
import { cn } from "@/lib/utils";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function TravelEssentialsSheet({ category, slots = [], onClose }: {
  category: TravelEssentialCategory;
  slots?: AffiliateSlot[];
  onClose: () => void;
}) {
  const displayedSlots = slots.length > 0 ? slots : affiliatePlaceholdersForCategory(category.slug);
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab" || !sheetRef.current) return;
      const focusable = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) { event.preventDefault(); sheetRef.current.focus(); return; }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const sheet = (
    <div className="wf-essentials-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={sheetRef} className="wf-essentials-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <header className="wf-essentials-sheet__header">
          <div><strong><BrandWordmark /></strong><small>Know Before You <span>Go.</span></small></div>
          <button type="button" onClick={onClose} aria-label={`Close ${category.title}`}>&times;</button>
        </header>
        <div className="wf-essentials-sheet__content">
          <h2 id={titleId}>{category.title}</h2>
          <p>Ten governed recommendation slots. Unverified products are never shown.</p>
          <div className="wf-product-slots">
            {displayedSlots.map((slot) => (
              <article key={slot.slotId} className={cn("wf-product-slot", slot.placeholder && "is-placeholder")}>
                <small>Slot {slot.position}</small>
                <strong>{slot.title}</strong>
                <p>{slot.description}</p>
                {slot.placeholder ? (
                  <span>{slot.disclosure}</span>
                ) : (
                  <a href={slot.affiliateUrl} target="_blank" rel="nofollow sponsored noopener">{slot.cta}</a>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  return typeof document === "undefined" ? sheet : createPortal(sheet, document.body);
}

export default function TravelEssentials({ variant = "grid", heading = true, slots = [] }: {
  variant?: "grid" | "rail";
  heading?: boolean;
  slots?: AffiliateSlot[];
}) {
  const [selected, setSelected] = useState<TravelEssentialCategory | null>(null);
  const originRef = useRef<HTMLButtonElement | null>(null);
  function close() {
    setSelected(null);
    requestAnimationFrame(() => originRef.current?.focus());
  }
  return (
    <section className={cn("wf-travel-essentials", `wf-travel-essentials--${variant}`)} aria-labelledby={heading ? `travel-essentials-${variant}` : undefined}>
      {heading && <h2 id={`travel-essentials-${variant}`}>Travel Essentials</h2>}
      <div className="wf-travel-essentials__cards">
        {visibleTravelEssentialCategories.map((category) => (
          <button key={category.id} type="button" className="wf-card wf-essential-card" onClick={(event) => { originRef.current = event.currentTarget; setSelected(category); }} aria-haspopup="dialog">
            <span className="wf-essential-card__image"><Image src={category.imagePath} alt="" fill sizes={variant === "rail" ? "210px" : "(max-width: 767px) 45vw, 300px"} /></span>
            <span className="wf-essential-card__copy"><strong>{category.title}</strong><small>{category.supportingLine}</small></span>
          </button>
        ))}
      </div>
      {selected && <TravelEssentialsSheet category={selected} slots={slots.filter((slot) => slot.category === selected.slug)} onClose={close} />}
    </section>
  );
}
