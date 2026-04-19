import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WordmarkProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "compact";
  className?: string;
  animated?: boolean;
}

const sizeMap = {
  sm: { main: "text-base", sub: "text-[8px]", gap: "gap-1.5", mark: "h-7 w-7 text-sm" },
  md: { main: "text-lg", sub: "text-[9px]", gap: "gap-2", mark: "h-9 w-9 text-base" },
  lg: { main: "text-3xl", sub: "text-[11px]", gap: "gap-3", mark: "h-12 w-12 text-xl" },
  xl: { main: "text-5xl md:text-6xl", sub: "text-xs", gap: "gap-4", mark: "h-16 w-16 text-3xl" },
};

/**
 * XPOSE DISTRIBUTORS — custom wordmark
 * - Sliced "X" monogram with diagonal accent bar
 * - Stacked typographic lockup: bold display "XPOSE" with thin spaced "DISTRIBUTORS" underline
 * - Animated shine sweep on hover
 */
export default function Wordmark({
  size = "md",
  variant = "full",
  className,
  animated = true,
}: WordmarkProps) {
  const s = sizeMap[size];

  return (
    <div className={cn("inline-flex items-center group", s.gap, className)}>
      {/* Monogram mark */}
      <div
        className={cn(
          "relative rounded-xl bg-foreground text-background grid place-items-center font-display font-black overflow-hidden shadow-soft",
          s.mark
        )}
      >
        {/* diagonal accent slash */}
        <span className="absolute inset-0 bg-gradient-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <span
          className="absolute -inset-1 bg-accent"
          style={{ clipPath: "polygon(0 60%, 100% 0, 100% 25%, 0 85%)" }}
        />
        <span className="relative z-10 leading-none tracking-tighter">X</span>
        {/* shine sweep */}
        {animated && (
          <motion.span
            initial={{ x: "-120%" }}
            whileHover={{ x: "120%" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-background/40 to-transparent skew-x-[-20deg]"
          />
        )}
      </div>

      {variant === "full" && (
        <div className="leading-none">
          <div className={cn("font-display font-black tracking-tight flex items-center", s.main)}>
            <span className="text-foreground">X</span>
            {/* split P with accent stripe */}
            <span className="relative inline-block">
              <span className="text-foreground">POSE</span>
              <span className="absolute left-0 right-0 top-1/2 h-[3px] bg-accent -translate-y-1/2 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </span>
          </div>
          <div
            className={cn(
              "font-display font-medium uppercase text-muted-foreground mt-1 flex items-center gap-1.5",
              s.sub
            )}
            style={{ letterSpacing: "0.42em" }}
          >
            <span className="h-px w-3 bg-accent inline-block" />
            Distributors
            <span className="h-px flex-1 bg-border inline-block min-w-3" />
          </div>
        </div>
      )}
    </div>
  );
}
