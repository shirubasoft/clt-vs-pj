import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
  className?: string;
  accent?: "ember" | "viridian";
}

export function Checkbox({
  checked,
  onChange,
  id,
  className,
  accent = "viridian",
}: CheckboxProps) {
  const border = accent === "ember" ? "border-ember" : "border-viridian";
  const bg = accent === "ember" ? "bg-ember" : "bg-viridian";
  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex h-4 w-4 items-center justify-center border transition-colors",
        checked ? `${bg} ${border}` : "border-rule bg-transparent",
        className
      )}
    >
      {checked && <Check className="h-3 w-3 text-paper" strokeWidth={3} />}
    </button>
  );
}
