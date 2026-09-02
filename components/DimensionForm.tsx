"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { Airline, AffiliateSlot, FitResult, LabConfiguration, SpecialBaggageResult } from "@/types";
import { checkFit, findAirlinesForBag, resolveLimit } from "@/lib/fitCalculator";
import { checkerPreset } from "@/lib/checkerPreset";
import { useDimensionForm } from "@/hooks/useDimensionForm";
import { cn } from "@/lib/utils";
import AirlineSelector from "./AirlineSelector";
import FitResultCard from "./FitResultCard";
import SpecialBaggageResultCard from "./SpecialBaggageResultCard";
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
    ? airline.fareClasses.find((item) => item.fareClass.toLowerCase() === fareClass.toLowerCase())
    : null;

  const fareSupportsBagType = fare
    ? bagType === "checkedBag"
      ? Boolean(fare.checkedBag)
      : Boolean(fare[bagType])
    : false;

  if (fare && fareSupportsBagType) {
    return bagType === "checkedBag"
      ? fare.checkedWeightLimitKg ?? null
      : fare.weightLimitKg;
  }

  return bagType === "checkedBag"
    ? airline.checkedWeightLimitKg ?? null
    : airline.weightLimitKg;
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
  const [journeyMode, setJourneyMode] = useState<"airline" | "bag">("airline");
  const [airline, setAirline] = useState<Airline | null>(initialAirline);
  const [fareClass, setFareClass] = useState<string | null>(null);
  const [weightRaw, setWeightRaw] = useState("");
  const [weightTouched, setWeightTouched] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [selectedSpecial, setSelectedSpecial] = useState<string | null>(null);
  const [publishedSpecialResult, setPublishedSpecialResult] = useState<SpecialBaggageResult | null>(null);
  const [result, setResult] = useState<FitResult | null>(null);
  const [reverseResults, setReverseResults] = useState<FitResult[]>([]);
  const [reverseSubmitted, setReverseSubmitted] = useState(false);
  const [resultKey, setResultKey] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Record<typeof FIELDS[number]["key"], HTMLInputElement | null>>({ heightCm: null, widthCm: null, depthCm: null });

  const sizingRule = airline && airlineHasBagType(airline, bagType)
    ? resolveLimit(airline, bagType, fareClass).sizingRule
    : null;
  const linearRule = sizingRule?.method === "linear-total" ? sizingRule : null;
  const weightOnlyRule = sizingRule?.method === "weight-only";
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
  const selectedSpecialResult = selectedSpecial
    ? specialBaggageResults.find((item) => item.resultId === selectedSpecial) ?? null
    : null;
  const hasPublishedResult = Boolean(result || publishedSpecialResult || (journeyMode === "bag" && reverseSubmitted));

  useEffect(() => {
    if (!initialAirline || airlineHasBagType(initialAirline, bagType)) return;
    const nextType = availableBagType(initialAirline);
    setBagType(nextType);
    loadDimensions(checkerPreset(initialAirline, nextType, null));
  }, [bagType, initialAirline, loadDimensions, setBagType]);

  useEffect(() => {
    if (!hasPublishedResult) return;
    const frame = requestAnimationFrame(() => resultRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [hasPublishedResult, resultKey]);

  function invalidate() {
    setResult(null);
    setPublishedSpecialResult(null);
    setReverseResults([]);
    setReverseSubmitted(false);
  }

  function applySelection(selectedAirline: Airline | null, selectedBagType: typeof bagType, selectedFare: string | null) {
    setResult(null);
    setPublishedSpecialResult(null);
    setReverseResults([]);
    setReverseSubmitted(false);
    setWeightRaw("");
    setWeightTouched(false);
    setSelectedSpecial(null);
    if (selectedAirline && airlineHasBagType(selectedAirline, selectedBagType)) {
      loadDimensions(checkerPreset(selectedAirline, selectedBagType, selectedFare));
    } else {
      loadDimensions(null);
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (airline && selectedSpecialResult) {
      setResult(null);
      setPublishedSpecialResult(selectedSpecialResult);
      setResultKey(key => key + 1);
      return;
    }

    markAllTouched();
    setWeightTouched(true);
    if (!isValid || weightError) {
      const first = FIELDS.find(({ key }) => errors[key]);
      if (first) fieldRefs.current[first.key]?.focus();
      return;
    }
    if (journeyMode === "bag") {
      const matches = findAirlinesForBag(dimensions as Required<typeof dimensions>, airlines, bagType);
      setAirline(null);
      setFareClass(null);
      setPublishedSpecialResult(null);
      setResult(null);
      setReverseResults(matches);
      setReverseSubmitted(true);
      setResultKey(key => key + 1);
      return;
    }

    if (!airline || !airlineHasBagType(airline, bagType)) return;
    setReverseResults([]);
    setReverseSubmitted(false);
    setPublishedSpecialResult(null);
    setResult(checkFit(dimensions as Required<typeof dimensions>, airline, bagType, fareClass, weightSupported ? weightValue : null));
    setResultKey(key => key + 1);
  }

  function onReset() {
    reset();
    setJourneyMode("airline");
    setAirline(initialAirline);
    setFareClass(null);
    setWeightRaw("");
    setWeightTouched(false);
    setAdvancedOpen(false);
    setSelectedSpecial(null);
    setPublishedSpecialResult(null);
    setResult(null);
    setReverseResults([]);
    setReverseSubmitted(false);
  }

  const state = publishedSpecialResult
    ? "is-warning"
    : result?.verdict === "fits"
      ? "is-success"
      : result?.verdict === "close"
        ? "is-warning"
        : result
          ? "is-error"
          : "";

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
              <p><b>1</b> How do you want to check?</p>
              <div className="wf-bag-types" role="group" aria-label="Choose how to check your bag">
                <button
                  type="button"
                  aria-pressed={journeyMode === "airline"}
                  className={cn("wf-bag-type", journeyMode === "airline" && "is-selected")}
                  onClick={() => {
                    setJourneyMode("airline");
                    setReverseResults([]);
                    setReverseSubmitted(false);
                    setAirline(initialAirline);
                    setFareClass(null);
                    loadDimensions(initialAirline ? checkerPreset(initialAirline, bagType, null) : null);
                  }}
                >
                  <span aria-hidden="true">✈</span>
                  Check one airline
                </button>
                <button
                  type="button"
                  aria-pressed={journeyMode === "bag"}
                  className={cn("wf-bag-type", journeyMode === "bag" && "is-selected")}
                  onClick={() => {
                    setJourneyMode("bag");
                    setAirline(null);
                    setFareClass(null);
                    setSelectedSpecial(null);
                    invalidate();
                    loadDimensions(null);
                  }}
                >
                  <span aria-hidden="true">✓</span>
                  Find airlines for my bag
                </button>
              </div>
              {journeyMode === "airline" ? (
                <div className="mt-3">
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
              ) : (
                <p className="mt-3 text-sm font-medium text-navy-500">Enter your bag once and we&apos;ll compare it against every published airline allowance.</p>
              )}
            </div>

            <fieldset className="wf-checker-step wf-checker-step--bag">
              <legend><b>2</b> Choose bag type</legend>
              <div className="wf-bag-types">
                {BAG_TYPES.map(item => {
                  const unavailable = journeyMode === "airline" && (!airline || !airlineHasBagType(airline, item.type));
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
                        applySelection(journeyMode === "airline" ? airline : null, item.type, null);
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
              {journeyMode === "airline" && !airline ? <p className="mt-2 text-xs font-medium text-navy-400">Select an airline to see its available bag types.</p> : null}
              {journeyMode === "bag" ? <p className="mt-2 text-xs font-medium text-navy-500">All bag types are available for reverse matching. Results use each airline&apos;s published minimum allowance.</p> : null}
            </fieldset>

            {journeyMode === "airline" && airline && !airlineHasBagType(airline, bagType) && (() => {
              const notice = notices.find((item) => item.section === `${bagType}-unavailable`);
              return notice ? <div className="wf-form-error" role="status"><strong>{notice.title}</strong><p>{notice.body}</p></div> : null;
            })()}

            {journeyMode === "airline" && airline && airline.fareClasses.length > 0 && (
              <div className="wf-fare-field">
                <label htmlFor="fareClass">Fare</label>
                <select id="fareClass" value={fareClass ?? ""} onChange={event => { const nextFare = event.target.value || null; setFareClass(nextFare); applySelection(airline, bagType, nextFare); }}>
                  <option value="">Minimum allowance</option>
                  {airline.fareClasses.filter(item => item[bagType] || (bagType === "checkedBag" && item.checkedWeightLimitKg !== null)).map(item => <option key={item.fareClass}>{item.fareClass}</option>)}
                </select>
              </div>
            )}

            {journeyMode === "airline" && linearRule && (
              <aside className="wf-card wf-card--compact p-4" role="status" aria-live="polite">
                <strong>Total-size rule</strong>
                <p>This airline uses a total-size limit rather than fixed dimensions. Enter your bag&apos;s length, width and depth. Together they must total {linearRule.operator === "lt" ? "less than" : "no more than"} {linearRule.linearLimitCm} cm.</p>
              </aside>
            )}

            {journeyMode === "airline" && weightOnlyRule && (
              <aside className="wf-card wf-card--compact p-4" role="status" aria-live="polite">
                <strong>Weight-only rule</strong>
                <p>This airline publishes a maximum checked-bag weight but no universal dimensions. Size restrictions may vary by aircraft, route or booking. Check your booking before travel.</p>
              </aside>
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
              <fieldset className="wf-checker-step wf-checker-step--weight wf-checker-step--dimensions">
                <legend><b>4</b> Enter bag weight</legend>
                {weightSupported ? (
                  <div className="wf-dimensions">
                    <label htmlFor="weightKg">Weight
                      <span><input id="weightKg" value={weightRaw} inputMode="decimal" maxLength={5} autoComplete="off" aria-required={weightRequired} aria-invalid={Boolean(weightTouched && weightError)} aria-describedby={weightTouched && weightError ? "weightKg-error" : "weightKg-limit"} onChange={event => { setWeightRaw(decimalInput(event.target.value)); invalidate(); }} onBlur={() => setWeightTouched(true)} /><i>kg</i></span>
                      <small>W</small>
                      {weightTouched && weightError ? <em id="weightKg-error" role="alert">{weightError}</em> : null}
                    </label>
                    <p id="weightKg-limit" className="self-end pb-3 text-xs font-semibold text-navy-500">Published limit: {weightLimitKg} kg</p>
                  </div>
                ) : (
                  <p role="status">Weight limit not published. Check the airline&apos;s current checked-baggage policy before travel.</p>
                )}
              </fieldset>
            )}

            {journeyMode === "airline" && <section className="wf-checker-step wf-checker-step--advanced" aria-labelledby="advanced-baggage-heading">
              <button type="button" aria-expanded={advancedOpen} aria-controls="advanced-baggage-options" onClick={() => setAdvancedOpen(open => !open)} className="wf-reset-button">
                <span id="advanced-baggage-heading">Advanced / Oversized baggage</span> <span aria-hidden="true">{advancedOpen ? "−" : "+"}</span>
              </button>
              {advancedOpen && (
                <div id="advanced-baggage-options">
                  {!airline ? (
                    <p className="mt-3 text-sm font-medium text-navy-500" role="status">Select an airline to view special baggage guidance.</p>
                  ) : specialBaggageResults.length === 14 ? (
                    <div className="wf-bag-types" role="group" aria-label="Special and oversized baggage categories">
                      {specialBaggageResults.map(item => (
                        <button
                          key={item.resultId}
                          type="button"
                          aria-pressed={selectedSpecial === item.resultId}
                          className={cn("wf-bag-type", selectedSpecial === item.resultId && "is-selected")}
                          onClick={() => {
                            setSelectedSpecial(item.resultId);
                            setResult(null);
                            setPublishedSpecialResult(null);
                          }}
                        >
                          {selectedSpecial === item.resultId && <span aria-hidden="true">✓ </span>}
                          {item.title}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm font-semibold text-amber-700" role="status">Special baggage guidance is temporarily unavailable.</p>
                  )}
                  {airline && selectedSpecialResult && (
                    <p className="mt-3 text-sm font-medium text-navy-500" role="status">
                      {selectedSpecialResult.title} selected. Press Check my bag for the airline guidance.
                    </p>
                  )}
                </div>
              )}
            </section>}
          </div>

          <button type="submit" className="wf-check-button">{journeyMode === "bag" ? "Find airlines" : "Check my bag"} <span aria-hidden="true">→</span></button>
          {submitted && journeyMode === "airline" && !airline && <p className="wf-form-error" role="alert">Select an airline before checking your bag.</p>}
          {!hasPublishedResult && hints.length > 0 && (
            <aside className="wf-card wf-card--compact mt-4 p-4" aria-label="Before you check">
              {hints.map((hint) => <p key={hint.contentId}><strong>{hint.title}:</strong> {hint.body}</p>)}
            </aside>
          )}
        </form>

        {hasPublishedResult && (
          <div ref={resultRef} tabIndex={-1} className="wf-result-panel">
            {journeyMode === "bag" && reverseSubmitted ? (
              <ReverseFitResults key={resultKey} results={reverseResults} bagType={bagType} />
            ) : publishedSpecialResult && airline ? (
              <SpecialBaggageResultCard key={resultKey} airline={airline} result={publishedSpecialResult} />
            ) : result ? (
              <FitResultCard key={resultKey} result={result} labConfigs={labConfigs} />
            ) : null}
          </div>
        )}
      </section>
      {hasPublishedResult && <div className="wf-travel-essentials-mobile"><TravelEssentials slots={affiliateSlots} /></div>}
    </div>
  );
}

function ReverseFitResults({ results, bagType }: { results: FitResult[]; bagType: typeof BAG_TYPES[number]["type"] }) {
  const fits = results.filter((item) => item.verdict === "fits");
  const close = results.filter((item) => item.verdict === "close");
  const noFit = results.filter((item) => item.verdict === "no-fit");
  const bagLabel = BAG_TYPES.find((item) => item.type === bagType)?.title ?? "Bag";

  function allowance(result: FitResult): string {
    if (result.limit) {
      return `${result.limit.heightCm} × ${result.limit.widthCm} × ${result.limit.depthCm} cm`;
    }
    if (result.linearLimitCm !== null) {
      return `${result.linearOperator === "lt" ? "under" : "up to"} ${result.linearLimitCm} cm total`;
    }
    return "Published size rule";
  }

  return (
    <section className="wf-card p-5 sm:p-6" aria-live="polite">
      <p className="text-sm font-bold uppercase tracking-wide text-green-700">Reverse WillItFit</p>
      <h2 className="mt-1 font-heading text-2xl font-bold text-navy-900">{fits.length} airlines fit your {bagLabel.toLowerCase()}</h2>
      <p className="mt-2 text-sm leading-6 text-navy-600">Compared against each airline&apos;s minimum published allowance. A larger fare or bundle may allow more.</p>

      {fits.length ? (
        <div className="mt-5 space-y-3">
          {fits.map((item) => (
            <a key={item.airline.airlineId} href={`/airlines/${item.airline.slug}`} className="block rounded-xl border border-green-200 bg-green-50 p-4 no-underline">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-base text-navy-900">{item.airline.airlineName}</strong>
                <span className="text-sm font-bold text-green-700">Fits ✓</span>
              </div>
              <p className="mt-1 text-sm text-navy-600">Allowance: {allowance(item)}</p>
            </a>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-navy-700">No published minimum allowance currently fits these dimensions.</p>
      )}

      {close.length ? (
        <div className="mt-6">
          <h3 className="font-heading text-lg font-bold text-navy-900">Close to the limit ({close.length})</h3>
          <div className="mt-3 space-y-2">
            {close.map((item) => (
              <a key={item.airline.airlineId} href={`/airlines/${item.airline.slug}`} className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 no-underline">
                <span className="font-semibold text-navy-900">{item.airline.airlineName}</span>
                <span className="text-sm font-bold text-amber-700">Close</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-5 text-xs leading-5 text-navy-500">Too large for {noFit.length} compared allowances. Airlines with weight-only checked-bag rules are not counted as dimensional matches.</p>
    </section>
  );
}
