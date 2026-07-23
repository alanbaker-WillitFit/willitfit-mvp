import React from "react";
import Image from "next/image";
import { Dimensions, FitVerdict } from "@/types";

interface BagVisualizerProps {
  bagType: "cabinBag" | "personalItem";
  verdict: FitVerdict;
  dimensions?: Dimensions;
}

// RC4 locked photographic masters supplied by the product owner.
// Keep these versioned paths aligned with the canonical selector assets.
export default function BagVisualizer({ bagType, verdict, dimensions }: BagVisualizerProps) {
  const cabinBag = bagType === "cabinBag";
  const image = cabinBag
    ? "/assets/icons/cabin-bag-measurement-rc4.jpg"
    : "/assets/icons/personal-item-measurement-rc4.jpg";
  const measurement = dimensions
    ? `: ${dimensions.heightCm} by ${dimensions.widthCm} by ${dimensions.depthCm} centimetres`
    : "";

  return (
    <figure className="wf-bag-visual">
      <Image
        src={image}
        alt={`${cabinBag ? "Cabin bag" : "Personal item"} with measurement arrows${measurement}. Result: ${verdict}.`}
        width={cabinBag ? 672 : 689}
        height={cabinBag ? 934 : 850}
        sizes="(max-width: 767px) 86vw, 360px"
      />
    </figure>
  );
}
