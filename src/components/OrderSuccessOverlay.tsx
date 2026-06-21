import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Copy, CreditCard, Link2, Package, ShieldCheck, Truck } from "lucide-react";

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
  amountDue?: number;
  paymentMode?: "mpesa" | "route_credit";
  onDone?: () => void;
}

function formatMoney(value?: number) {
  return Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
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

export default function OrderSuccessOverlay({ show, orderId, trackingUrl, amountDue = 0, paymentMode = "mpesa", onDone }: Props) {
  const [confetti, setConfetti] = useState<{ x: number; r: number; d: number; c: string }[]>([]);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const [copied, setCopied] = useState(false);
  const [orderCopied, setOrderCopied] = useState(false);
  const [copiedPaymentField, setCopiedPaymentField] = useState<string | null>(null);
  const isRouteCredit = paymentMode === "route_credit";
  const trackingPath = toLocalTrackingPath(trackingUrl, orderId);
  const hasPrivateTrackingLink = trackingPath.includes("?t=") || trackingPath.includes("&t=");
  const trackingLabel =
    typeof window !== "undefined" && trackingPath.startsWith("/")
      ? `${window.location.origin}${trackingPath}`
      : trackingPath;

  const copyTrackingLink = async () => {
    try {
      await navigator.clipboard.writeText(trackingLabel);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const copyOrderReference = async () => {
    if (!orderId) return;
    try {
      await navigator.clipboard.writeText(orderId);
      setOrderCopied(true);
      window.setTimeout(() => setOrderCopied(false), 1800);
    } catch {
      setOrderCopied(false);
    }
  };

  const copyPaymentValue = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedPaymentField(field);
      window.setTimeout(() => setCopiedPaymentField(null), 1800);
    } catch {
      setCopiedPaymentField(null);
    }
  };

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
    let t: number | undefined;
    if (isRouteCredit) {
      t = window.setTimeout(() => {
        window.clearInterval(cd);
        onDone?.();
      }, REDIRECT_SECONDS * 1000);
    }

    return () => {
      if (t) window.clearTimeout(t);
      window.clearInterval(cd);
    };
  }, [show, onDone, isRouteCredit]);

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
                {isRouteCredit ? "Route Order Sent to Dispatch" : "Order Placed Successfully!"}
              </h2>
              {orderId && (
                <div className="mb-3 rounded-xl border border-border bg-secondary/45 p-3 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order tracking code</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="min-w-0 flex-1 break-all font-display text-lg font-black text-foreground">{orderId}</span>
                    <button
                      type="button"
                      onClick={copyOrderReference}
                      className="inline-flex h-8 flex-shrink-0 items-center gap-1 rounded-md bg-background px-2 text-xs font-bold text-foreground transition-colors hover:bg-background/80"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {orderCopied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              )}
              <p className="mb-4 text-sm text-muted-foreground">
                {isRouteCredit
                  ? "The route customer order has been captured and is now ready for admin dispatch planning."
                  : "Your order has been received. Pay the exact amount below using M-Pesa Buy Goods."}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.72 }}
              className="mb-4 w-full rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left dark:border-emerald-800/40 dark:bg-emerald-900/10"
            >
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  {isRouteCredit
                    ? "Route order reference ready"
                    : hasPrivateTrackingLink
                      ? "Private tracking link ready"
                      : "Tracking access ready"}
                </p>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                {isRouteCredit
                  ? "Keep this order reference for dispatch, delivery confirmation, and route customer settlement."
                  : hasPrivateTrackingLink
                  ? "Keep this link private. It opens this order without asking for the phone number again."
                  : "Use this page with your tracking code, or recover the order with phone, total, and delivery area."}
              </p>
              <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                <Link2 className="h-4 w-4 flex-shrink-0 text-accent" />
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{trackingLabel}</span>
                <button
                  type="button"
                  onClick={copyTrackingLink}
                  className="inline-flex h-8 flex-shrink-0 items-center gap-1 rounded-md bg-secondary px-2 text-xs font-bold text-secondary-foreground transition-colors hover:bg-secondary/80"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
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
                  The customer pays when goods arrive unless their approved credit terms apply.
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mb-4 w-full overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-white text-left shadow-soft dark:border-amber-800/40 dark:from-amber-950/30 dark:via-orange-950/15 dark:to-card"
              >
                <div className="border-b border-amber-200/70 px-4 py-3 dark:border-amber-800/40">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground shadow-glow">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">Complete payment manually</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Automatic M-Pesa confirmation is currently under maintenance. Please pay with Buy Goods, then keep this order reference.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 p-4">
                  {[
                    { label: "Amount to pay", value: `KES ${formatMoney(amountDue)}`, copy: String(Math.round(Number(amountDue || 0))), key: "amount" },
                    { label: "Till number", value: TILL_NUMBER, copy: TILL_NUMBER, key: "till" },
                    { label: "Account / reference", value: orderId || "Your order number", copy: orderId || "", key: "reference" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-2 rounded-xl border border-border bg-background/85 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                        <p className="truncate font-display text-lg font-black text-foreground">{item.value}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => item.copy && copyPaymentValue(item.key, item.copy)}
                        className="inline-flex h-9 flex-shrink-0 items-center gap-1 rounded-lg bg-secondary px-3 text-xs font-black text-secondary-foreground transition-colors hover:bg-secondary/80"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copiedPaymentField === item.key ? "Copied" : "Copy"}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mx-4 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-900/10 dark:text-emerald-300">
                  Already paid? You are okay. Your order will update once our team confirms the M-Pesa receipt.
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
                {isRouteCredit ? "Open Route Order" : "Paid? Check Order Status"}
              </Link>
              {!isRouteCredit && (
                <Link
                  to="/products"
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background px-8 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  Continue Shopping
                </Link>
              )}
              <p className="text-xs text-muted-foreground">
                {isRouteCredit ? `Redirecting in ${countdown}s...` : "This window stays here so you can copy the payment details."}
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
