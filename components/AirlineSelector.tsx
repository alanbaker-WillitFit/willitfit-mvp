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
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();

  const filtered = useMemo(() => {
    if (!query.trim()) return airlines;

    const q = query.toLowerCase();

    return airlines.filter((a) => {
      const searchable = [
        a.airlineName,
        a.country,
        a.iataCode ?? "",
        ...(a.searchTerms ?? []),
      ].map((term) => term.toLowerCase());
      return searchable.some((term) => term.includes(q));
    });
  }, [airlines, query]);

  function selectAirline(airline: Airline) {
    onChange(airline);
    setQuery("");
    setOpen(false);
    setActiveIndex(0);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => Math.max(0, Math.min(filtered.length - 1, current + direction)));
      return;
    }
    if (event.key === "Enter" && open && filtered[activeIndex]) {
      event.preventDefault();
      selectAirline(filtered[activeIndex]);
    }
  }

  return (
    <div className="relative">
      <label htmlFor="airline-input" className="font-body text-sm font-medium text-navy-700">
        Airline
      </label>

      <div className="relative mt-1.5">
        <input
          id="airline-input"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && filtered[activeIndex] ? `${listId}-option-${activeIndex}` : undefined}
          autoComplete="off"
          placeholder="Search for an airline…"
          className="wf-input w-full border border-navy-100 bg-white px-4 py-3 font-body text-base text-navy-700 placeholder:text-navy-300 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
          value={value ? value.airlineName : query}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(0);
            if (value) onChange(null);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>

      {open && filtered.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-navy-100 bg-white shadow-soft"
        >
          {filtered.map((airline) => (
            <li
              key={airline.airlineId}
              id={`${listId}-option-${filtered.indexOf(airline)}`}
              role="option"
              aria-selected={value?.airlineId === airline.airlineId || activeIndex === filtered.indexOf(airline)}
              className={`wf-interactive flex min-h-12 cursor-pointer items-center justify-between px-4 py-3 font-body text-sm text-navy-700 hover:bg-green-50 ${activeIndex === filtered.indexOf(airline) ? "bg-green-50" : ""}`}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(filtered.indexOf(airline))}
              onClick={() => selectAirline(airline)}
            >
                <span>{airline.airlineName}</span>
                <span className="text-xs text-navy-300">{[airline.iataCode, airline.country].filter(Boolean).join(" · ")}</span>
            </li>
          ))}
        </ul>
      )}

      {open && filtered.length === 0 && (
        <div role="status" className="absolute z-10 mt-2 w-full rounded-xl border border-navy-100 bg-white px-4 py-3 font-body text-sm text-navy-300 shadow-soft">
          No airlines match “{query}”.
        </div>
      )}
    </div>
  );
}
