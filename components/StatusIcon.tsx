import React from "react";

// WillIt Engineering Register — S001/S002/S003 status primitives (005_Colour_Compliance)
// Colour rule: each icon uses its locked semantic colour only (C002/C003/C004) and must
// never inherit structural navy or another status colour.

interface StatusIconProps {
  className?: string;
  size?: number;
}

/** S001 Success Tick — governed success token only (E002) */
export function SuccessTick({ className, size = 28 }: StatusIconProps) {
  return (
    <svg
      className={`text-green-500 ${className ?? ""}`}
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      role="img"
      aria-label="Success"
    >
      <circle cx="14" cy="14" r="13" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8.5 14.5l3.5 3.5 7.5-8"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** S002 Error Cross — governed error token only (E004) */
export function ErrorCross({ className, size = 28 }: StatusIconProps) {
  return (
    <svg
      className={`text-red-500 ${className ?? ""}`}
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      role="img"
      aria-label="Error"
    >
      <circle cx="14" cy="14" r="13" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 10l8 8M18 10l-8 8"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** S003 Warning Exclamation — governed warning token only (E003) */
export function WarningExclamation({ className, size = 28 }: StatusIconProps) {
  return (
    <svg
      className={`text-amber-500 ${className ?? ""}`}
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      role="img"
      aria-label="Warning"
    >
      <circle cx="14" cy="14" r="13" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 8v7" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
      <circle cx="14" cy="19" r="1.35" fill="currentColor" />
    </svg>
  );
}
