"use client";

import { useId, useMemo, useState } from "react";
import { Airline } from "@/types";

interface AirlineSelectorProps {
  airlines: Airline[];
  value: Airline | null;
  onChange: (airline: Airline | null) => void;
}

export default function AirlineSelector({ airlines, value, onChange }: AirlineSelectorProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const listId = useId();

  const filtered = useMemo(() => {
    if (!query.trim()) return airlines;
    const q = query.toLowerCase();
    return airlines.filter(
      (a) => a.airlineName.toLowerCase().includes(q) || a.country.toLowerCase().includes(q)
    );
  }, [airlines, query]);

  return (
    <div className="relative">
      <label htmlFor="airline-input" className="font-body text-sm font-medium text-navy-700">
        Airline
      </label>
      <div className="relative mt-1.5">
        <input
          id="airline-input"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          autoComplete="off"
          placeholder="Search for an airline…"
          className="w-full rounded-xl border border-navy-100 bg-white px-4 py-3 font-body text-base text-navy-700 placeholder:text-navy-300 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
          value={value ? value.airlineName : query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 100)}
        />
        <svg
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {open && filtered.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-navy-100 bg-white shadow-liftedh"
        >
          {filtered.map((airline) => (
            <li key={airline.airlineId}>
              <button
                type="button"
                role="option"
                aria-selected={value?.airlineId === airline.airlineId}
                className="flex w-full items-center justify-between px-4 py-3 text-left font-body text-sm text-navy-700 hover:bg-green-50"
                onClick={() => {
                  onChange(airline);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <span>{airline.airlineName}</span>
                <span className="text-xs text-navy-300">{airline.country}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && filtered.length === 0 && (
        <div className="absolute z-10 mt-2 w-full rounded-xl border border-navy-100 bg-white px-4 py-3 font-body text-sm text-navy-300 shadow-soft">
          No airlines match “{query}”.
        </div>
      )}
    </div>
  );
}
