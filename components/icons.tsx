// Small line-icon set for trust badges / feature strips. Kept separate from
// StatusIcon (S001-S003), which is reserved for fit-result semantic states.
// These are structural/navy or green by default via `currentColor`.

interface IconProps {
  className?: string;
  size?: number;
}

export function GlobeIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 12h18M12 3c2.5 2.5 3.75 5.5 3.75 9S14.5 20.5 12 21c-2.5-2.5-3.75-5.5-3.75-9S9.5 3.5 12 3z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function ShieldCheckIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3l7 3v5.5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CalendarCheckIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 14l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LockIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function BadgePercentIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 2.5l2.2 1.3 2.5-.4 1 2.3 2.3 1-.4 2.5L21 12l-1.4 2.2.4 2.5-2.3 1-1 2.3-2.5-.4L12 21.5l-2.2-1.3-2.5.4-1-2.3-2.3-1 .4-2.5L3 12l1.4-2.2-.4-2.5 2.3-1 1-2.3 2.5.4L12 2.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 15l6-6M9.5 10a.5.5 0 100-1 .5.5 0 000 1zM14.5 15a.5.5 0 100-1 .5.5 0 000 1z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
