"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { Airline, AffiliateSlot, FitResult, LabConfiguration, SpecialBaggageResult } from "@/types";
import { checkFit } from "@/lib/fitCalculator";
import { checkerPreset } from "@/lib/checkerPreset";
import { useDimensionForm } from "@/hooks/useDimensionForm";
import { cn } from "@/lib/utils";
import AirlineSelector from "./AirlineSelector";
import FitResultCard from "./FitResultCard";
import TravelEssentials from "./TravelEssentials";
import { airlineHasBagType } from "@/lib/dimensions";
import type { RuntimeContentRecord } from "@/types";

const FIELDS = [
  { key: "heightCm" as const, label: "Height", short: "H" },
  { key: "widthCm" as const, label: "Width", short: "W" },
  { key: "depthCm" as const, label: "Depth", short: "D" },
];

const BAG_TYPES = [
  { type: "personalItem" as const, icon: "/assets/icons/personal-item-photo-rc4.jpg", title: "Personal Item" },
  { type: "cabinBag" as const, icon: "/assets/icons/cabin-bag-photo-rc4.jpg", title: "Cabin Bag" },
  { type: "checkedBag" as const, icon: "/assets/icons/cabin-bag-photo-rc4.jpg", title: "Checked Bag" },
];

function availableBagType(airline: Airline) {
  return BAG_TYPES.find((item) => airlineHasBagType(airline, item.type))?.type ?? "personalItem";
}

function decimalInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [whole = "", ...decimalParts] = cleaned.split(".");
  return decimalParts.length ? `${whole}.${decimalParts.join("")}` : whole;
}

export function selectedWeightLimit(airline: Airline | null, bagType: typeof BAG_TYPES[number]["type"], fareClass: string | null): number | null {
  if (!airline) return null;
  const fare = fareClass
    ? airline.fareClasses.find((item) => item.fareClass.toLowerCase() === fareClass.toLowerCase() && item[bagType])
    : null;

  if (fare) {
    return bagType === "checkedBag" ? fare.checkedWeightLimitKg ?? null : fare.weightLimitKg;
  }

  return bagType === "checkedBag" ? airline.checkedWeightLimitKg ?? null : airline.weightLimitKg;
}

