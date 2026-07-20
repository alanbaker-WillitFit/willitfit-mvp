import type { Dimensions, FitResult } from "@/types";

export type DimensionKey = keyof Dimensions;

export interface DimensionComparisonRow {
  key: DimensionKey;
  label: string;
  userCm: number;
  limitCm: number;
  differenceCm: number;
}

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  heightCm: "Height",
  widthCm: "Width",
  depthCm: "Depth",
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildDimensionComparison(result: FitResult): DimensionComparisonRow[] {
  return (["heightCm", "widthCm", "depthCm"] as DimensionKey[]).map((key) => ({
    key,
    label: DIMENSION_LABELS[key],
    userCm: result.orientationUsed[key],
    limitCm: result.limit[key],
    differenceCm: round1(result.orientationUsed[key] - result.limit[key]),
  }));
}

export function wasRotated(result: FitResult): boolean {
  const original = result.userDimensions;
  const used = result.orientationUsed;
  return (
    original.heightCm !== used.heightCm ||
    original.widthCm !== used.widthCm ||
    original.depthCm !== used.depthCm
  );
}

export function formatDifference(value: number): string {
  if (value > 0) return `+${value}`;
  if (value < 0) return `${value}`;
  return "0";
}
