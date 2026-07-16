"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export interface StarRatingProps {
  value: number;
  /** Show partial (fractional) fill for display. Ignored when interactive. */
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
  /** When provided, the widget becomes an interactive 1-5 picker. */
  onChange?: (value: number) => void;
}

const sizes = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-6 w-6",
};

function Star({
  fill,
  className,
}: {
  fill: number; // 0..1
  className?: string;
}) {
  const pct = Math.round(fill * 100);
  return (
    <span className={cn("relative inline-block", className)}>
      <svg viewBox="0 0 20 20" className="h-full w-full text-slate-200" fill="currentColor">
        <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.36 4.18a1 1 0 00.95.69h4.4c.97 0 1.37 1.24.59 1.81l-3.56 2.59a1 1 0 00-.36 1.12l1.36 4.18c.3.92-.75 1.68-1.54 1.12l-3.56-2.59a1 1 0 00-1.18 0l-3.56 2.59c-.79.56-1.84-.2-1.54-1.12l1.36-4.18a1 1 0 00-.36-1.12L1.1 9.6c-.78-.57-.38-1.81.59-1.81h4.4a1 1 0 00.95-.69L8.4 2.93z" />
      </svg>
      <span
        className="absolute inset-0 overflow-hidden text-accent-400"
        style={{ width: `${pct}%` }}
      >
        <svg viewBox="0 0 20 20" className={cn(sizes.md, "h-full w-auto")} fill="currentColor" preserveAspectRatio="xMinYMid meet">
          <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.36 4.18a1 1 0 00.95.69h4.4c.97 0 1.37 1.24.59 1.81l-3.56 2.59a1 1 0 00-.36 1.12l1.36 4.18c.3.92-.75 1.68-1.54 1.12l-3.56-2.59a1 1 0 00-1.18 0l-3.56 2.59c-.79.56-1.84-.2-1.54-1.12l1.36-4.18a1 1 0 00-.36-1.12L1.1 9.6c-.78-.57-.38-1.81.59-1.81h4.4a1 1 0 00.95-.69L8.4 2.93z" />
        </svg>
      </span>
    </span>
  );
}

export function StarRating({
  value,
  size = "md",
  showValue = false,
  reviewCount,
  className,
  onChange,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const interactive = typeof onChange === "function";
  const display = hover ?? value;

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <div className="inline-flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, display - i));
          if (!interactive) {
            return <Star key={i} fill={fill} className={sizes[size]} />;
          }
          return (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1} star${i === 0 ? "" : "s"}`}
              onMouseEnter={() => setHover(i + 1)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onChange(i + 1)}
              className="p-0.5"
            >
              <Star fill={fill >= 0.5 ? 1 : 0} className={sizes[size]} />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-slate-700">
          {value.toFixed(1)}
        </span>
      )}
      {typeof reviewCount === "number" && (
        <span className="text-sm text-slate-400">({reviewCount})</span>
      )}
    </div>
  );
}
