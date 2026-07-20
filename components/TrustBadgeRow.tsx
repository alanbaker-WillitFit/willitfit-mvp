import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TrustBadgeItem {
  icon: ReactNode;
  title: string;
  caption: string;
}

interface TrustBadgeRowProps {
  items: TrustBadgeItem[];
  variant?: "hero" | "strip";
  className?: string;
}

// D0xx — reusable trust-signal row. "hero" renders on the dark hero panel
// (light text, circled icon); "strip" renders on light backgrounds as a
// page-wide 4-up feature bar (green icon, no circle).
export default function TrustBadgeRow({ items, variant = "strip", className }: TrustBadgeRowProps) {
  const isHero = variant === "hero";

  return (
    <div
      className={cn(
        "grid gap-x-6 gap-y-4",
        isHero ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4",
        className
      )}
    >
      {items.map((item) => (
        <div key={item.title} className="flex items-center gap-3">
          <span
            className={cn(
              "flex shrink-0 items-center justify-center",
              isHero
                ? "h-9 w-9 rounded-full border border-white/25 text-white"
                : "h-9 w-9 rounded-full bg-green-50 text-green-600"
            )}
          >
            {item.icon}
          </span>
          <span>
            <span
              className={cn(
                "block font-body text-sm font-semibold",
                isHero ? "text-white" : "text-navy-700"
              )}
            >
              {item.title}
            </span>
            <span className={cn("block font-body text-xs", isHero ? "text-navy-200" : "text-navy-400")}>
              {item.caption}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
