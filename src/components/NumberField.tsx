import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
  hint?: string;
  accent?: "ember" | "viridian" | "neutral";
}

export function NumberField({
  label,
  value,
  onChange,
  prefix = "R$",
  suffix,
  step = 0.01,
  min = 0,
  max,
  hint,
  accent = "neutral",
}: NumberFieldProps) {
  const [text, setText] = React.useState(
    Number.isFinite(value) ? String(value) : ""
  );
  React.useEffect(() => {
    // keep in sync if parent changes it programmatically
    if (Math.abs(parseFloat(text || "0") - value) > 0.001) {
      setText(String(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const dotColor =
    accent === "ember"
      ? "bg-ember"
      : accent === "viridian"
      ? "bg-viridian"
      : "bg-ink-3";

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="flex items-center gap-2">
        <span className={cn("inline-block h-1 w-1", dotColor)} aria-hidden />
        <span className="flex-1">{label}</span>
        {hint && <span className="text-[11px] font-normal text-ink-3">{hint}</span>}
      </Label>
      <div className="relative flex items-baseline gap-2">
        {prefix && (
          <span className="text-[13px] font-mono text-ink-3 tabular-nums">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const parsed = parseFloat(e.target.value);
            onChange(Number.isFinite(parsed) ? parsed : 0);
          }}
          className="flex-1"
        />
        {suffix && (
          <span className="text-[11px] font-mono text-ink-3">{suffix}</span>
        )}
      </div>
    </div>
  );
}
