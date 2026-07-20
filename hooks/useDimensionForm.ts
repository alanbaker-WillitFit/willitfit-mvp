"use client";

import { useMemo, useState } from "react";
import { Dimensions } from "@/types";
import {
  DimensionField,
  dimensionError,
  normaliseDimensionOnBlur,
  sanitiseDimensionInput,
} from "@/lib/dimensions";

export type BagType = "cabinBag" | "personalItem";
export type RawInputs = Record<DimensionField, string>;
export type TouchedFields = Record<DimensionField, boolean>;

const EMPTY: RawInputs = { heightCm: "", widthCm: "", depthCm: "" };
const UNTOUCHED: TouchedFields = {
  heightCm: false,
  widthCm: false,
  depthCm: false,
};

export function useDimensionForm(initialBagType: BagType = "cabinBag") {
  const [bagType, setBagType] = useState<BagType>(initialBagType);
  const [raw, setRaw] = useState<RawInputs>(EMPTY);
  const [touchedFields, setTouchedFields] = useState<TouchedFields>(UNTOUCHED);
  const [submitted, setSubmitted] = useState(false);

  function setField(field: DimensionField, value: string) {
    const cleaned = sanitiseDimensionInput(value);
    setRaw((prev) => ({ ...prev, [field]: cleaned }));
  }

  function markFieldTouched(field: DimensionField) {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  }

  function blurField(field: DimensionField) {
    markFieldTouched(field);
    setRaw((prev) => ({
      ...prev,
      [field]: normaliseDimensionOnBlur(prev[field]),
    }));
  }

  function markAllTouched() {
    setSubmitted(true);
    setTouchedFields({ heightCm: true, widthCm: true, depthCm: true });
  }

  function reset() {
    setRaw(EMPTY);
    setTouchedFields(UNTOUCHED);
    setSubmitted(false);
  }

  function loadDimensions(dimensions: Dimensions) {
    setRaw({ heightCm: String(dimensions.heightCm), widthCm: String(dimensions.widthCm), depthCm: String(dimensions.depthCm) });
    setTouchedFields(UNTOUCHED);
    setSubmitted(false);
  }

  const dimensions: Partial<Dimensions> = useMemo(
    () => ({
      heightCm: raw.heightCm === "" ? undefined : Number(raw.heightCm),
      widthCm: raw.widthCm === "" ? undefined : Number(raw.widthCm),
      depthCm: raw.depthCm === "" ? undefined : Number(raw.depthCm),
    }),
    [raw]
  );

  const errors = useMemo(
    () => ({
      heightCm: dimensionError(raw.heightCm),
      widthCm: dimensionError(raw.widthCm),
      depthCm: dimensionError(raw.depthCm),
    }),
    [raw]
  );

  const isComplete = Object.values(raw).every((value) => value !== "");
  const isValid = isComplete && Object.values(errors).every((error) => error === null);

  return {
    bagType,
    setBagType,
    raw,
    setField,
    blurField,
    dimensions,
    errors,
    isComplete,
    isValid,
    touchedFields,
    submitted,
    markAllTouched,
    reset,
    loadDimensions,
  };
}
