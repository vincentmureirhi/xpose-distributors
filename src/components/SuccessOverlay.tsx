import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

interface SuccessOverlayProps {
  show: boolean;
  title?: string;
  subtitle?: string;
  onDone?: () => void;
  duration?: number;
}

export default function SuccessOverlay({
  show,
  title = "Order placed!",
  subtitle = "Redirecting to tracking…",
  onDone,
  duration = 1800,
}: SuccessOverlayProps) {
  const [confetti, setConfetti] = useState<{ x: number; r: number; d: number; c: string }[]>([]);

  useEffect(() => {
    if (!show) return;
    const colors = ["hsl(14 100% 57%)", "hsl(28 100% 60%)", "hsl(142 71% 45%)", "hsl(222 47% 18%)", "hsl(40 33% 88%)"];
    setConfetti(
      Array.from({ length: 60 }).map(() => ({
        x: Math.random() * 100,
        r: Math.random() * 360,
        d: 0.8 + Math.random() * 1.6,
        c: colors[Math.floor(Math.random() * colors.length)],
      }))
    );
    const t = setTimeout(() => onDone?.(), duration);
    return () => clearTimeout(t);
  }, [show, duration, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] grid place-items-center bg-background/80 backdrop-blur-xl"
        >
          {/* confetti */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {confetti.map((c, i) => (
              <motion.span
                key={i}
                initial={{ y: -40, x: `${c.x}vw`, rotate: 0, opacity: 1 }}
                animate={{ y: "110vh", rotate: c.r * 3, opacity: [1, 1, 0] }}
                transition={{ duration: c.d + 1.4, ease: "easeIn" }}
                className="absolute top-0 h-3 w-2 rounded-sm"
                style={{ background: c.c }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="relative rounded-3xl border border-border bg-card px-10 py-12 text-center shadow-elevated max-w-sm mx-4"
          >
            <div className="relative mx-auto mb-6 h-24 w-24">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.4, 1] }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-success/20"
              />
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.8], opacity: [0.6, 0] }}
                transition={{ duration: 1.2, ease: "easeOut", repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-success/30"
              />
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 14 }}
                className="absolute inset-2 rounded-full bg-success grid place-items-center text-success-foreground shadow-glow"
              >
                <motion.div
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.45, duration: 0.4 }}
                >
                  <Check className="h-10 w-10" strokeWidth={3} />
                </motion.div>
              </motion.div>
            </div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="font-display font-bold text-3xl tracking-tight"
            >
              {title}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="text-muted-foreground mt-2"
            >
              {subtitle}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
