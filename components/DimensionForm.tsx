"use client";

import { useMemo, useState } from "react";
import { Airline, FitResult } from "@/types";
import { checkFit } from "@/lib/fitCalculator";
import { useDimensionForm } from "@/hooks/useDimensionForm";
import { cn } from "@/lib/utils";
import AirlineSelector from "./AirlineSelector";
import FitResultCard from "./FitResultCard";

const FIELDS: { key: "heightCm" | "widthCm" | "depthCm"; label: string }[] = [
  { key: "heightCm", label: "Height (cm)" },
  { key: "widthCm", label: "Width (cm)" },
  { key: "depthCm", label: "Depth (cm)" },
];

const BAG_TYPES = [
  {
    type: "cabinBag" as const,
    icon: "/assets/icons/cabin-bag.svg",
    title: "Cabin Bag",
    description: "Stored in the overhead locker",
  },
  {
    type: "personalItem" as const,
    icon: "/assets/icons/personal-bag.svg",
    title: "Personal Item",
    description: "Stored under the seat — handbag, laptop bag or small backpack",
  },
];

interface DimensionFormProps {
  airlines: Airline[];
  initialAirline?: Airline | null;
}

export default function DimensionForm({
  airlines,
  initialAirline = null,
}: DimensionFormProps) {
  const {
    bagType,
    setBagType,
    raw,
    setField,
    setDimensions,
    dimensions,
    isValid,
    markTouched,
  } = useDimensionForm();

  const [airline, setAirline] = useState<Airline | null>(initialAirline);
  const [result, setResult] = useState<FitResult | null>(null);

  function handleBagTypeChange(type: "cabinBag" | "personalItem") {
    setBagType(type);
    setResult(null);

    if (airline) {
      setDimensions(airline[type]);
    }
  }

  function handleAirlineChange(selectedAirline: Airline | null) {
    setAirline(selectedAirline);
    setResult(null);

    if (selectedAirline) {
      setDimensions(selectedAirline[bagType]);
    }
  }

  const alternatives = useMemo(() => {
    if (!result || result.verdict !== "no-fit") return [];
    if (!airline || !isValid) return [];

    return airlines
      .filter((a) => a.airlineId !== airline.airlineId)
      .map((a) => checkFit(dimensions as Required<typeof dimensions>, a, bagType))
      .filter((r) => r.verdict === "fits")
      .slice(0, 3);
  }, [result, airlines, airline, dimensions, bagType, isValid]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    markTouched();

    if (!airline || !isValid) return;

    setResult(
      checkFit(
        dimensions as Required<typeof dimensions>,
        airline,
        bagType
      )
    );
  }

  return (
    <div id="checker" className="scroll-mt-24">
      <form
        onSubmit={handleSubmit}
        className="rounded-card border border-navy-100 bg-white p-6 shadow-soft sm:p-8"
      >
        <div className="mb-5">
          <p className="font-body text-sm font-semibold text-navy-700">
            What type of bag are you checking?
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {BAG_TYPES.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => handleBagTypeChange(item.type)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  bagType === item.type
                    ? "border-green-500 bg-green-50 shadow-soft"
                    : "border-navy-100 bg-white hover:bg-navy-50"
                )}
              >
                <div className="flex items-start gap-4">

                  <img
                    src={item.icon}
                    alt=""
                    aria-hidden="true"
                    className={
                      item.type === "cabinBag"
                        ? "h-20 w-20 shrink-0"
                        : "h-11 w-11 shrink-0"
                    }
                  />

                  <div>
                    <div className="font-body text-sm font-bold text-navy-700">
                      {item.title}
                    </div>

                    <div className="mt-1 font-body text-xs leading-relaxed text-navy-400">
                      {item.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <AirlineSelector
              airlines={airlines}
              value={airline}
              onChange={handleAirlineChange}
            />
          </div>

          {FIELDS.map((field) => (
            <div key={field.key}>
              <label
                htmlFor={field.key}
                className="font-body text-sm font-medium text-navy-700"
              >
                {field.label}
              </label>

              <input
                id={field.key}
                inputMode="decimal"
                placeholder="0"
                className="mt-1.5 w-full rounded-xl border border-navy-100 bg-white px-4 py-3 font-mono text-base text-navy-700 placeholder:text-navy-300 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                value={raw[field.key]}
                onChange={(e) => setField(field.key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="mt-6 w-full rounded-full bg-green-500 px-6 py-3.5 font-body text-base font-semibold text-white shadow-soft transition hover:bg-green-600 sm:w-auto"
        >
          Check my bag
        </button>

        {(!airline || !isValid) && (
          <p className="mt-3 font-body text-sm text-navy-300">
            Pick an airline and enter all three dimensions to see your result.
          </p>
        )}
      </form>

      {result && (
        <div className="mt-6 space-y-6">
          <FitResultCard result={result} />

          {alternatives.length > 0 && (
            <div className="rounded-card border border-navy-100 bg-navy-50 p-6">
              <h4 className="font-heading text-base font-semibold text-navy-700">
                Your bag fits these airlines instead
              </h4>

              <ul className="mt-3 space-y-2">
                {alternatives.map((alt) => (
                  <li
                    key={alt.airline.airlineId}
                    className="font-body text-sm text-navy-600"
                  >
                    <span className="font-semibold text-green-600">
                      {alt.airline.airlineName}
                    </span>
                    {" — "}
                    <span className="font-mono text-xs text-navy-400">
                      {alt.airline.cabinBag.heightCm}×
                      {alt.airline.cabinBag.widthCm}×
                      {alt.airline.cabinBag.depthCm} cm
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}