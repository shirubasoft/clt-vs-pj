import * as React from "react";
import { cn } from "@/lib/utils";

interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: readonly SegmentedOption<T>[];
  accent?: "ember" | "viridian";
  className?: string;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  accent = "viridian",
  className,
}: SegmentedProps<T>) {
  const activeColor = accent === "ember" ? "text-ember border-ember" : "text-viridian border-viridian";
  return (
    <div className={cn("inline-flex border border-rule divide-x divide-rule", className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 py-1.5 text-[12px] font-mono uppercase tracking-wider transition-colors",
              active
                ? `bg-paper-3 ${activeColor} border-0`
                : "text-ink-3 hover:text-ink-2"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
