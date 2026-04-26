import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Truck, CheckCircle2, CreditCard } from "lucide-react";

const CONFETTI_COLORS = ["hsl(14 100% 57%)", "hsl(28 100% 60%)", "hsl(142 71% 45%)", "hsl(222 47% 18%)", "hsl(40 33% 88%)", "#FFD700", "#FF69B4"];
const TILL_NUMBER = "711714";

interface Props {
  show: boolean;
  orderId: string;
  onDone?: () => void;
}

export default function OrderSuccessOverlay({ show, orderId, onDone }: Props) {
  const [confetti, setConfetti] = useState<{ x: number; r: number; d: number; c: string }[]>([]);
  const [countdown, setCountdown] = useState(7);

  useEffect(() => {
    if (!show) return;
    setConfetti(
      Array.from({ length: 80 }).map(() => ({
        x: Math.random() * 100,
        r: Math.random() * 360,
        d: 0.8 + Math.random() * 1.8,
        c: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      }))
    );
    setCountdown(7);
    const cd = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    const t = setTimeout(() => { clearInterval(cd); onDone?.(); }, 7000);
    return () => { clearTimeout(t); clearInterval(cd); };
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/90 backdrop-blur-xl overflow-hidden"
        >
          {/* Confetti */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {confetti.map((c, i) => (
              <motion.span
                key={i}
                initial={{ y: -40, x: `${c.x}vw`, rotate: 0, opacity: 1 }}
                animate={{ y: "110vh", rotate: c.r * 4, opacity: [1, 1, 0] }}
                transition={{ duration: c.d + 1.6, ease: "easeIn" }}
                className="absolute top-0 h-3 w-2 rounded-sm"
                style={{ background: c.c }}
              />
            ))}
          </div>

          {/* Animation sequence */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-md px-6 w-full">

            {/* Truck animation */}
            <div className="relative h-28 w-full mb-6 overflow-hidden">
              {/* Road */}
              <div className="absolute bottom-4 left-0 right-0 h-0.5 bg-border" />

              {/* Package received (left) */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                className="absolute left-8 bottom-5 flex flex-col items-center"
              >
                <Package className="h-10 w-10 text-accent" />
                <span className="text-[10px] text-muted-foreground mt-1">Your Order</span>
              </motion.div>

              {/* Arrow → */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="absolute left-1/2 -translate-x-1/2 bottom-7 text-accent font-bold text-2xl"
              >
                →
              </motion.div>

              {/* Truck moving */}
              <motion.div
                initial={{ x: "120%", opacity: 0 }}
                animate={{ x: ["120%", "60%", "60%", "120%"], opacity: [0, 1, 1, 0] }}
                transition={{
                  delay: 1.2,
                  duration: 2.5,
                  times: [0, 0.3, 0.7, 1],
                  ease: "easeInOut",
                }}
                className="absolute right-8 bottom-4"
              >
                <Truck className="h-14 w-14 text-primary" />
              </motion.div>

              {/* Checkmark */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 3.8, type: "spring", stiffness: 260, damping: 16 }}
                className="absolute right-8 bottom-5"
              >
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </motion.div>
            </div>

            {/* Success text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full"
            >
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="font-display font-bold text-3xl tracking-tight mb-1">
                Order Placed Successfully!
              </h2>
              {orderId && (
                <p className="text-muted-foreground text-sm mb-1">
                  Order reference:{" "}
                  <span className="font-bold text-foreground">{orderId}</span>
                </p>
              )}
              <p className="text-muted-foreground text-sm mb-4">
                Your order is confirmed. Please complete your M-Pesa payment to get it processed.
              </p>
            </motion.div>

            {/* Payment instructions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="w-full rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10 p-4 mb-4 text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Pay via M-Pesa to confirm your order</p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-muted-foreground">Till Number</span>
                <span className="font-bold text-foreground tracking-widest">{TILL_NUMBER}</span>
                <span className="text-muted-foreground">Business</span>
                <span className="font-semibold">XPOSE</span>
                <span className="text-muted-foreground">Reference</span>
                <span className="font-semibold">{orderId || "Your order number"}</span>
              </div>
            </motion.div>

            {/* Track button */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex flex-col items-center gap-2 w-full"
            >
              <Link
                to={orderId ? `/track-order?id=${orderId}` : "/track-order"}
                className="inline-flex items-center gap-2 h-11 px-8 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity w-full justify-center"
              >
                <Truck className="h-4 w-4" />
                Track Your Order & Pay
              </Link>
              <p className="text-xs text-muted-foreground">
                Redirecting in {countdown}s…
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
