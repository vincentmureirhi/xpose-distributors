import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, CreditCard, Package, Truck } from "lucide-react";

const CONFETTI_COLORS = [
  "hsl(14 100% 57%)",
  "hsl(28 100% 60%)",
  "hsl(142 71% 45%)",
  "hsl(222 47% 18%)",
  "hsl(40 33% 88%)",
  "#FFD700",
  "#FF69B4",
];
const TILL_NUMBER = "711714";
const REDIRECT_SECONDS = 12;

interface Props {
  show: boolean;
  orderId: string;
  trackingUrl?: string;
  paymentMode?: "mpesa" | "route_credit";
  onDone?: () => void;
}

function toLocalTrackingPath(trackingUrl?: string, fallbackId?: string) {
  if (trackingUrl) {
    try {
      const parsed = new URL(trackingUrl);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      if (trackingUrl.startsWith("/")) return trackingUrl;
    }
  }

  return fallbackId ? `/track-order?id=${encodeURIComponent(fallbackId)}` : "/track-order";
}

export default function OrderSuccessOverlay({ show, orderId, trackingUrl, paymentMode = "mpesa", onDone }: Props) {
  const [confetti, setConfetti] = useState<{ x: number; r: number; d: number; c: string }[]>([]);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const isRouteCredit = paymentMode === "route_credit";
  const trackingPath = toLocalTrackingPath(trackingUrl, orderId);

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

    setCountdown(REDIRECT_SECONDS);
    const cd = window.setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    const t = window.setTimeout(() => {
      window.clearInterval(cd);
      onDone?.();
    }, REDIRECT_SECONDS * 1000);

    return () => {
      window.clearTimeout(t);
      window.clearInterval(cd);
    };
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-background/90 px-4 py-6 backdrop-blur-xl"
        >
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

          <div className="relative z-10 flex w-full max-w-lg flex-col items-center rounded-2xl border border-border bg-card/95 px-4 py-5 text-center shadow-elevated sm:px-7 sm:py-7">
            <div className="relative mb-5 h-28 w-full overflow-hidden sm:h-32">
              <div className="absolute bottom-4 left-0 right-0 h-0.5 bg-border" />

              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                className="absolute bottom-5 left-3 flex flex-col items-center sm:left-8"
              >
                <Package className="h-10 w-10 text-accent" />
                <span className="mt-1 text-[10px] text-muted-foreground">Your order</span>
              </motion.div>

              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="absolute bottom-8 left-[34%] right-[34%] h-0.5 origin-left bg-accent"
              />

              <motion.div
                initial={{ x: "120%", opacity: 0 }}
                animate={{ x: ["120%", "60%", "60%", "120%"], opacity: [0, 1, 1, 0] }}
                transition={{
                  delay: 1.2,
                  duration: 2.8,
                  times: [0, 0.3, 0.78, 1],
                  ease: "easeInOut",
                }}
                className="absolute bottom-4 right-3 sm:right-8"
              >
                <Truck className="h-14 w-14 text-primary" />
              </motion.div>

              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 4.2, type: "spring", stiffness: 260, damping: 16 }}
                className="absolute bottom-5 right-3 sm:right-8"
              >
                <CheckCircle2 className="h-12 w-12 text-success" />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full"
            >
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                {isRouteCredit ? "Route Order Captured" : "Order Placed Successfully!"}
              </h2>
              {orderId && (
                <p className="mb-1 text-sm text-muted-foreground">
                  Order reference: <span className="font-bold text-foreground">{orderId}</span>
                </p>
              )}
              <p className="mb-4 text-sm text-muted-foreground">
                {isRouteCredit
                  ? "The credit order has been recorded for this route customer and is ready for admin review."
                  : "Your order has been received. Complete your M-Pesa payment and we will start preparing it."}
              </p>
            </motion.div>

            {isRouteCredit ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mb-4 w-full rounded-xl border border-success/25 bg-success/5 p-4 text-left"
              >
                <div className="mb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 flex-shrink-0 text-success" />
                  <p className="text-sm font-semibold text-foreground">Route credit order</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Payment can be reconciled later by admin or during route customer settlement.
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mb-4 w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-800/40 dark:bg-amber-900/10"
              >
                <div className="mb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Pay via M-Pesa to confirm your order
                  </p>
                </div>
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Till Number</span>
                  <span className="font-bold tracking-widest text-foreground">{TILL_NUMBER}</span>
                  <span className="text-muted-foreground">Business</span>
                  <span className="font-semibold">XPOSE</span>
                  <span className="text-muted-foreground">Reference</span>
                  <span className="break-words font-semibold">{orderId || "Your order number"}</span>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex w-full flex-col items-center gap-2"
            >
              <Link
                to={trackingPath}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-accent px-8 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
              >
                <Truck className="h-4 w-4" />
                Track Order Status
              </Link>
              <p className="text-xs text-muted-foreground">Redirecting in {countdown}s...</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