export default function DimensionForm({
  airlines,
  initialAirline = null,
  notices = [],
  hints = [],
  affiliateSlots = [],
  labConfigs,
  specialBaggageResults = [],
}: {
  airlines: Airline[];
  initialAirline?: Airline | null;
  notices?: RuntimeContentRecord[];
  hints?: RuntimeContentRecord[];
  affiliateSlots?: AffiliateSlot[];
  labConfigs?: LabConfiguration[];
  specialBaggageResults?: SpecialBaggageResult[];
}) {
  const { bagType, setBagType, raw, setField, dimensions, errors, isValid, touchedFields, submitted, blurField, markAllTouched, reset, loadDimensions } = useDimensionForm();
  const [airline, setAirline] = useState<Airline | null>(initialAirline);
  const [fareClass, setFareClass] = useState<string | null>(null);
  const [weightRaw, setWeightRaw] = useState("");
  const [weightTouched, setWeightTouched] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [selectedSpecial, setSelectedSpecial] = useState<string | null>(null);
  const [result, setResult] = useState<FitResult | null>(null);
  const [resultKey, setResultKey] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Record<typeof FIELDS[number]["key"], HTMLInputElement | null>>({ heightCm: null, widthCm: null, depthCm: null });

  const weightLimitKg = selectedWeightLimit(airline, bagType, fareClass);
  const weightSupported = weightLimitKg !== null;
  const showWeightStep = bagType === "checkedBag" || weightSupported;
  const weightRequired = bagType === "checkedBag" && weightSupported;
  const weightValue = weightRaw === "" ? null : Number(weightRaw);
  const weightError = weightRequired && weightRaw === ""
    ? "Enter your checked-bag weight in kilograms."
    : weightRaw !== "" && (!Number.isFinite(weightValue) || weightValue! <= 0 || weightValue! > 999)
      ? "Enter a valid weight in kilograms."
      : null;

  useEffect(() => {
    if (!initialAirline || airlineHasBagType(initialAirline, bagType)) return;
    const nextType = availableBagType(initialAirline);
    setBagType(nextType);
    loadDimensions(checkerPreset(initialAirline, nextType, null));
  }, [bagType, initialAirline, loadDimensions, setBagType]);

  useEffect(() => {
    if (!result) return;
    const frame = requestAnimationFrame(() => resultRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [result, resultKey]);

  function invalidate() { setResult(null); }
  function applySelection(selectedAirline: Airline | null, selectedBagType: typeof bagType, selectedFare: string | null) {
    setResult(null);
    setWeightRaw("");
    setWeightTouched(false);
    setSelectedSpecial(null);
    if (selectedAirline && airlineHasBagType(selectedAirline, selectedBagType)) {
      loadDimensions(checkerPreset(selectedAirline, selectedBagType, selectedFare));
    }
  }
  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    markAllTouched();
    setWeightTouched(true);
    if (!isValid || weightError) {
      const first = FIELDS.find(({ key }) => errors[key]);
      if (first) fieldRefs.current[first.key]?.focus();
      return;
    }
    if (!airline || !airlineHasBagType(airline, bagType)) return;
    setResult(checkFit(dimensions as Required<typeof dimensions>, airline, bagType, fareClass, weightSupported ? weightValue : null));
    setResultKey(key => key + 1);
  }

  function onReset() {
    reset();
    setAirline(initialAirline);
    setFareClass(null);
    setWeightRaw("");
    setWeightTouched(false);
    setAdvancedOpen(false);
    setSelectedSpecial(null);
    setResult(null);
  }

  const state = result?.verdict === "fits" ? "is-success" : result?.verdict === "close" ? "is-warning" : result ? "is-error" : "";
  const selectedSpecialResult = selectedSpecial
    ? specialBaggageResults.find((item) => item.resultId === selectedSpecial) ?? null
    : null;

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
              <AirlineSelector airlines={airlines} value={airline} onChange={selected => {
                setAirline(selected);
                setFareClass(null);
                if (selected && !airlineHasBagType(selected, bagType)) {
                  const nextType = availableBagType(selected);
                  setBagType(nextType);
                  applySelection(selected, nextType, null);
                } else {
                  applySelection(selected, bagType, null);
                }
              }} />
            </div>

            <fieldset className="wf-checker-step wf-checker-step--bag">
              <legend><b>2</b> Choose bag type</legend>
              <div className="wf-bag-types">
                {BAG_TYPES.map(item => {
                  const unavailable = !airline || !airlineHasBagType(airline, item.type);
                  return (
                    <button
                      key={item.type}
                      type="button"
                      disabled={unavailable}
                      aria-pressed={bagType === item.type}
                      className={cn("wf-bag-type", bagType === item.type && "is-selected")}
                      onClick={() => {
                        if (unavailable) return;
                        setBagType(item.type);
                        setFareClass(null);
                        applySelection(airline, item.type, null);
                      }}
                    >
                      <Image
                        className={cn("wf-bag-type__icon", item.type === "checkedBag" && "scale-125")}
                        src={item.icon}
                        alt=""
                        width={44}
                        height={44}
                        priority
                      />
                      {item.title}
                    </button>
                  );
                })}
              </div>
              {!airline && <p className="mt-2 text-xs font-medium text-navy-400">Select an airline to see its available bag types.</p>}
            </fieldset>

            {airline && !airlineHasBagType(airline, bagType) && (() => {
              const notice = notices.find((item) => item.section === `${bagType}-unavailable`);
              return notice ? <div className="wf-form-error" role="status"><strong>{notice.title}</strong><p>{notice.body}</p></div> : null;
            })()}

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

            {showWeightStep && (
              <div className="wf-checker-step wf-checker-step--weight">
                {weightSupported ? (
                  <>
                    <label htmlFor="weightKg"><b>4</b> Weight (kg)<span><input id="weightKg" value={weightRaw} inputMode="decimal" maxLength={5} autoComplete="off" aria-required={weightRequired} aria-invalid={Boolean(weightTouched && weightError)} onChange={event => { setWeightRaw(decimalInput(event.target.value)); invalidate(); }} onBlur={() => setWeightTouched(true)} /></span></label>
                    {weightTouched && weightError ? <p className="wf-form-error" role="alert">{weightError}</p> : null}
                    <small>Published limit: {weightLimitKg} kg</small>
                  </>
                ) : (
                  <p role="status"><b>4</b> Weight limit not published. Check the airline&apos;s current checked-baggage policy before travel.</p>
                )}
              </div>
            )}

            <section className="wf-checker-step wf-checker-step--advanced" aria-labelledby="advanced-baggage-heading">
              <button type="button" aria-expanded={advancedOpen} aria-controls="advanced-baggage-options" onClick={() => setAdvancedOpen(open => !open)} className="wf-reset-button">
                <span id="advanced-baggage-heading">Advanced / Oversized baggage</span> <span aria-hidden="true">{advancedOpen ? "−" : "+"}</span>
              </button>
              {advancedOpen && (
                <div id="advanced-baggage-options">
                  {!airline ? (
                    <p className="mt-3 text-sm font-medium text-navy-500" role="status">Select an airline to view special baggage guidance.</p>
                  ) : specialBaggageResults.length === 14 ? (
                    <div className="wf-bag-types" role="list" aria-label="Special and oversized baggage categories">
                      {specialBaggageResults.map(item => (
                        <button key={item.resultId} type="button" role="listitem" aria-pressed={selectedSpecial === item.resultId} className={cn("wf-bag-type", selectedSpecial === item.resultId && "is-selected")} onClick={() => setSelectedSpecial(item.resultId)}>
                          {item.title}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm font-semibold text-amber-700" role="status">Special baggage guidance is temporarily unavailable.</p>
                  )}
                </div>
              )}
              {airline && selectedSpecialResult && (
                <aside className="wf-card wf-card--compact mt-4 p-4" aria-live="polite">
                  <strong>{selectedSpecialResult.title}</strong>
                  <p>{selectedSpecialResult.summary}</p>
                  {selectedSpecialResult.preparationGuidance && <p><strong>Prepare:</strong> {selectedSpecialResult.preparationGuidance}</p>}
                  {selectedSpecialResult.feeGuidance && <p><strong>Fees:</strong> {selectedSpecialResult.feeGuidance}</p>}
                  {selectedSpecialResult.mobilityOrMedical && <p><strong>Accessibility:</strong> Contact the airline before travel to confirm assistance and carriage arrangements.</p>}
                  {selectedSpecialResult.policyLinkSource.startsWith("https://") && (
                    <p><a href={selectedSpecialResult.policyLinkSource} target="_blank" rel="noopener noreferrer">{selectedSpecialResult.policyLinkLabel || "Read the airline policy"}</a></p>
                  )}
                </aside>
              )}
            </section>
          </div>

          <button type="submit" className="wf-check-button">Check my bag <span aria-hidden="true">→</span></button>
          {submitted && !airline && <p className="wf-form-error" role="alert">Select an airline before checking your bag.</p>}
          {!result && hints.length > 0 && (
            <aside className="wf-card wf-card--compact mt-4 p-4" aria-label="Before you check">
              {hints.map((hint) => <p key={hint.contentId}><strong>{hint.title}:</strong> {hint.body}</p>)}
            </aside>
          )}
        </form>

        {result && <div ref={resultRef} tabIndex={-1} className="wf-result-panel"><FitResultCard key={resultKey} result={result} labConfigs={labConfigs} /></div>}
      </section>
      {result && <div className="wf-travel-essentials-mobile"><TravelEssentials slots={affiliateSlots} /></div>}
    </div>
  );
}
