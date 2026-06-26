import { Dimensions, FitVerdict } from "@/types";

interface BagVisualizerProps {
  userDimensions: Dimensions;
  limit: Dimensions;
  verdict: FitVerdict;
}

const TONE_STROKE: Record<FitVerdict, string> = {
  fits: "#179A72",
  close: "#F0A93B",
  "no-fit": "#E15B4F",
};

export default function BagVisualizer({ userDimensions, limit, verdict }: BagVisualizerProps) {
  // Use height × width as the silhouette (the two dimensions a sizer cage's
  // front opening actually constrains) — depth is communicated as a label
  // since it can't be shown in a 2D side-on view.
  const VIEW = 160;
  const PADDING = 16;
  const maxSpan = Math.max(limit.heightCm, limit.widthCm, userDimensions.heightCm, userDimensions.widthCm, 1);
  const scale = (VIEW - PADDING * 2) / maxSpan;

  const limitW = limit.widthCm * scale;
  const limitH = limit.heightCm * scale;
  const bagW = userDimensions.widthCm * scale;
  const bagH = userDimensions.heightCm * scale;

  const limitX = (VIEW - limitW) / 2;
  const limitY = VIEW - PADDING - limitH;
  const bagX = (VIEW - bagW) / 2;
  const bagY = VIEW - PADDING - bagH;

  const stroke = TONE_STROKE[verdict];

  return (
    <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="h-44 w-44" role="img" aria-label="Bag size compared to airline sizer">
      {/* Sizer cage / allowance outline */}
      <rect
        x={limitX}
        y={limitY}
        width={limitW}
        height={limitH}
        rx={4}
        fill="none"
        stroke="#B2C3D9"
        strokeWidth={2}
        strokeDasharray="4 4"
      />
      {/* User's bag */}
      <rect
        x={bagX}
        y={bagY}
        width={bagW}
        height={bagH}
        rx={6}
        fill={`${stroke}1A`}
        stroke={stroke}
        strokeWidth={2.5}
      />
      {/* Baseline */}
      <line x1={PADDING / 2} y1={VIEW - PADDING} x2={VIEW - PADDING / 2} y2={VIEW - PADDING} stroke="#D8E1EC" strokeWidth={1.5} />
    </svg>
  );
}
