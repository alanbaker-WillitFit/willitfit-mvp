"use client";

import { useState } from "react";
import { FaqItem } from "@/types";

export default function FAQSection({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <div className="divide-y divide-navy-100 rounded-card border border-navy-100 bg-white">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.question}>
            <button
              type="button"
              className="flex w-full items-center justify-between px-5 py-4 text-left"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : i)}
            >
              <span className="font-body text-sm font-semibold text-navy-700">{item.question}</span>
              <svg
                className={`h-4 w-4 shrink-0 text-navy-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {isOpen && (
              <p className="px-5 pb-4 font-body text-sm text-navy-500">{item.answer}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
