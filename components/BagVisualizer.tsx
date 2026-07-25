import React from "react";
import Image from "next/image";
import { Dimensions, FitVerdict } from "@/types";

interface BagVisualizerProps {
  bagType: "cabinBag" | "personalItem";
  verdict: FitVerdict;
  dimensions?: Dimensions;
  limit?: Dimensions;
}

export function getMeasurementState(value: number, allowance: number, verdict: FitVerdict) {
  const fits = value <= allowance;
  const close = !fits && verdict === "close";
  return {
    className: fits ? "is-fit" : close ? "is-close" : "is-over",
    label: fits ? "Fits" : close ? "Close fit" : "Too large",
  };
}

// RC4 locked photographic masters supplied by the product owner.
// Keep these versioned paths aligned with the canonical selector assets.
export default function BagVisualizer({ bagType, verdict, dimensions, limit }: BagVisualizerProps) {
  const cabinBag = bagType === "cabinBag";
  const image = cabinBag
    ? "/assets/icons/cabin-bag-measurement-rc4.jpg"
    : "/assets/icons/personal-item-measurement-rc4.jpg";
  const measurement = dimensions
    ? `: ${dimensions.heightCm} by ${dimensions.widthCm} by ${dimensions.depthCm} centimetres`
    : "";
  const callouts = dimensions && limit
    ? ([
        ["height", "wf-bag-measurement--height", dimensions.heightCm, limit.heightCm],
        ["width", "wf-bag-measurement--width", dimensions.widthCm, limit.widthCm],
        ["depth", "wf-bag-measurement--depth", dimensions.depthCm, limit.depthCm],
      ] as const)
    : [];

  return (
    <figure className="wf-bag-visual">
      <Image
        src={image}
        alt={`${cabinBag ? "Cabin bag" : "Personal item"} with measurement arrows${measurement}. Result: ${verdict}.`}
        width={cabinBag ? 672 : 689}
        height={cabinBag ? 934 : 850}
        sizes="(max-width: 767px) 86vw, 360px"
      />
      {callouts.map(([axis, positionClass, value, allowance]) => {
        const state = getMeasurementState(value, allowance, verdict);
        return (
          <span
            key={axis}
            className={`wf-bag-measurement ${positionClass} ${state.className}`}
            aria-label={`${axis}: ${value} centimetres, ${state.label.toLowerCase()} against the ${allowance} centimetre allowance`}
          >
            <strong>{value} cm</strong>
            <small>{state.label}</small>
          </span>
        );
      })}
    </figure>
  );
}
