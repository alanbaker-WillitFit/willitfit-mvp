"use client";

import { useMemo, useState } from "react";
import { Dimensions } from "@/types";
import { isValidDimensions } from "@/lib/fitCalculator";

export type BagType = "cabinBag" | "personalItem";

interface RawInputs {
  heightCm: string;
  widthCm: string;
  depthCm: string;
}

const EMPTY: RawInputs = { heightCm: "", widthCm: "", depthCm: "" };

export function useDimensionForm(initialBagType: BagType = "cabinBag") {
  const [bagType, setBagType] = useState<BagType>(initialBagType);
  const [raw, setRaw] = useState<RawInputs>(EMPTY);
  const [touched, setTouched] = useState(false);

  function setField(field: keyof RawInputs, value: string) {
    const cleaned = value.replace(/[^0-9.]/g, "");
    setRaw((prev) => ({ ...prev, [field]: cleaned }));
  }

  function setDimensions(values: Dimensions) {
    setRaw({
      heightCm: String(values.heightCm),
      widthCm: String(values.widthCm),
      depthCm: String(values.depthCm),
    });
    setTouched(false);
  }

  function reset() {
    setRaw(EMPTY);
    setTouched(false);
  }

  const dimensions: Partial<Dimensions> = useMemo(
    () => ({
      heightCm: raw.heightCm === "" ? undefined : Number(raw.heightCm),
      widthCm: raw.widthCm === "" ? undefined : Number(raw.widthCm),
      depthCm: raw.depthCm === "" ? undefined : Number(raw.depthCm),
    }),
    [raw]
  );

  const isComplete = raw.heightCm !== "" && raw.widthCm !== "" && raw.depthCm !== "";
  const isValid = isComplete && isValidDimensions(dimensions);

  return {
    bagType,
    setBagType,
    raw,
    setField,
    setDimensions,
    dimensions,
    isComplete,
    isValid,
    touched,
    markTouched: () => setTouched(true),
    reset,
  };
}