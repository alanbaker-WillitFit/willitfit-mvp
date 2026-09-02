import React from "react";
import Image from "next/image";
import { BagType, Dimensions, FitVerdict, WeightVerdict } from "@/types";

interface BagVisualizerProps {
  bagType: BagType;
  verdict: FitVerdict;
  dimensions?: Dimensions;
  limit?: Dimensions;
  userWeightKg?: number | null;
  weightLimitKg?: number | null;
  weightVerdict?: WeightVerdict;
}

export function getMeasurementState(value: number, allowance: number, verdict: FitVerdict) {
  const fits = value <= allowance;
  const close = !fits && verdict === "close";
  return {
    className: fits ? "is-fit" : close ? "is-close" : "is-over",
    label: fits ? "Fits" : close ? "Close fit" : "Too large",
  };
}

const BAG_PRESENTATION: Record<BagType, { image: string; label: string; width: number; height: number }> = {
  cabinBag: {
    image: "/assets/icons/cabin-bag-measurement-rc4.jpg",
    label: "Cabin bag",
    width: 672,
    height: 934,
  },
  personalItem: {
    image: "/assets/icons/personal-item-measurement-rc4.jpg",
    label: "Personal item",
    width: 689,
    height: 850,
  },
  checkedBag: {
    image: "/assets/icons/cabin-bag-measurement-rc4.jpg",
    label: "Checked bag",
    width: 672,
    height: 934,
  },
};

export default function BagVisualizer({
  bagType,
  verdict,
  dimensions,
  limit,
  userWeightKg = null,
  weightLimitKg = null,
  weightVerdict = "not-checked",
}: BagVisualizerProps) {
  const presentation = BAG_PRESENTATION[bagType];
  const measurement = dimensions
    ? `: ${dimensions.heightCm} by ${dimensions.widthCm} by ${dimensions.depthCm} centimetres`
    : "";
  const callouts = dimensions
    ? ([
        ["height", "wf-bag-measurement--height", dimensions.heightCm, limit?.heightCm],
        ["width", "wf-bag-measurement--width", dimensions.widthCm, limit?.widthCm],
        ["depth", "wf-bag-measurement--depth", dimensions.depthCm, limit?.depthCm],
      ] as const)
    : [];
  const showWeight = userWeightKg !== null && weightLimitKg !== null;
  const weightFits = weightVerdict !== "no-fit";

  return (
    <figure className="wf-bag-visual">
      <Image
        src={presentation.image}
        alt={`${presentation.label} with measurement arrows${measurement}. Result: ${verdict}.`}
        width={presentation.width}
        height={presentation.height}
        sizes="(max-width: 767px) 86vw, 360px"
      />
      {callouts.map(([axis, positionClass, value, allowance]) => {
        const state = allowance === undefined
          ? { className: "is-fit", label: "Entered" }
          : getMeasurementState(value, allowance, verdict);
        const comparison = allowance === undefined
          ? `${axis}: ${value} centimetres entered`
          : `${axis}: ${value} centimetres, ${state.label.toLowerCase()} against the ${allowance} centimetre allowance`;
        return (
          <span
            key={axis}
            className={`wf-bag-measurement ${positionClass} ${state.className}`}
            aria-label={comparison}
          >
            <strong>{value} cm</strong>
            <small>{state.label}</small>
          </span>
        );
      })}
      {showWeight && (
        <span
          className={`wf-bag-measurement ${weightFits ? "is-fit" : "is-over"}`}
          style={{ left: "7%", top: "64%" }}
          aria-label={`Weight: ${userWeightKg} kilograms against the ${weightLimitKg} kilogram allowance`}
        >
          <strong>{userWeightKg} kg</strong>
          <small>{weightFits ? "Fits" : "Too heavy"}</small>
        </span>
      )}
    </figure>
  );
}
