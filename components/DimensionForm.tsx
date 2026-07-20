"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Airline, FitResult } from "@/types";
import { checkFit } from "@/lib/fitCalculator";
import { checkerPreset } from "@/lib/checkerPreset";
import { useDimensionForm } from "@/hooks/useDimensionForm";
import { cn } from "@/lib/utils";
import AirlineSelector from "./AirlineSelector";
import FitResultCard from "./FitResultCard";
import TravelEssentials from "./TravelEssentials";

const FIELDS = [
  { key: "heightCm" as const, label: "Height", short: "H" },
  { key: "widthCm" as const, label: "Width", short: "W" },
  { key: "depthCm" as const, label: "Depth", short: "D" },
];

const BAG_TYPES = [
  { type: "cabinBag" as const, icon: "/assets/icons/cabin-bag.svg", title: "Cabin Bag" },
  { type: "personalItem" as const, icon: "/assets/icons/personal-bag.svg", title: "Personal Item" },
];

export default function DimensionForm({ airlines, initialAirline = null }: { airlines: Airline[]; initialAirline?: Airline | null }) {
  const { bagType, setBagType, raw, setField, dimensions, errors, isValid, touchedFields, submitted, blurField, markAllTouched, reset, loadDimensions } = useDimensionForm();
  const [airline, setAirline] = useState<Airline | null>(initialAirline);
  const [fareClass, setFareClass] = useState<string | null>(null);
  const [result, setResult] = useState<FitResult | null>(null);
  const [resultKey, setResultKey] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Record<typeof FIELDS[number]["key"], HTMLInputElement | null>>({ heightCm: null, widthCm: null, depthCm: null });

  useEffect(() => {
    if (!result) return;
    const frame = requestAnimationFrame(() => resultRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [result, resultKey]);

  function invalidate() { setResult(null); }
  function applySelection(selectedAirline: Airline | null, selectedBagType: typeof bagType, selectedFare: string | null) {
    setResult(null);
    if (selectedAirline) loadDimensions(checkerPreset(selectedAirline, selectedBagType, selectedFare));
  }
  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    markAllTouched();
    if (!isValid) {
      const first = FIELDS.find(({ key }) => errors[key]);
      if (first) fieldRefs.current[first.key]?.focus();
      return;
    }
    if (!airline) return;
    setResult(checkFit(dimensions as Required<typeof dimensions>, airline, bagType, fareClass));
    setResultKey(key => key + 1);
  }

  function onReset() {
    reset(); setFareClass(null); setResult(null);
  }

  const state = result?.verdict === "fits" ? "is-success" : result?.verdict === "close" ? "is-warning" : result ? "is-error" : "";

  return (
    <div className="wf-primary-journey">
    <section id="checker" aria-labelledby="decision-module-heading" className={cn("wf-decision-module", state)}>
      <form onSubmit={onSubmit} className="wf-checker-panel">
        <div className="wf-checker-title">
          <span className="wf-checker-title__icon" aria-hidden="true">✓</span>
          <h2 id="decision-module-heading">Check your bag</h2>
          <button type="button" onClick={onReset} className="wf-reset-button">Reset</button>
        </div>

        <div className="wf-checker-fields">
          <div className="wf-checker-step wf-checker-step--airline">
            <p><b>1</b> Select airline</p>
            <AirlineSelector airlines={airlines} value={airline} onChange={selected => { setAirline(selected); setFareClass(null); applySelection(selected, bagType, null); }} />
          </div>

          <fieldset className="wf-checker-step wf-checker-step--bag">
            <legend><b>2</b> Choose bag type</legend>
            <div className="wf-bag-types">
              {BAG_TYPES.map(item => (
                <button key={item.type} type="button" aria-pressed={bagType === item.type} className={cn("wf-bag-type", bagType === item.type && "is-selected")} onClick={() => { setBagType(item.type); setFareClass(null); applySelection(airline, item.type, null); }}>
                  <Image src={item.icon} alt="" width={24} height={24} /> {item.title}
                </button>
              ))}
            </div>
          </fieldset>

          {airline && airline.fareClasses.length > 0 && (
            <div className="wf-fare-field">
              <label htmlFor="fareClass">Fare</label>
              <select id="fareClass" value={fareClass ?? ""} onChange={event => { const nextFare = event.target.value || null; setFareClass(nextFare); applySelection(airline, bagType, nextFare); }}>
                <option value="">Minimum allowance</option>
                {airline.fareClasses.filter(item => item[bagType]).map(item => <option key={item.fareClass}>{item.fareClass}</option>)}
              </select>
            </div>
          )}

          <fieldset className="wf-checker-step wf-checker-step--dimensions">
            <legend><b>3</b> Enter bag dimensions</legend>
            <div className="wf-dimensions">
              {FIELDS.map(field => {
                const showError = touchedFields[field.key] && errors[field.key];
                return (
                  <label key={field.key}>{field.label}
                    <span><input ref={node => { fieldRefs.current[field.key] = node; }} id={field.key} value={raw[field.key]} inputMode="decimal" maxLength={5} autoComplete="off" aria-invalid={Boolean(showError)} aria-describedby={showError ? `${field.key}-error` : undefined} onChange={event => { setField(field.key, event.target.value); invalidate(); }} onBlur={() => blurField(field.key)} /><i>cm</i></span>
                    <small>{field.short}</small>
                    {showError && <em id={`${field.key}-error`} role="alert">{errors[field.key]}</em>}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <button type="submit" className="wf-check-button">Check my bag <span aria-hidden="true">→</span></button>
        {submitted && !airline && <p className="wf-form-error" role="alert">Select an airline before checking your bag.</p>}
      </form>

      {result && <div ref={resultRef} tabIndex={-1} className="wf-result-panel"><FitResultCard key={resultKey} result={result} /></div>}
    </section>
    {result && <div className="wf-travel-essentials-mobile"><TravelEssentials /></div>}
    </div>
  );
}
