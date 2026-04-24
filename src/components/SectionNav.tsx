import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mobile-only section jumper — two chevron buttons that scroll to the
 * previous / next section from wherever the viewport currently is.
 */

export const SECTION_IDS = [
  "section-clt",
  "section-pj",
  "section-risco",
  "section-veredicto",
  "section-ledger",
  "section-composicao",
  "section-breakeven",
  "section-fontes",
] as const;

export function SectionNav() {
  const jump = (dir: -1 | 1) => {
    const y = window.scrollY;
    const offset = 16; // breathing room above the section heading
    const tops = SECTION_IDS.map((id) => {
      const el = document.getElementById(id);
      if (!el) return Number.POSITIVE_INFINITY;
      return el.getBoundingClientRect().top + window.scrollY;
    });

    if (dir === 1) {
      // Next section whose top is at least a few pixels below current scroll.
      const threshold = y + 40;
      const target = tops.find((t) => t > threshold);
      if (target != null && Number.isFinite(target)) {
        window.scrollTo({ top: target - offset, behavior: "smooth" });
      }
    } else {
      // Previous section — first one *above* current scroll, scanning from bottom.
      const threshold = y - 40;
      const above = tops.filter((t) => t < threshold);
      const target = above.length ? above[above.length - 1] : 0;
      window.scrollTo({ top: Math.max(0, target - offset), behavior: "smooth" });
    }
  };

  return (
    <nav
      aria-label="Navegação de seções"
      className={cn(
        "md:hidden fixed right-3 bottom-4 z-40",
        "flex flex-col items-stretch w-11",
        "border border-rule bg-paper-2/90 backdrop-blur-md",
        "shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8)]"
      )}
    >
      <button
        type="button"
        onClick={() => jump(-1)}
        aria-label="Seção anterior"
        className="flex items-center justify-center py-2.5 text-ink-2 hover:text-ember hover:bg-paper-3/60 active:bg-paper-3 transition-colors"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <div className="h-px bg-rule/70" />
      <button
        type="button"
        onClick={() => jump(1)}
        aria-label="Próxima seção"
        className="flex items-center justify-center py-2.5 text-ink-2 hover:text-ember hover:bg-paper-3/60 active:bg-paper-3 transition-colors"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </nav>
  );
}
