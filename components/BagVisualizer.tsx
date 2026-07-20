import { Dimensions, FitVerdict } from "@/types";
import { SuccessTick, ErrorCross, WarningExclamation } from "./StatusIcon";
import { colours } from "@/tokens/designTokens";

interface BagVisualizerProps {
  bagType: "cabinBag" | "personalItem";
  verdict: FitVerdict;
  dimensions?: Dimensions;
}

// WillIt Engineering Register — M001 (cabin bag) / I002 (personal item) Master
// Measurement Language v1.0. LOCKED. Do not alter. Do not re-engineer.
// - Bag outline: WillIt Navy, 4px stroke (scaled from the 5px master), rounded
//   corners, centred single handle, wheels solid circles (M001 only — I002 has
//   none), no interior grey lines.
// - Measurement arrows: WillIt Green, dashed (7 3, scaled from 14 6), round
//   caps, filled arrowheads, bidirectional. Horizontal arrow sits inside the
//   bottom margin; vertical arrow runs the full inside-right height. Their
//   inner tips are optically aligned on the same reference line but must not
//   touch — a one-stroke-width gap is enforced below (corner alignment rule).
// - Status badge: S001/S002/S003 primitives only, centred over the body.
const NAVY = colours.navy[700];
const GREEN = colours.green[500];

const VERDICT_ICON: Record<FitVerdict, typeof SuccessTick> = {
  fits: SuccessTick,
  close: WarningExclamation,
  "no-fit": ErrorCross,
};

export default function BagVisualizer({ bagType, verdict, dimensions }: BagVisualizerProps) {
  const Icon = VERDICT_ICON[verdict];
  const hasWheels = bagType === "cabinBag";

  return (
    <figure className="wf-bag-visual">
      <svg viewBox="0 0 220 200" role="img" aria-label={`${bagType === "cabinBag" ? "Cabin bag" : "Personal item"} with entered height, width and depth measurements`}>
        <defs>
          <marker
            id="wf-arrow-head"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="4.5"
            markerHeight="4.5"
            orient="auto-start-reverse"
          >
            <path d="M0 0L10 5L0 10Z" fill={GREEN} />
          </marker>
        </defs>

        {/* M001/I002 — bag body */}
        <rect x="43" y={hasWheels ? "31" : "55"} width="88" height={hasWheels ? "108" : "76"} rx="14" fill="white" stroke={NAVY} strokeWidth="4" />
        <path d={hasWheels ? "M51 62h72M51 82h72" : "M51 79h72M51 98h72"} fill="none" stroke={NAVY} strokeWidth="1.5" opacity=".35" />

        {/* Centred single handle */}
        <path d={hasWheels ? "M76 31v-11a11 11 0 0 1 22 0v11" : "M72 55v-8a15 15 0 0 1 30 0v8"} fill="none" stroke={NAVY} strokeWidth="4" strokeLinecap="round" />

        {/* Wheels — solid circles, M001 (cabin bag) only */}
        {hasWheels && (
          <>
            <circle cx="58" cy="145" r="6" fill={NAVY} />
            <circle cx="116" cy="145" r="6" fill={NAVY} />
          </>
        )}

        {/* Horizontal measurement arrow — inside bottom, does not touch vertical arrow */}
        <line
          x1="43" y1="169" x2="131" y2="169"
          stroke={GREEN}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="7 3"
          markerStart="url(#wf-arrow-head)"
          markerEnd="url(#wf-arrow-head)"
        />

        {/* Vertical measurement arrow — full inside-right height */}
        <line
          x1="24" y1={hasWheels ? "31" : "55"} x2="24" y2={hasWheels ? "139" : "131"}
          stroke={GREEN}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="7 3"
          markerStart="url(#wf-arrow-head)"
          markerEnd="url(#wf-arrow-head)"
        />

        {/* Dimension labels — real user figures, only rendered when provided */}
        {dimensions && (
          <>
            <text
              x="87" y="190"
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill={NAVY}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              Width {dimensions.widthCm} cm
            </text>
            <text
              x="12" y="88"
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill={NAVY}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              transform="rotate(-90 12 88)"
            >
              Height {dimensions.heightCm} cm
            </text>
            <line x1="143" y1="55" x2="178" y2="78" stroke={GREEN} strokeWidth="3" strokeLinecap="round" markerStart="url(#wf-arrow-head)" markerEnd="url(#wf-arrow-head)" />
            <text x="178" y="48" textAnchor="middle" fontSize="10" fontWeight="600" fill={NAVY} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">Depth {dimensions.depthCm} cm</text>
          </>
        )}
      </svg>

      {/* Status badge — centred over the bag body */}
      <div className="wf-bag-visual__status">
        <Icon size={44} />
      </div>
    </figure>
  );
}
